@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $tz = $event->timezone;
        $local = fn ($at) => $at?->copy()->setTimezone($tz)->format('Y-m-d\TH:i');
        $failed = old('_drawer');
        $inQueue = in_array($event->moderation_status, \App\Support\Moderation::QUEUE, true);
        $statusLabels = [
            'draft' => __('Draft'), 'scheduled' => __('Scheduled'), 'published' => __('Published'),
            'cancelled' => __('Cancelled'), 'postponed' => __('Postponed'), 'ended' => __('Ended'),
        ];
        $visibilityLabels = ['public' => __('Public'), 'unlisted' => __('Unlisted'), 'private' => __('Private')];
        $formatLabels = ['in_person' => __('in person'), 'online' => __('online'), 'hybrid' => __('hybrid')];
        $guestListLabels = ['public' => __('public'), 'after_rsvp' => __('after rsvp'), 'count_only' => __('count only'), 'hidden' => __('hidden')];
        $kindLabels = ['community' => __('community'), 'ticketed' => __('ticketed'), 'conference' => __('conference')];
        $availabilityLabels = [
            'available' => __('available'), 'few_left' => __('few left'), 'sold_out' => __('sold out'),
            'waitlist' => __('waitlist'), 'ended' => __('ended'), 'cancelled' => __('cancelled'),
        ];
        $ticketKindLabels = ['free' => __('free'), 'paid' => __('paid'), 'donation' => __('donation')];
        $registrationLabels = [
            'pending' => __('Pending'), 'approved' => __('Approved'), 'declined' => __('Declined'), 'waitlisted' => __('Waitlisted'),
            'going' => __('Going'), 'cancelled' => __('Cancelled'), 'attended' => __('Attended'),
        ];
    @endphp

    @include('admin.partials.flash')

    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
            <a href="{{ route('admin.events.index', ['locale' => $locale]) }}" class="small">&larr; {{ __('Events') }}</a>
            <h2 class="mb-0">{{ $event->title }}</h2>
            <div class="small text-muted">
                {{ $event->organizer?->name }} · <code>{{ $event->slug }}</code>
                · {{ $kindLabels[$kind->value] ?? $kind->value }} · {{ $availabilityLabels[$availability->value] ?? str_replace('_', ' ', $availability->value) }}
                @if($event->series) · {{ __('part of “:series”', ['series' => $event->series->title]) }} @endif
            </div>
        </div>
        <div class="d-flex gap-2">
            <a class="btn btn-sm btn-secondary" href="{{ route('admin.events.registrations', ['locale' => $locale, 'event' => $event->id]) }}">{{ __('Guests') }}</a>
            <a class="btn btn-sm btn-secondary" href="{{ route('admin.check-ins.index', ['locale' => $locale, 'event' => $event->id]) }}">{{ __('Check-ins (:count)', ['count' => $event->check_ins_count]) }}</a>
            <form method="POST" action="{{ route('admin.events.hide', ['locale' => $locale, 'event' => $event->id]) }}">
                @csrf
                <input type="hidden" name="hidden" value="{{ $event->hidden_at ? 0 : 1 }}">
                <button class="btn btn-sm {{ $event->hidden_at ? 'btn-success' : 'btn-outline-danger' }}">{{ $event->hidden_at ? __('Unhide') : __('Hide from feeds') }}</button>
            </form>
        </div>
    </div>

    <div class="row">
        <div class="col-lg-8">
            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Basics') }}</h2></div>
                <div class="card-body">
                    {{-- Staff correct, organizers author: the description, page look,
                         agenda and questions are edited in the organizer dashboard. --}}
                    <form method="POST" action="{{ route('admin.events.update', ['locale' => $locale, 'event' => $event->id]) }}">
                        @csrf
                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save event')])

                        <div class="row g-3">
                            <div class="col-md-8">
                                <label class="form-label small" for="title">{{ __('Title') }}</label>
                                <input type="text" class="form-control" id="title" name="title" value="{{ old('title', $event->title) }}" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="category_id">{{ __('Category') }}</label>
                                <select class="form-control" id="category_id" name="category_id">
                                    <option value="">{{ __('None') }}</option>
                                    @foreach($categories as $c)
                                        <option value="{{ $c->id }}" @selected(old('category_id', $event->category_id) === $c->id)>{{ $c->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label small" for="summary">{{ __('Summary') }}</label>
                                <input type="text" class="form-control" id="summary" name="summary" value="{{ old('summary', $event->summary) }}">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="status">{{ __('Status') }}</label>
                                <select class="form-control" id="status" name="status">
                                    @foreach($statuses as $s)
                                        <option value="{{ $s->value }}" @selected(old('status', $event->status->value) === $s->value)>{{ $statusLabels[$s->value] ?? ucfirst($s->value) }}</option>
                                    @endforeach
                                </select>
                                <span class="small text-muted">{{ __('Cancelling voids free tickets and withdraws waitlist offers.') }}</span>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="visibility">{{ __('Visibility') }}</label>
                                <select class="form-control" id="visibility" name="visibility">
                                    @foreach($visibilities as $v)
                                        <option value="{{ $v->value }}" @selected(old('visibility', $event->visibility->value) === $v->value)>{{ $visibilityLabels[$v->value] ?? ucfirst($v->value) }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="format">{{ __('Format') }}</label>
                                <select class="form-control" id="format" name="format">
                                    @foreach($formats as $f)
                                        <option value="{{ $f->value }}" @selected(old('format', $event->format->value) === $f->value)>{{ $formatLabels[$f->value] ?? str_replace('_', ' ', $f->value) }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="timezone">{{ __('Timezone') }}</label>
                                <select class="form-control" id="timezone" name="timezone">
                                    @foreach($timezones as $zone)
                                        <option value="{{ $zone }}" @selected(old('timezone', $tz) === $zone)>{{ $zone }}</option>
                                    @endforeach
                                </select>
                            </div>
                            {{-- Typed and shown in the event's own zone. --}}
                            <div class="col-md-4">
                                <label class="form-label small" for="starts_at">{{ __('Starts (local)') }}</label>
                                <input type="datetime-local" class="form-control" id="starts_at" name="starts_at" value="{{ old('starts_at', $local($event->starts_at)) }}" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="ends_at">{{ __('Ends (local)') }}</label>
                                <input type="datetime-local" class="form-control" id="ends_at" name="ends_at" value="{{ old('ends_at', $local($event->ends_at)) }}">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="capacity">{{ __('Capacity') }}</label>
                                <input type="number" min="1" class="form-control" id="capacity" name="capacity" value="{{ old('capacity', $event->capacity) }}" placeholder="{{ __('No cap') }}">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="guest_list_visibility">{{ __('Guest list') }}</label>
                                <select class="form-control" id="guest_list_visibility" name="guest_list_visibility">
                                    @foreach($guestLists as $g)
                                        <option value="{{ $g->value }}" @selected(old('guest_list_visibility', $event->guest_list_visibility->value) === $g->value)>{{ $guestListLabels[$g->value] ?? str_replace('_', ' ', $g->value) }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="age_min">{{ __('Minimum age') }}</label>
                                <input type="number" min="0" max="99" class="form-control" id="age_min" name="age_min" value="{{ old('age_min', $event->age_min) }}">
                            </div>
                            <div class="col-12">
                                <label class="form-label small" for="refund_policy">{{ __('Refund policy') }}</label>
                                <input type="text" class="form-control" id="refund_policy" name="refund_policy" value="{{ old('refund_policy', $event->refund_policy) }}">
                            </div>
                            <div class="col-md-6">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" role="switch" value="1" name="approval_required" id="approval_required" @checked(old('approval_required', $event->approval_required))>
                                    <label class="form-check-label small" for="approval_required">{{ __('Guests need approval') }}</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" role="switch" value="1" name="waitlist_enabled" id="waitlist_enabled" @checked(old('waitlist_enabled', $event->waitlist_enabled))>
                                    <label class="form-check-label small" for="waitlist_enabled">{{ __('Waitlist when full') }}</label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">{{ __('Ticket types') }}</h2>
                    <button type="button" class="btn btn-sm btn-primary" data-drawer="#new-tier">{{ __('Add tier') }}</button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead>
                                <tr><th>{{ __('Tier') }}</th><th>{{ __('Price') }}</th><th class="text-end">{{ __('Sold / qty') }}</th><th>{{ __('Sales window (local)') }}</th><x-row-actions-header /></tr>
                            </thead>
                            <tbody>
                            @forelse($event->ticketTypes as $tier)
                                <tr class="{{ $tier->is_hidden ? 'text-muted' : '' }}">
                                    <td>
                                        <strong>{{ $tier->name }}</strong>
                                        <div class="small text-muted">{{ $ticketKindLabels[$tier->kind->value] ?? $tier->kind->value }}@if($tier->is_hidden) · {{ __('hidden (code)') }}@endif @unless($tier->transferable) · {{ __('not transferable') }} @endunless</div>
                                    </td>
                                    <td class="small">{{ $tier->price_cents > 0 ? \App\Support\Money::format($tier->price_cents, $tier->currency) : __('Free') }}</td>
                                    <td class="text-end small">{{ number_format($tier->sold) }} / {{ $tier->quantity === null ? '∞' : number_format($tier->quantity) }}</td>
                                    <td class="small">{{ $tier->sales_start_at ? $local($tier->sales_start_at) : __('now') }} → {{ $tier->sales_end_at ? $local($tier->sales_end_at) : __('event') }}</td>
                                    <td class="row-actions-col">
                                        <x-row-actions>
                                            <a class="row-actions-item" role="menuitem" data-drawer="#tier-{{ $tier->id }}"><i class="mdi mdi-pencil" aria-hidden="true"></i><span>{{ __('Edit') }}</span></a>
                                            <x-row-actions-divider />
                                            <x-row-action-form icon="delete" tone="danger"
                                                               :action="route('admin.ticket-types.delete', ['locale' => $locale, 'event' => $event->id, 'ticketType' => $tier->id])"
                                                               :confirm="__('Delete this tier? One with tickets is hidden and closed instead.')">{{ __('Delete') }}</x-row-action-form>
                                        </x-row-actions>
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="5" class="text-muted">{{ __('No tiers — registration creates a free RSVP tier on first sign-up.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Review') }}</h2></div>
                <div class="card-body">
                    <p class="mb-2"><strong>{{ \App\Support\Moderation::label($event->moderation_status) }}</strong>
                        @if($event->reviewed_at)<span class="small text-muted">· {{ $event->reviewer?->name }}, {{ $event->reviewed_at->diffForHumans() }}</span>@endif
                    </p>
                    @if($event->review_notes)
                        <div class="small border rounded p-2 mb-3">{{ $event->review_notes }}</div>
                    @endif
                    <form method="POST" action="{{ route('admin.events.approve', ['locale' => $locale, 'event' => $event->id]) }}" class="mb-2">
                        @csrf
                        <button class="btn btn-sm btn-success w-100" @disabled($event->moderation_status === \App\Support\Moderation::APPROVED)>{{ __('Approve') }}</button>
                    </form>
                    <form method="POST" action="{{ route('admin.events.changes', ['locale' => $locale, 'event' => $event->id]) }}">
                        @csrf
                        <textarea class="form-control form-control-sm mb-2" name="review_notes" rows="3" placeholder="{{ __('What needs to change — the organizer sees exactly this') }}">{{ old('review_notes') }}</textarea>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-warning flex-fill">{{ __('Request changes') }}</button>
                            <button class="btn btn-sm btn-outline-danger flex-fill"
                                    formaction="{{ route('admin.events.reject', ['locale' => $locale, 'event' => $event->id]) }}">{{ __('Reject') }}</button>
                        </div>
                    </form>
                    @if($inQueue)<p class="small text-muted mt-2 mb-0">{{ __('Submitted :time.', ['time' => $event->submitted_at?->diffForHumans()]) }}</p>@endif
                </div>
            </div>

            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Guests') }}</h2></div>
                <div class="card-body">
                    <dl class="row mb-0 small">
                        <dt class="col-7">{{ __('Seats taken') }}</dt><dd class="col-5 text-end">{{ number_format($seatsTaken) }}{{ $event->capacity ? ' / '.number_format($event->capacity) : '' }}</dd>
                        @foreach(\App\Enums\RegistrationStatus::cases() as $s)
                            <dt class="col-7 fw-normal">{{ $registrationLabels[$s->value] ?? ucfirst($s->value) }}</dt><dd class="col-5 text-end">{{ number_format((int) ($registrationCounts[$s->value] ?? 0)) }}</dd>
                        @endforeach
                        <dt class="col-7 fw-normal">{{ __('Reports') }}</dt><dd class="col-5 text-end">{{ $event->reports_count }}</dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>

    @foreach($event->ticketTypes->concat([null]) as $tier)
        @php
            $drawerId = $tier ? 'tier-'.$tier->id : 'new-tier';
            $refill = $failed === $drawerId;
            $v = fn (string $field, $default = null) => $refill ? old($field) : $default;
        @endphp
        <x-drawer :id="$drawerId" :title="$tier?->name ?? __('New tier')" :subtitle="$tier ? __(':count sold', ['count' => $tier->sold]) : null" :autoopen="$refill">
            <form id="{{ $drawerId }}-form" method="POST"
                  action="{{ $tier ? route('admin.ticket-types.update', ['locale' => $locale, 'event' => $event->id, 'ticketType' => $tier->id]) : route('admin.ticket-types.store', ['locale' => $locale, 'event' => $event->id]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="{{ $drawerId }}">
                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Tier') }}</div>
                    <div class="row g-2">
                        <div class="col-12 mb-2">
                            <label class="form-label small">{{ __('Name') }}</label>
                            <input type="text" class="form-control" name="name" value="{{ $v('name', $tier?->name) }}" required>
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small">{{ __('Kind') }}</label>
                            <select class="form-control" name="kind">
                                @foreach(\App\Enums\TicketKind::cases() as $k)
                                    <option value="{{ $k->value }}" @selected($v('kind', $tier?->kind->value ?? 'free') === $k->value)>{{ $ticketKindLabels[$k->value] ?? $k->value }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-3 mb-2">
                            <label class="form-label small">{{ __('Price') }}</label>
                            <input type="number" step="0.01" min="0" class="form-control" name="price"
                                   value="{{ $v('price', $tier ? \App\Support\Money::fromMinor($tier->price_cents, $tier->currency) : 0) }}" @disabled($tier && $tier->sold > 0)>
                            @if($tier && $tier->sold > 0)<input type="hidden" name="price" value="{{ \App\Support\Money::fromMinor($tier->price_cents, $tier->currency) }}">@endif
                        </div>
                        <div class="col-3 mb-2">
                            <label class="form-label small">{{ __('Currency') }}</label>
                            <input type="text" maxlength="3" class="form-control" name="currency" value="{{ $v('currency', $tier?->currency ?? 'EUR') }}" required>
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small">{{ __('Quantity') }}</label>
                            <input type="number" min="0" class="form-control" name="quantity" value="{{ $v('quantity', $tier?->quantity) }}" placeholder="{{ __('No limit') }}">
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small">{{ __('Max per order') }}</label>
                            <input type="number" min="1" class="form-control" name="max_per_order" value="{{ $v('max_per_order', $tier?->max_per_order ?? 10) }}">
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small">{{ __('Sales start (local)') }}</label>
                            <input type="datetime-local" class="form-control" name="sales_start_at" value="{{ $v('sales_start_at', $local($tier?->sales_start_at)) }}">
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small">{{ __('Sales end (local)') }}</label>
                            <input type="datetime-local" class="form-control" name="sales_end_at" value="{{ $v('sales_end_at', $local($tier?->sales_end_at)) }}">
                        </div>
                        <div class="col-12 mb-2">
                            <label class="form-label small">{{ __('Description') }}</label>
                            <textarea class="form-control" name="description" rows="2">{{ $v('description', $tier?->description) }}</textarea>
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small">{{ __('Unlock code (hidden tiers)') }}</label>
                            <input type="text" class="form-control" name="unlock_code" value="{{ $v('unlock_code', $tier?->unlock_code) }}">
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small">{{ __('Order') }}</label>
                            <input type="number" min="0" class="form-control" name="sort_order" value="{{ $v('sort_order', $tier?->sort_order ?? 0) }}">
                        </div>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" value="1" name="is_hidden" id="{{ $drawerId }}-hidden" @checked($refill ? old('is_hidden') : ($tier?->is_hidden ?? false))>
                        <label class="form-check-label small" for="{{ $drawerId }}-hidden">{{ __('Hidden — offered only with the unlock code') }}</label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" value="1" name="transferable" id="{{ $drawerId }}-transferable" @checked($refill ? old('transferable') : ($tier?->transferable ?? true))>
                        <label class="form-check-label small" for="{{ $drawerId }}-transferable">{{ __('Transferable') }}</label>
                    </div>
                </div>
            </form>
            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="{{ $drawerId }}-form">{{ $tier ? __('Save tier') : __('Add tier') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach
@endsection
