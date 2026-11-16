<?php

declare(strict_types=1);

namespace App\Services\Solutions;

use App\Models\Event;
use App\Models\ExternalEventClaim;
use Illuminate\Support\Str;

/**
 * Read-only, limited event options for verified owner/admin memberships.
 * The intake service remains the sole authority for submission eligibility.
 */
final class BooketikInquiryEventChoices
{
    /**
     * @param array<int,array{id:string,name:string}> $organizers Already filtered by membership and active organization.
     * @return array<int,array{id:string,organizerId:string,title:string}>
     */
    public function forOrganizers(array $organizers): array
    {
        $ids = [];
        foreach ($organizers as $organizer) {
            $id = (string) ($organizer['id'] ?? '');
            if (Str::isUuid($id)) $ids[$id] = $id;
        }
        if ($ids === []) return [];
        $allowedIds = array_values($ids);
        $choices = [];
        $add = static function (string $eventId, string $organizerId, string $title) use (&$choices): void {
            if ($title === '') $title = 'Événement';
            $key = $organizerId.'|'.$eventId;
            $choices[$key] = [
                'id' => $eventId,
                'organizerId' => $organizerId,
                'title' => $title,
            ];
        };

        // Canonical events owned by a selected organization. Query never writes.
        $owned = Event::query()
            ->whereIn('organizer_id', $allowedIds)
            ->orderByDesc('starts_at')
            ->limit(250)
            ->get(['id', 'organizer_id', 'title']);
        foreach ($owned as $event) {
            $add((string) $event->id, (string) $event->organizer_id, (string) $event->title);
        }

        // An external event is eligible for display only after an approved claim
        // by the SAME organization. A claim does not grant selling rights.
        $claims = ExternalEventClaim::query()
            ->where('status', ExternalEventClaim::APPROVED)
            ->whereIn('organizer_id', $allowedIds)
            ->with('listing')
            ->limit(250)
            ->get(['id', 'organizer_id', 'listing_id']);
        $claimedIds = [];
        $claimedByEvent = [];
        foreach ($claims as $claim) {
            $eid = (string) ($claim->listing?->event_id ?? '');
            if (!Str::isUuid($eid)) continue;
            $claimedIds[$eid] = $eid;
            $claimedByEvent[$eid][] = (string) $claim->organizer_id;
        }
        if ($claimedIds !== []) {
            $events = Event::query()->whereIn('id', array_values($claimedIds))
                ->get(['id', 'title']);
            foreach ($events as $event) {
                foreach ($claimedByEvent[(string) $event->id] ?? [] as $organizerId) {
                    $add((string) $event->id, $organizerId, (string) $event->title);
                }
            }
        }
        $results = array_values($choices);
        usort($results, static fn (array $a, array $b): int =>
            strcmp(mb_strtolower($a['title']), mb_strtolower($b['title'])));
        return array_slice($results, 0, 500);
    }
}
