@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $cur = $settings->fixed_fee_currency ?: 'EUR';
        $major = fn (?int $minor) => $minor === null ? null : \App\Support\Money::fromMinor($minor, $cur);
        $fmt = fn (int $minor) => \App\Support\Money::format($minor, $example->currency);
        $scheduleLabels = ['on_request' => __('on request'), 'weekly' => __('weekly'), 'manual_only' => __('manual only')];
        $methodLabels = ['bank_transfer' => __('bank transfer'), 'ewallet' => __('ewallet'), 'manual' => __('manual'), 'stripe' => 'Stripe'];
        $intervalLabels = ['month' => __('month'), 'week' => __('week'), 'year' => __('year'), 'lifetime' => __('lifetime')];
    @endphp

    @include('admin.partials.flash')

    <div class="row">
        <div class="col-lg-8">
            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Ticket fees & payouts') }}</h2></div>
                <div class="card-body">
                    {{-- Nothing here is retroactive: every order stamps the fee it
                         charged, every ledger line its own amounts. Each change is
                         logged below with who made it. --}}
                    <form method="POST" action="{{ route('admin.fees.update', ['locale' => $locale]) }}">
                        @csrf
                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save fees')])

                        <h6 class="text-muted text-uppercase small mt-2">{{ __('Platform fee per paid ticket') }}</h6>
                        <div class="row g-3 mb-3">
                            <div class="col-md-3">
                                <label class="form-label small" for="platform_percent">{{ __('Percent') }}</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="platform_percent" name="platform_percent"
                                       value="{{ old('platform_percent', $settings->platform_percent_bps / 100) }}">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small" for="platform_fixed">{{ __('Fixed') }}</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="platform_fixed" name="platform_fixed"
                                       value="{{ old('platform_fixed', $major($settings->platform_fixed_cents)) }}">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small" for="fixed_fee_currency">{{ __('In currency') }}</label>
                                <input type="text" maxlength="3" class="form-control" id="fixed_fee_currency" name="fixed_fee_currency"
                                       value="{{ old('fixed_fee_currency', $cur) }}">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small" for="max_fee">{{ __('Cap per ticket') }}</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="max_fee" name="max_fee"
                                       value="{{ old('max_fee', $major($settings->max_fee_cents)) }}" placeholder="{{ __('No cap') }}">
                            </div>
                            <div class="col-md-6">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" role="switch" value="1" id="pass_fees_to_buyer" name="pass_fees_to_buyer"
                                           @checked(old('pass_fees_to_buyer', $settings->pass_fees_to_buyer))>
                                    <label class="form-check-label small" for="pass_fees_to_buyer">{{ __('Buyer pays the fee by default (organizers and events can override)') }}</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small" for="plus_fee_waiver_cap">{{ __('Plus: no fee on tickets up to') }}</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="plus_fee_waiver_cap" name="plus_fee_waiver_cap"
                                       value="{{ old('plus_fee_waiver_cap', $major($settings->plus_fee_waiver_cap_cents)) }}">
                            </div>
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small" for="refund_fee_policy">{{ __('Refunds give the fee back') }}</label>
                                <select class="form-control" id="refund_fee_policy" name="refund_fee_policy">
                                    @foreach(['on_cancellation' => __('Only when the event is cancelled'), 'always' => __('Always'), 'never' => __('Never')] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('refund_fee_policy', $settings->refund_fee_policy ?? 'on_cancellation') === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <h6 class="text-muted text-uppercase small">{{ __('Payouts') }}</h6>
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label small" for="payout_minimum">{{ __('Minimum') }}</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="payout_minimum" name="payout_minimum"
                                       value="{{ old('payout_minimum', $major($settings->payout_minimum_minor)) }}">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small" for="payout_hold_days">{{ __('Hold after the event (days)') }}</label>
                                <input type="number" min="0" class="form-control" id="payout_hold_days" name="payout_hold_days"
                                       value="{{ old('payout_hold_days', $settings->payout_hold_days) }}">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small" for="payout_schedule">{{ __('Schedule') }}</label>
                                <select class="form-control" id="payout_schedule" name="payout_schedule">
                                    @foreach($schedules as $s)
                                        <option value="{{ $s }}" @selected(old('payout_schedule', $settings->payout_schedule) === $s)>{{ $scheduleLabels[$s] ?? str_replace('_', ' ', $s) }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small" for="withholding_tax_percent">{{ __('Withholding tax %') }}</label>
                                <input type="number" step="0.01" min="0" class="form-control" id="withholding_tax_percent" name="withholding_tax_percent"
                                       value="{{ old('withholding_tax_percent', $settings->withholding_tax_bps / 100) }}">
                            </div>
                            <div class="col-12">
                                <span class="form-label small d-block">{{ __('Payout methods offered') }}</span>
                                @foreach($methods as $m)
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" name="payout_methods[]" value="{{ $m }}" id="pm-{{ $m }}"
                                               @checked(in_array($m, old('payout_methods', $settings->payout_methods ?? []), true))>
                                        <label class="form-check-label small" for="pm-{{ $m }}">{{ $methodLabels[$m] ?? str_replace('_', ' ', $m) }}</label>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">{{ __('Organizer plans') }}</h2>
                    <a class="btn btn-sm btn-secondary" href="{{ route('admin.billing.catalogue', ['locale' => $locale]) }}">{{ __('Edit plans') }}</a>
                </div>
                <div class="card-body">
                    <table class="table table-sm mb-0">
                        <thead><tr><th>{{ __('Plan') }}</th><th>{{ __('Price') }}</th><th>{{ __('Fee override') }}</th><th>{{ __('Limits') }}</th></tr></thead>
                        <tbody>
                        @forelse($plans as $plan)
                            <tr class="{{ $plan->is_active ? '' : 'text-muted' }}">
                                <td><strong>{{ $plan->name }}</strong> <span class="small text-muted">{{ $intervalLabels[$plan->interval] ?? $plan->interval }}</span></td>
                                <td class="small">{{ \App\Support\Money::format((int) $plan->price_cents, $plan->currency) }}</td>
                                <td class="small">
                                    @if($plan->fee_percent_bps !== null || $plan->fee_fixed_cents !== null)
                                        {{ ($plan->fee_percent_bps ?? $settings->platform_percent_bps) / 100 }}% + {{ \App\Support\Money::format((int) ($plan->fee_fixed_cents ?? $settings->platform_fixed_cents), $cur) }}
                                    @else
                                        <span class="text-muted">{{ __('Default') }}</span>
                                    @endif
                                </td>
                                <td class="small">
                                    @foreach(($plan->limits ?? []) as $key => $limit)
                                        <span class="badge bg-light text-dark">{{ str_replace('_', ' ', $key) }}: {{ is_bool($limit) ? ($limit ? __('yes') : __('no')) : ($limit ?? '∞') }}</span>
                                    @endforeach
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="4" class="text-muted">{{ __('No organizer plans.') }}</td></tr>
                        @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('A :price ticket today', ['price' => $fmt($example->price)]) }}</h2></div>
                <div class="card-body small">
                    <dl class="row mb-0">
                        <dt class="col-7 fw-normal">{{ __('Buyer pays') }}</dt><dd class="col-5 text-end"><strong>{{ $fmt($example->total) }}</strong></dd>
                        <dt class="col-7 fw-normal">{{ __('of which fee') }}</dt><dd class="col-5 text-end">{{ $fmt($example->buyerFee) }}</dd>
                        <dt class="col-7 fw-normal">{{ __('Eventgoo keeps') }}</dt><dd class="col-5 text-end">{{ $fmt($example->platformFee) }}</dd>
                        <dt class="col-7 fw-normal">{{ __('Organizer gets') }}</dt><dd class="col-5 text-end">{{ $fmt($example->organizerNet) }}</dd>
                    </dl>
                </div>
            </div>

            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Change log') }}</h2></div>
                <div class="card-body small">
                    <ul class="list-unstyled mb-0">
                        @forelse($changes as $change)
                            <li class="mb-2">
                                <code>{{ $change->field }}</code>: {{ $change->old_value === '' ? '—' : $change->old_value }} &rarr; {{ $change->new_value === '' ? '—' : $change->new_value }}
                                <div class="text-muted">{{ $change->user?->name ?? __('System') }} · {{ $change->created_at?->diffForHumans() }}</div>
                            </li>
                        @empty
                            <li class="text-muted">{{ __('No changes yet.') }}</li>
                        @endforelse
                    </ul>
                </div>
            </div>
        </div>
    </div>
@endsection
