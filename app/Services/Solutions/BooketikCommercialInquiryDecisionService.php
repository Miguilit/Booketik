<?php

declare(strict_types=1);

namespace App\Services\Solutions;

use App\Models\BooketikCommercialInquiry;
use App\Support\Solutions\CommercialInquiryDecisionPolicy;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Moves a LEAD through human review; never changes plan, order, ticket, checkout or payment. */
final class BooketikCommercialInquiryDecisionService
{
    /** @return array{status:string,decision_id:string} */
    public function decide(string $inquiryId, int $adminId, array $input): array
    {
        return DB::transaction(function () use ($inquiryId, $adminId, $input): array {
            $item = BooketikCommercialInquiry::query()->whereKey($inquiryId)->lockForUpdate()->firstOrFail();
            $old = (string) $item->status;
            $expectedStatus = (string) $input['expected_status'];
            $expectedTimestamp = (string) $input['expected_updated_at'];
            if ($old !== $expectedStatus || $item->updated_at?->format('Y-m-d H:i:s') !== $expectedTimestamp) {
                throw ValidationException::withMessages(['state' => ['REQUEST_CHANGED_REFRESH_REQUIRED']]);
            }
            $action = (string) $input['decision_action'];
            $next = CommercialInquiryDecisionPolicy::nextStatus((string) $item->kind, $old, $action);
            if ($next === null) {
                throw ValidationException::withMessages(['decision_action' => ['INVALID_INQUIRY_STATE_TRANSITION']]);
            }
            $note = trim((string) $input['reason']);
            $decisionId = (string) Str::uuid();
            $now = now();
            $item->forceFill(['status' => $next])->save();
            DB::table('booketik_commercial_inquiry_decisions')->insert([
                'id' => $decisionId,
                'inquiry_id' => (string) $item->id,
                'organizer_id' => (string) $item->organizer_id,
                'acted_by' => $adminId,
                'action' => $action,
                'from_status' => $old,
                'to_status' => $next,
                'reason' => $note,
                'created_at' => $now,
            ]);
            return ['status' => $next, 'decision_id' => $decisionId];
        }, 3);
    }
}
