{{--
    What a plan is and unlocks: audience, the copy on the pricing table, its
    limits and — for organizer plans — its override of the ticket fee.

    Shared by the edit and the create drawers. The limits are a fixed set of
    named fields rather than free JSON: SubscriptionPlan::limit() is read by
    key, and a key typed by hand that is one letter off is a limit that never
    applies.
--}}
@php
    $audience = $plan?->audience?->value ?? 'organizer';
    $limits = $plan?->limits ?? [];
    $booketikOffers = \Illuminate\Support\Facades\Schema::hasTable('booketik_event_service_offers')
        ? \App\Models\BooketikEventServiceOffer::query()
            ->orderBy('order_index')->get(['code','min_tickets','max_tickets'])
        : collect();
    $limitFields = [
        'events_per_month' => [__('Events per month'), __('Organizer')],
        'team_seats' => [__('Team seats'), __('Organizer')],
        'ai_credits' => [__('AI credits / month'), __('Both')],
        'fee_waiver_cap_cents' => [__('No-fee price cap (minor units)'), 'Plus'],
        'presale_hours' => [__('Presale head start (hours)'), 'Plus'],
    ];
@endphp
<div class="cl-drawer__section">
    <div class="cl-drawer__section-title">{{ __('Audience & copy') }}</div>
    <div class="form-row">
        <div class="col-6 mb-3">
            <label class="form-label small" for="{{ $prefix }}-audience">{{ __('Sold to') }}</label>
            <select class="form-control" id="{{ $prefix }}-audience" name="audience">
                <option value="organizer" @selected($audience === 'organizer')>{{ __('Organizers (Free / Pro / Business)') }}</option>
                <option value="attendee" @selected($audience === 'attendee')>{{ __('Attendees (Eventgoo Plus)') }}</option>
            </select>
        </div>
        <div class="col-6 mb-3">
            <label class="form-label small" for="{{ $prefix }}-desc">{{ __('Tagline') }}</label>
            <input type="text" class="form-control" id="{{ $prefix }}-desc" name="description" value="{{ $plan?->description }}">
        </div>
        <div class="col-12 mb-3">
            <label class="form-label small" for="{{ $prefix }}-features">{{ __('Features (one per line)') }}</label>
            <textarea class="form-control" rows="3" id="{{ $prefix }}-features" name="features_text">{{ implode("\n", $plan?->features ?? []) }}</textarea>
        </div>
    </div>
</div>

<div class="cl-drawer__section">
    <div class="cl-drawer__section-title">{{ __('Limits') }}</div>
    <p class="small text-muted mb-2">{{ __('Blank means unlimited, or not part of this plan.') }}</p>
    <div class="form-row">
        @foreach($limitFields as $key => [$label, $for])
            <div class="col-6 mb-3">
                <label class="form-label small" for="{{ $prefix }}-limit-{{ $key }}">{{ $label }} <span class="text-muted">· {{ $for }}</span></label>
                <input type="number" min="0" class="form-control" id="{{ $prefix }}-limit-{{ $key }}"
                       name="limits[{{ $key }}]" value="{{ $limits[$key] ?? '' }}">
            </div>
        @endforeach
        {{-- BOOKETIK_TIER_SELECT_V1 --}}
        <div class="col-12 mb-3">
            <label class="form-label small" for="{{ $prefix }}-booketik-tier">{{ match(app()->getLocale()) { 'nl' => 'Bijbehorende prestatietrap', 'en' => 'Associated service tier', default => 'Palier de prestation associé' } }}</label>
            <select class="form-control" id="{{ $prefix }}-booketik-tier" name="limits[booketik_offer_code]">
                <option value="">{{ match(app()->getLocale()) { 'nl' => 'Geen', 'en' => 'None', default => 'Aucun' } }}</option>
                @foreach($booketikOffers as $offer)
                    <option value="{{ $offer->code }}" @selected((string) ($limits['booketik_offer_code'] ?? '') === (string) $offer->code)>{{ ucfirst(str_replace(['-', '_'], ' ', $offer->code)) }} — {{ (int) $offer->min_tickets }}–{{ $offer->max_tickets === null ? '∞' : (int) $offer->max_tickets }} {{ match(app()->getLocale()) { 'nl' => 'tickets', 'en' => 'tickets', default => 'billets' } }}</option>
                @endforeach
            </select>
            <small class="form-text text-muted">{{ match(app()->getLocale()) { 'nl' => 'Grenzen uit de bestaande prestatierooster; geen automatische prijs- of ticketrechten.', 'en' => 'Bounds from the existing service grid; no automatic price or ticket rights.', default => 'Bornes issues de la grille existante, sans modification des prix ni des droits de billetterie.' } }}</small>
        </div>
        <div class="col-6 mb-3">
            <label class="form-label small" for="{{ $prefix }}-limit-theme">{{ __('Custom event theme') }}</label>
            <select class="form-control" id="{{ $prefix }}-limit-theme" name="limits[custom_theme]">
                <option value="" @selected(! isset($limits['custom_theme']))>{{ __('Not included') }}</option>
                <option value="1" @selected(($limits['custom_theme'] ?? false) === true)>{{ __('Included') }}</option>
            </select>
        </div>
    </div>
</div>

<div class="cl-drawer__section">
    <div class="cl-drawer__section-title">{{ __('Ticket fee override') }}</div>
    {{-- Organizer plans only: an organizer on Business pays a lower platform
         fee. Blank falls back to the default on Plans & Fees. --}}
    <div class="form-row">
        <div class="col-6 mb-3">
            <label class="form-label small" for="{{ $prefix }}-fee-bps">{{ __('Percent (basis points)') }}</label>
            <input type="number" min="0" max="10000" class="form-control" id="{{ $prefix }}-fee-bps"
                   name="fee_percent_bps" value="{{ $plan?->fee_percent_bps }}" placeholder="{{ __('e.g. 350 = 3.5%') }}">
        </div>
        <div class="col-6 mb-3">
            <label class="form-label small" for="{{ $prefix }}-fee-fixed">{{ __('Fixed per ticket (minor units)') }}</label>
            <input type="number" min="0" class="form-control" id="{{ $prefix }}-fee-fixed"
                   name="fee_fixed_cents" value="{{ $plan?->fee_fixed_cents }}" placeholder="{{ __('e.g. :example', ['example' => 29]) }}">
        </div>
    </div>
</div>
