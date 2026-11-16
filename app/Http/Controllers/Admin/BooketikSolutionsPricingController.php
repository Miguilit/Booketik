<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BooketikEventServiceOffer;
use App\Models\BooketikEventServiceOfferRevision;
use App\Support\Solutions\EventServiceOfferPolicy as Policy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;
use InvalidArgumentException;
use RuntimeException;

/**
 * R1M: private, gated administrator draft/approval workflow for per-event service offers.
 * No checkout, subscription, ticket-capacity mutation or public endpoint.
 * Must live behind the existing auth + staff + admin web middleware.
 */
final class BooketikSolutionsPricingController extends Controller
{
    public function index(): View
    {
        $this->assertAccess();
        $this->assertSchema();
        return view('admin.solutions.offers', [
            'offers' => BooketikEventServiceOffer::query()->orderBy('order_index')->orderBy('id')->get(),
        ]);
    }

    public function update(Request $request, string $locale, string $code): RedirectResponse
    {
        $this->assertAccess();
        $this->assertSchema();
        abort_if(config('eventgoo.demo_mode') === true, 403);
        abort_unless((bool) preg_match('/^[a-z0-9_\-]{2,48}$/D', $code), 404);
        if ($request->input('_pricing_action') === 'thresholds') {
            return $this->updateThresholds($request, $code);
        }
        $v = $request->validate([
            'expected_version' => ['required','integer','min:1'],
            'price_eur' => ['nullable','string','max:16'],
            'vat_mode' => ['required','in:pending,inclusive,exclusive,exempt'],
            'status' => ['required','in:draft,approved'],
            'visible' => ['required','boolean'],
            'featured' => ['required','boolean'],
            'title' => ['required','array'],
            'description' => ['required','array'],
            'cta_label' => ['required','array'],
            'title.*' => ['nullable','string','max:100'],
            'description.*' => ['nullable','string','max:500'],
            'cta_label.*' => ['nullable','string','max:100'],
        ]);
        try {
            DB::transaction(function () use ($code, $v): void {
                $o = BooketikEventServiceOffer::query()->where('code', $code)->lockForUpdate()->firstOrFail();
                if ((int) $o->version !== (int) $v['expected_version']) throw new RuntimeException('STALE_OFFER_VERSION');
                $texts = [];
                foreach (Policy::LOCALES as $lang) {
                    $texts[$lang] = [
                        'title' => trim((string)($v['title'][$lang] ?? '')),
                        'description' => trim((string)($v['description'][$lang] ?? '')),
                        'cta_label' => trim((string)($v['cta_label'][$lang] ?? '')),
                    ];
                }
                $price = Policy::cents($v['price_eur'] ?? null, $o->pricing_mode);
                $update = [
                    'min_tickets' => (int) $o->min_tickets,
                    'max_tickets' => $o->max_tickets === null ? null : (int) $o->max_tickets,
                    'pricing_mode' => $o->pricing_mode,
                    'price_minor' => $price,
                    'vat_mode' => $v['vat_mode'],
                    'status' => $v['status'],
                    'translations' => $texts,
                ];
                Policy::validate($update);
                // Checkout gates never change here, even for an approved offer.
                $o->forceFill([
                    'price_minor' => $price,
                    'vat_mode' => $v['vat_mode'],
                    'status' => $v['status'],
                    'visible' => (bool) $v['visible'],
                    'featured' => (bool) $v['featured'],
                    'translations' => $texts,
                    'version' => (int) $o->version + 1,
                    'approved_by' => $v['status'] === 'approved' ? Auth::id() : null,
                    'approved_at' => $v['status'] === 'approved' ? now() : null,
                ])->save();
                BooketikEventServiceOfferRevision::query()->create([
                    'offer_id' => $o->id,
                    'version' => (int) $o->version,
                    'snapshot' => $o->fresh()->only([
                        'code','min_tickets','max_tickets','pricing_mode','price_minor','currency',
                        'vat_mode','status','visible','featured','order_index','translations','version',
                    ]),
                    'actor_id' => (int) Auth::id(),
                    'created_at' => now(),
                ]);
            }, 3);
        } catch (InvalidArgumentException | RuntimeException $e) {
            throw ValidationException::withMessages(['offer' => $e->getMessage()]);
        }
        return back()->with('success', 'Offre mise à jour. Les ventes et la page publique restent désactivées.');
    }

    /**
     * R1M3B: change all boundaries atomically, under one transaction.
     * The starting point of each tier is derived from the previous maximum;
     * this prevents gaps, overlaps, and transient incoherent pricing.
     *
     * No purchase / quota entitlement is ever created by this operation.
     */
    private function updateThresholds(Request $request, string $code): RedirectResponse
    {
        $v = $request->validate([
            'expected_versions' => ['required', 'array', 'min:2', 'max:12'],
            'expected_versions.*' => ['required', 'integer', 'min:1'],
            'upper_bounds' => ['required', 'array', 'min:1', 'max:11'],
            'upper_bounds.*' => ['required', 'integer', 'min:1', 'max:10000000'],
            'confirm_free_tier_change' => ['sometimes', 'boolean'],
        ]);
        try {
            $changed = DB::transaction(function () use ($v, $code): int {
                $rows = BooketikEventServiceOffer::query()
                    ->orderBy('order_index')->orderBy('id')->lockForUpdate()->get();
                if ($rows->count() < 2 || $rows->count() > 12 || $rows->first()->code !== $code) {
                    throw new RuntimeException('CATALOG_BOUNDARY_SHAPE_CHANGED');
                }
                $allCodes = $rows->pluck('code')->all();
                $editableCodes = array_slice($allCodes, 0, -1);
                $expectedCodes = array_keys($v['expected_versions']);
                $boundsCodes = array_keys($v['upper_bounds']);
                sort($allCodes); sort($expectedCodes);
                sort($editableCodes); sort($boundsCodes);
                if ($expectedCodes !== $allCodes || $boundsCodes !== $editableCodes) {
                    throw new RuntimeException('CATALOG_FORM_STALE_OR_INCOMPLETE');
                }
                $ranges = Policy::contiguousRanges($rows->pluck('code')->all(),
                    array_map(static fn($n): int => (int) $n, $v['upper_bounds']));
                $updates = [];
                $freeLimitChanged = false;
                foreach ($rows as $o) {
                    if ((int) $v['expected_versions'][$o->code] !== (int) $o->version) {
                        throw new RuntimeException('STALE_CATALOG_VERSION');
                    }
                    $newMin = $ranges[$o->code]['min'];
                    $newMax = $ranges[$o->code]['max'];
                    $candidate = [
                        'min_tickets' => $newMin,
                        'max_tickets' => $newMax,
                        'pricing_mode' => $o->pricing_mode,
                        'price_minor' => $o->price_minor,
                        'vat_mode' => $o->vat_mode,
                        'status' => $o->status,
                        'translations' => $o->translations,
                    ];
                    Policy::validate($candidate);
                    if ($newMin !== (int) $o->min_tickets || $newMax !== ($o->max_tickets === null ? null : (int) $o->max_tickets)) {
                        // An approved tier must be explicitly returned to draft
                        // through the original approval workflow before its quota changes.
                        if ($o->status !== 'draft' || $o->visible) {
                            throw new RuntimeException('TIER_MUST_BE_DRAFT_AND_INVISIBLE_BEFORE_BOUNDARY_CHANGE:'.$o->code);
                        }
                        if ($o->pricing_mode === 'fixed' && (int) $o->price_minor === 0 && $newMax !== $o->max_tickets) {
                            $freeLimitChanged = true;
                        }
                        $updates[] = [$o, $newMin, $newMax];
                    }
                }
                if ($freeLimitChanged && !($v['confirm_free_tier_change'] ?? false)) {
                    throw new RuntimeException('CONFIRM_FREE_TIER_QUOTA_CHANGE');
                }
                foreach ($updates as [$o, $min, $max]) {
                    $o->forceFill([
                        'min_tickets' => $min,
                        'max_tickets' => $max,
                        'version' => (int) $o->version + 1,
                    ])->save();
                    BooketikEventServiceOfferRevision::query()->create([
                        'offer_id' => $o->id,
                        'version' => (int) $o->version,
                        'snapshot' => $o->fresh()->only([
                            'code','min_tickets','max_tickets','pricing_mode','price_minor','currency',
                            'vat_mode','status','visible','featured','order_index','translations','version',
                        ]),
                        'actor_id' => (int) Auth::id(),
                        'created_at' => now(),
                    ]);
                }
                return count($updates);
            }, 3);
        } catch (InvalidArgumentException | RuntimeException $e) {
            throw ValidationException::withMessages(['thresholds' => $e->getMessage()]);
        }
        return back()->with('success', $changed.' palier(s) mis à jour en brouillon. Les ventes et les quotas restent désactivés.');
    }

    private function assertAccess(): void
    {
        abort_unless(Auth::check() && config('booketik_solutions.admin_enabled') === true &&
            config('booketik_solutions.pricing_admin_enabled') === true &&
            config('booketik_solutions.public_enabled') === false &&
            config('booketik_solutions.pricing_public_enabled') === false, 404);
    }

    private function assertSchema(): void
    {
        abort_unless(Schema::hasTable('booketik_event_service_offers') && Schema::hasTable('booketik_event_service_offer_revisions'), 503);
    }
}
