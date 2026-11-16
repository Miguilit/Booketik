<?php

declare(strict_types=1);

namespace App\Services\Solutions;

use App\Enums\OrganizerRole;
use App\Models\BooketikCommercialInquiry;
use App\Models\BooketikEventServiceOffer;
use App\Models\Event;
use App\Models\ExternalEventClaim;
use App\Models\Organizer;
use App\Models\User;
use App\Support\Solutions\CommercialInquiryPolicy;
use App\Support\Solutions\CommercialInquiryAdmission;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

/**
 * R1N2L hardened intake; current public and submission gates remain OFF.
 * Idempotent write of lead only, with organizer and event authority re-checked server-side.
 */
final class BooketikCommercialInquiryIntake
{
    /**
     * @param array{organizer_id:string,kind:string,request_key:string,event_id?:?string,offer_code?:?string,message?:?string} $input
     * @return array{id:string,status:string,replayed:bool}
     */
    public function submit(User $user, array $input): array
    {
        abort_unless(config('booketik_solutions_inquiries.enabled') === true, 404);
        abort_unless(config('booketik_solutions.public_enabled') === false, 409);
        abort_unless(config('booketik_solutions.commercial_checkout_enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiries.payment_execution_enabled') === false, 409);
        abort_unless(Schema::hasTable('booketik_commercial_inquiries'), 503, 'INQUIRY_SCHEMA_NOT_READY');

        $kind = $input['kind'];
        $kindGate = $kind === 'quote' ? 'quote_enabled' : 'discovery_review_enabled';
        abort_unless(config('booketik_solutions_inquiries.'.$kindGate) === true, 404);
        abort_unless(in_array($kind, CommercialInquiryPolicy::KINDS, true), 422);

        $org = Organizer::query()->active()->whereKey($input['organizer_id'])->firstOrFail();
        $role = $org->roleOf($user);
        $eventId = $input['event_id'] ?? null;
        $event = $eventId ? Event::query()->with('externalListing')->whereKey($eventId)->firstOrFail() : null;
        $isOwned = $event !== null && (string) $event->organizer_id === (string) $org->id;
        $approved = false;
        if ($event !== null && $event->externalListing !== null) {
            $approved = ExternalEventClaim::query()
                ->where('listing_id', $event->externalListing->id)
                ->where('organizer_id', $org->id)
                ->where('status', ExternalEventClaim::APPROVED)->exists();
        }
        $decision = CommercialInquiryPolicy::assess([
            'kind' => $kind,
            'email_verified' => $user->email_verified_at !== null,
            'organizer_active' => $org->isActive(),
            'organizer_member_authorized' => in_array($role, [OrganizerRole::Owner, OrganizerRole::Admin], true),
            'event_supplied' => $event !== null,
            'event_belongs_to_organizer' => $isOwned,
            'approved_claim_for_organizer_and_listing' => $approved,
        ]);
        if (!$decision['admissible']) {
            throw ValidationException::withMessages(['eligibility' => $decision['reasons']]);
        }

        // Normalize empty offer codes so different clients cannot bypass semantic
        // duplicate detection with null versus an empty string.
        $offerCode = trim((string) ($input['offer_code'] ?? ''));
        $offerCode = $offerCode !== '' ? $offerCode : null;
        $record = [
            'organizer_id' => (string) $org->id,
            'requested_by' => (int) $user->id,
            'event_id' => $event ? (string) $event->id : null,
            'kind' => $kind,
            'offer_code' => $offerCode,
            'message' => trim((string) ($input['message'] ?? '')),
        ];
        $fingerprint = hash('sha256', json_encode($record, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
        $key = $input['request_key'];

        // The existing request key is authoritative for idempotent replay. Semantic
        // duplicate checks only apply to NEW keys, not a legitimate same-key retry.
        $lookup = fn () => BooketikCommercialInquiry::query()
            ->where('organizer_id', $record['organizer_id'])
            ->where('requested_by', $record['requested_by'])
            ->where('request_key', $key)->first();

        try {
            return DB::transaction(function () use ($org, $user, $record, $fingerprint, $key, $kind, $lookup) {
                // Serialize requests for the same organization. A query-only duplicate
                // check outside this lock would admit concurrent DIFFERENT keys.
                $locked = Organizer::query()->whereKey($org->id)->lockForUpdate()->firstOrFail();
                if (!$locked->isActive() || !in_array($locked->roleOf($user), [OrganizerRole::Owner, OrganizerRole::Admin], true)) {
                    throw ValidationException::withMessages(['eligibility' => ['ORGANIZER_OWNER_OR_ADMIN_REQUIRED']]);
                }
                $existing = $lookup();
                if ($existing !== null) return $this->replay($existing, $fingerprint);

                // A quoted tier must exist in the canonical published and visible
                // catalogue. Null remains valid for a GENERAL quote inquiry.
                $this->assertSelectableOffer($kind, $record['offer_code']);

                $scope = CommercialInquiryAdmission::duplicateScope($record);
                $pending = BooketikCommercialInquiry::query()
                    ->where('organizer_id', $scope['organizer_id'])
                    ->where('kind', $scope['kind'])
                    ->whereIn('status', CommercialInquiryAdmission::BLOCKING_STATUSES)
                    ->when($scope['event_id'] !== null,
                        fn ($q) => $q->where('event_id', $scope['event_id']),
                        fn ($q) => $q->whereNull('event_id'))
                    ->when($scope['offer_code'] !== null,
                        fn ($q) => $q->where('offer_code', $scope['offer_code']),
                        fn ($q) => $q->whereNull('offer_code'))
                    ->exists();
                // Never reveal another organizer member's request ID or message.
                abort_if($pending, 409, 'COMMERCIAL_INQUIRY_ALREADY_OPEN');

                $created = BooketikCommercialInquiry::query()->create($record + [
                    'request_key' => $key,
                    'payload_hash' => $fingerprint,
                    'status' => 'pending',
                ]);
                return ['id' => (string) $created->id, 'status' => 'pending', 'replayed' => false];
            }, 3);
        } catch (QueryException $e) {
            // Unique idempotency-key collision. Do NOT swallow unrelated SQL failures.
            $existing = $lookup();
            if ($existing === null) throw $e;
            return $this->replay($existing, $fingerprint);
        }
    }

    private function assertSelectableOffer(string $kind, ?string $code): void
    {
        if ($code !== null && $code !== '') {
            abort_unless(Schema::hasTable('booketik_event_service_offers'), 503, 'OFFER_CATALOG_NOT_READY');
            $offer = BooketikEventServiceOffer::query()->where('code', $code)
                ->first(['code', 'status', 'visible']);
            $metadata = $offer === null ? null : [
                'code' => (string) $offer->code,
                'status' => (string) $offer->status,
                'visible' => (bool) $offer->visible,
            ];
        } else {
            $metadata = null;
        }
        if (!CommercialInquiryAdmission::selectableOffer($kind, $code, $metadata)) {
            throw ValidationException::withMessages(['offer_code' => ['OFFER_NOT_AVAILABLE']]);
        }
    }

    /** @return array{id:string,status:string,replayed:bool} */
    private function replay(BooketikCommercialInquiry $existing, string $fingerprint): array
    {
        abort_unless(hash_equals((string) $existing->payload_hash, $fingerprint), 409, 'IDEMPOTENCY_PAYLOAD_MISMATCH');
        return ['id' => (string) $existing->id, 'status' => (string) $existing->status, 'replayed' => true];
    }
}
