<?php

declare(strict_types=1);

namespace App\Services\Solutions;

use App\Models\BooketikEventServiceOffer;
use App\Support\Solutions\EventServiceOfferPolicy as Policy;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * BOOKETIK Solutions R1M4 — read-only, admin-route-only preview adapter.
 *
 * The database is the pricing authority; the React data shape is not.
 * Drafts are rendered as cards ONLY inside the authenticated Superadmin
 * preview. A 'published' status below is an internal presentational adapter
 * expected by the existing React component, NEVER a persisted approval.
 *
 * No API route, payment intent, fee application, entitlement, ticket quota
 * mutation or public catalogue is exposed by this service.
 */
final class BooketikEventServiceCatalog
{
    public function previewOffers(string $locale): array
    {
        if (config('booketik_solutions.admin_enabled') !== true
            || config('booketik_solutions.pricing_admin_enabled') !== true
            || config('booketik_solutions.pricing_preview_enabled') !== true
            || config('booketik_solutions.public_enabled') !== false
            || config('booketik_solutions.pricing_public_enabled') !== false
            || !Auth::check()
            || !request()->routeIs('admin.solutions.preview')) {
            return [];
        }
        if (!Schema::hasTable('booketik_event_service_offers')) {
            return [];
        }

        // Limit+1 detects unexpected extra catalog rows; fail closed instead
        // of publishing a truncated set of mutually dependent quota bands.
        $rows = BooketikEventServiceOffer::query()
            ->orderBy('order_index')->orderBy('id')->limit(13)->get();
        $total = $rows->count();
        if ($total < 2 || $total > 12) {
            return [];
        }

        $out = [];
        $previousMax = 0;
        foreach ($rows as $index => $offer) {
            if ($offer->currency !== 'EUR'
                || !in_array($offer->status, ['draft', 'approved'], true)
                || (int) $offer->min_tickets !== $previousMax + 1) {
                return [];
            }
            $max = $offer->max_tickets === null ? null : (int) $offer->max_tickets;
            $last = $index === $total - 1;
            if (($last && $max !== null) || (!$last && ($max === null || $max < $offer->min_tickets))) {
                return [];
            }
            if (!$last) {
                $previousMax = $max;
            }

            $translations = (array) $offer->translations;
            try {
                Policy::validate([
                    'min_tickets' => (int) $offer->min_tickets,
                    'max_tickets' => $max,
                    'pricing_mode' => $offer->pricing_mode,
                    'price_minor' => $offer->price_minor,
                    'vat_mode' => $offer->vat_mode,
                    'status' => $offer->status,
                    'translations' => $translations,
                ]);
            } catch (InvalidArgumentException $exception) {
                return [];
            }
            // The English fallback must have a real title; silently rendering
            // unnamed offers makes an incomplete draft look like a saleable plan.
            if (trim(Policy::translated($translations, 'en', 'title')) === '') {
                return [];
            }

            $out[] = [
                'key' => (string) $offer->code,
                'order' => (int) $offer->order_index,
                'visible' => true,         // PRIVATE preview presentational flag
                'status' => 'published',   // React card filter only; DB unchanged
                'source_status' => (string) $offer->status,
                'featured' => (bool) $offer->featured,
                'title' => $this->localizedMap($translations, 'title'),
                'description' => $this->localizedMap($translations, 'description'),
                'category' => $this->ranges((int) $offer->min_tickets, $max),
                'price' => [
                    'currency' => 'EUR',
                    'minor' => $offer->price_minor,
                    'formatted' => Policy::formattedPrice($offer->price_minor, $offer->pricing_mode, $locale),
                    'vat_mode' => (string) $offer->vat_mode,
                ],
                'quota' => ['basis' => 'tickets_issued', 'min' => (int) $offer->min_tickets, 'max' => $max],
                'features' => [],
                'cta' => ['label' => $this->localizedMap($translations, 'cta_label'), 'enabled' => false, 'href' => null],
                'purchasable' => false,
                'checkout_url' => null,
                'preview_only' => true,
                'payment_provider_fees_included' => false,
                'miguil_pay_application_fee' => null, // no fees configured or charged in R1M4
            ];
        }
        return $out;
    }

    private function ranges(int $min, ?int $max): array
    {
        return [
            'fr' => $max === null ? 'Dès '.$min.' billets' : $min.' à '.$max.' billets',
            'nl' => $max === null ? 'Vanaf '.$min.' tickets' : $min.' tot '.$max.' tickets',
            'en' => $max === null ? 'From '.$min.' tickets' : $min.' to '.$max.' tickets',
        ];
    }

    private function localizedMap(array $translations, string $field): array
    {
        $out = [];
        foreach (Policy::LOCALES as $locale) {
            $out[$locale] = Policy::translated($translations, $locale, $field);
        }
        return $out;
    }
}
