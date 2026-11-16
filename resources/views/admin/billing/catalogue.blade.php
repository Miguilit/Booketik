@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $money = fn ($minor, $currency) => \App\Support\Money::format((int) $minor, strtoupper($currency ?: 'USD'));

        // A price is typed in major units, in the currency's own precision:
        // 9.99 for dollars, 15000 for rupiah.
        $exponent = fn ($currency) => \App\Support\Money::exponent(strtoupper($currency ?: 'USD'));
        $step = fn ($currency) => $exponent($currency) === 0 ? '1' : '0.'.str_repeat('0', $exponent($currency) - 1).'1';
        $major = fn ($minor, $currency) => number_format(
            \App\Support\Money::fromMinor((int) $minor, strtoupper($currency ?: 'USD')),
            $exponent($currency), '.', '',
        );

        $short = [
            'stripe' => 'Stripe', 'lemonsqueezy' => 'Lemon', 'polar' => 'Polar',
            'paddle' => 'Paddle', 'creem' => 'Creem', 'dodopay' => 'Dodo',
        ];

        $columns = collect($providers)->only($configured)->keys();
        if ($columns->isEmpty()) {
            $columns = collect([$default]);
        }

        $rowId = fn (array $row) => $row['kind'].'-'.$row['id'];

        $intervals = ['month' => __('Monthly'), 'week' => __('Weekly'), 'year' => __('Yearly'), 'lifetime' => __('Lifetime (charged once)')];

        // A provider's product carries the price it was created at. When the
        // catalogue's price moves on, every product still quotes the old one.
        $stale = fn (array $row) => $row['products']->first(fn ($product) => (int) $product->amount_cents !== $row['price_cents']
            || strtoupper((string) ($product->currency ?: $row['currency'])) !== $row['currency']);
    @endphp

    @include('admin.partials.flash')

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <h2 class="mb-0">{{ __('Plans & products') }}</h2>
            <div>
                <a class="btn btn-sm btn-secondary"
                   href="{{ route('admin.billing.providers', ['locale' => $locale]) }}">{{ __('Payment providers') }}</a>
                <a class="btn btn-sm btn-secondary"
                   href="{{ route('admin.fees.edit', ['locale' => $locale]) }}">{{ __('Ticket fees') }}</a>

                <button class="btn btn-sm btn-primary" data-drawer="#new-plan">{{ __('Add plan') }}</button>
            </div>
        </div>

        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>{{ __('Product') }}</th>
                            <th>{{ __('Audience') }}</th>
                            <th class="text-right">{{ __('Price') }}</th>
                            <th>{{ __('Sold through') }}</th>
                            <th class="text-right">{{ __('Members') }}</th>
                            <th>{{ __('On sale') }}</th>
                            <x-row-actions-header />
                        </tr>
                    </thead>
                    <tbody>
                    @foreach($catalogue as $row)
                        <tr class="{{ $row['active'] ? '' : 'text-muted' }}" data-sellable="{{ $rowId($row) }}">
                            <td class="text-nowrap">
                                <strong>{{ $row['name'] }}</strong>
                                <div class="small text-muted"><code>{{ $row['slug'] }}</code></div>
                            </td>
                            <td class="small text-nowrap">
                                {{-- Plus is sold to attendees (and in the app through
                                     RevenueCat); organizer plans on the web only. --}}
                                <span class="badge badge-{{ $row['audience'] === \App\Enums\PlanAudience::Organizer ? 'info' : 'secondary' }}">
                                    {{ $row['audience'] === \App\Enums\PlanAudience::Organizer ? __('Organizer') : __('Attendee (Plus)') }}
                                </span>
                                <div class="text-muted">{{ $row['interval'] }} · {{ $row['billing'] }}</div>
                            </td>
                            <td class="text-right text-nowrap">
                                <strong>{{ $money($row['price_cents'], $row['currency']) }}</strong>
                                @if($row['trial_days'] > 0)
                                    <div class="small text-muted">{{ __(':days d trial', ['days' => $row['trial_days']]) }}</div>
                                @endif
                                @if($row['matrix'] > 0)
                                    <div class="small text-muted">{{ trans_choice('+ :count currency|+ :count currencies', $row['matrix']) }}</div>
                                @endif
                            </td>
                            <td class="small" style="min-width:210px">
                                @foreach($columns as $provider)
                                    @php $product = $row['products'][$provider] ?? null; @endphp
                                    <span class="badge badge-{{ $product ? 'success' : 'secondary' }} mr-1"
                                          @style(['opacity:.45' => ! $product])
                                          title="{{ $product
                                              ? $product->checkoutId().($product->mode === 'sandbox' ? ' · '.__('sandbox') : '')
                                              : __('Not sold through :provider', ['provider' => $providers[$provider]['label'] ?? $provider]) }}">
                                        {{ $short[$provider] ?? $provider }}{{ $product && $product->mode === 'sandbox' ? '*' : '' }}
                                    </span>
                                @endforeach
                                @if($row['store_id'])
                                    <span class="badge badge-info" title="{{ $row['store_id'] }}">{{ __('Store') }}</span>
                                @endif
                                @if($stale($row))
                                    <span class="badge badge-warning" title="{{ __('Re-create products to use the current price.') }}">{{ __('price stale') }}</span>
                                @endif
                            </td>
                            <td class="text-right">{{ number_format($row['members']) }}</td>
                            <td>
                                <form method="POST" data-async="toggle"
                                      data-async-label="{{ $row['active'] ? __('Taking off sale') : __('Putting on sale') }}"
                                      action="{{ route('admin.billing.sellables.active', [
                                          'locale' => $locale, 'kind' => $row['kind'], 'id' => $row['id'],
                                      ]) }}">
                                    @csrf
                                    <input type="hidden" name="active" value="{{ $row['active'] ? 0 : 1 }}">
                                    <div class="form-check form-switch mb-0">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                               id="sale-{{ $rowId($row) }}" @checked($row['active'])
                                               onchange="this.form.requestSubmit()">
                                        <label class="form-check-label sr-only" for="sale-{{ $rowId($row) }}">{{ __('On sale') }}</label>
                                    </div>
                                </form>
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#edit-plan-{{ $row['id'] }}">
                                        <i class="mdi mdi-pencil" aria-hidden="true"></i>
                                        <span>{{ __('Edit plan') }}</span>
                                    </a>

                                    <a class="row-actions-item" role="menuitem" data-drawer="#sell-{{ $rowId($row) }}">
                                        <i class="mdi mdi-credit-card-outline" aria-hidden="true"></i>
                                        <span>{{ __('Sell through…') }}</span>
                                    </a>

                                    @if($row['products']->isNotEmpty())
                                        {{-- A provider's product keeps the price it was created at;
                                             this is how a price change reaches them. --}}
                                        <x-row-action-form icon="sync" tone="" method="POST" async="sync" :async-label="__('Re-creating products')"
                                                           :action="route('admin.billing.sellables.resync', ['locale' => $locale, 'kind' => $row['kind'], 'id' => $row['id']])"
                                                           :confirm="__('Re-create :product at every provider?', ['product' => $row['name']])">
                                            {{ __('Re-create at every provider') }}
                                        </x-row-action-form>
                                    @endif

                                    {{-- The per-currency prices a buyer is actually charged. --}}
                                        <x-row-action icon="tune-variant"
                                                      :href="route('admin.billing.plans.prices', ['locale' => $locale]).'#plan-'.$row['id']">{{ __('Prices by currency') }}</x-row-action>
                                        <x-row-action icon="account-multiple-outline"
                                                      :href="route('admin.billing.subscriptions', ['locale' => $locale, 'plan' => $row['id']])">{{ __('Members') }}</x-row-action>
                                        <x-row-actions-divider />
                                        <x-row-action-form method="DELETE" icon="delete"
                                                           :action="route('admin.billing.plans.delete', ['locale' => $locale, 'id' => $row['id']])"
                                                           :confirm="__('Delete :name?', ['name' => $row['name']])">
                                            {{ __('Delete plan') }}
                                        </x-row-action-form>
                                </x-row-actions>
                            </td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {{-- One drawer per row: which providers sell this, with the id each knows
         it by. Attaching here and attaching from a provider page write the same
         row — this is the same question asked from the other side. --}}
    @foreach($catalogue as $row)
        <x-drawer :id="'sell-'.$rowId($row)" :title="__('Sell through')" :subtitle="$row['name']" :wide="true">
            <table class="table table-sm mb-0">
                <thead>
                    <tr><th>{{ __('Provider') }}</th><th>{{ __('Product id') }}</th><th>{{ __('Mode') }}</th><th class="text-right">{{ __('Action') }}</th></tr>
                </thead>
                <tbody>
                @foreach($columns as $provider)
                    @php
                        $product = $row['products'][$provider] ?? null;
                        $label = $providers[$provider]['label'] ?? $provider;
                    @endphp
                    <tr>
                        <td class="small text-nowrap">
                            {{ $label }}
                            @if($provider === $default)
                                <span class="badge badge-success ml-1">{{ __('Default') }}</span>
                            @endif
                        </td>
                        <td class="small" style="word-break:break-all">
                            @if($product)
                                <code>{{ $product->checkoutId() }}</code>
                            @else
                                <span class="text-muted">—</span>
                            @endif
                        </td>
                        <td class="small">
                            @if($product)
                                <span class="badge badge-{{ $product->mode === 'sandbox' ? 'warning' : 'secondary' }}">{{ ($product->mode ?: 'live') === 'sandbox' ? __('sandbox') : (($product->mode ?: 'live') === 'live' ? __('live') : $product->mode) }}</span>
                            @else
                                <span class="text-muted">—</span>
                            @endif
                        </td>
                        <td class="text-right text-nowrap">
                            @if($product)
                                <form method="POST" class="d-inline"
                                      action="{{ route('admin.billing.providers.detach', [
                                          'locale' => $locale, 'name' => $provider,
                                          'kind' => $row['kind'], 'id' => $row['id'],
                                      ]) }}"
                                      data-confirm="{{ __('Stop selling :product through :provider?', ['product' => $row['name'], 'provider' => $label]) }}">
                                    @csrf @method('DELETE')
                                    <button class="btn btn-sm btn-secondary">{{ __('Remove') }}</button>
                                </form>
                            @else
                                <form method="POST" class="d-inline"
                                      action="{{ route('admin.billing.providers.attach', ['locale' => $locale, 'name' => $provider]) }}">
                                    @csrf
                                    <input type="hidden" name="kind" value="{{ $row['kind'] }}">
                                    <input type="hidden" name="id" value="{{ $row['id'] }}">
                                    <input type="hidden" name="mode" value="{{ ($providers[$provider]['sandbox'] ?? false) ? 'sandbox' : 'live' }}">
                                    <button class="btn btn-sm btn-primary">{{ __('Attach') }}</button>
                                </form>
                            @endif
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Close') }}</button>
                <a class="btn btn-sm btn-primary"
                   href="{{ route('admin.billing.providers', ['locale' => $locale]) }}">{{ __('Sync products') }}</a>
            </x-slot>
        </x-drawer>
    @endforeach

    @foreach($catalogue as $row)
        @continue($row['kind'] !== 'plan')
        @php $plan = $row['model']; @endphp

        <x-drawer :id="'edit-plan-'.$plan->id" :title="$plan->name" :subtitle="$plan->slug">
            <form id="plan-form-{{ $plan->id }}" method="POST"
                  action="{{ route('admin.billing.plans.update', ['locale' => $locale, 'id' => $plan->id]) }}">
                @csrf
                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Plan') }}</div>
                    <div class="form-row">
                        <div class="col-7 mb-3">
                            <label class="form-label small">{{ __('Name') }}</label>
                            <input type="text" name="name" class="form-control" value="{{ $plan->name }}" required>
                        </div>
                        <div class="col-5 mb-3">
                            <label class="form-label small">{{ __('Slug') }}</label>
                            <input type="text" name="slug" class="form-control" value="{{ $plan->slug }}" required>
                        </div>
                        <div class="col-6 mb-3">
                            <label class="form-label small">{{ __('Interval') }}</label>
                            <select name="interval" class="form-control">
                                @foreach($intervals as $value => $text)
                                    <option value="{{ $value }}" @selected($plan->interval === $value)>{{ $text }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-6 mb-3">
                            <label class="form-label small">{{ __('Billing') }}</label>
                            {{-- A 7- or 30-day pass is a week or a month charged once. --}}
                            <select name="billing_type" class="form-control">
                                <option value="recurring" @selected($plan->billing_type !== 'one_time')>{{ __('Recurring') }}</option>
                                <option value="one_time" @selected($plan->billing_type === 'one_time')>{{ __('One time (pass)') }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                @include('admin.billing._plan-terms', ['plan' => $plan, 'prefix' => 'p'.$plan->id])

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Price') }}</div>
                    <div class="form-row">
                        <div class="col-5 mb-3">
                            <label class="form-label small">{{ __('Price') }}</label>
                            <div class="input-group">
                                <input type="number" min="0" step="{{ $step($plan->currency) }}" name="price" class="form-control"
                                       value="{{ $major($plan->price_cents, $plan->currency) }}" required>
                                <div class="input-group-append">
                                    <span class="input-group-text">{{ strtoupper($plan->currency ?: 'USD') }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-3 mb-3">
                            <label class="form-label small">{{ __('Currency') }}</label>
                            <input type="text" maxlength="3" name="currency" class="form-control" value="{{ $plan->currency }}" required>
                        </div>
                        <div class="col-4 mb-3">
                            <label class="form-label small">{{ __('Trial days') }}</label>
                            <input type="number" min="0" name="trial_days" class="form-control" value="{{ $plan->trial_days }}">
                        </div>
                    </div>
                </div>

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Paywall & store') }}</div>
                    <div class="form-row">
                        <div class="col-5 mb-3">
                            <label class="form-label small">{{ __('Sort order') }}</label>
                            <input type="number" min="0" name="sort_order" class="form-control" value="{{ $plan->sort_order }}">
                        </div>
                        <div class="col-7 mb-3">
                            <label class="form-label small">{{ __('Store product id') }}</label>
                            <input type="text" name="revenuecat_product_id" class="form-control"
                                   value="{{ $plan->revenuecat_product_id }}" placeholder="{{ __('RevenueCat (mobile only)') }}">
                        </div>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" name="is_active" value="1"
                               id="active-{{ $plan->id }}" @checked($plan->is_active)>
                        <label class="form-check-label small" for="active-{{ $plan->id }}">{{ __('On sale') }}</label>
                    </div>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="plan-form-{{ $plan->id }}">{{ __('Save') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach

    <x-drawer id="new-plan" :title="__('Add plan')" :subtitle="__('Catalogue')">
        <form id="new-plan-form" method="POST" action="{{ route('admin.billing.plans.store', ['locale' => $locale]) }}">
            @csrf
            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Plan') }}</div>
                <div class="form-row">
                    <div class="col-7 mb-3">
                        <label class="form-label small" for="new-name">{{ __('Name') }}</label>
                        <input type="text" class="form-control" id="new-name" name="name" required>
                    </div>
                    <div class="col-5 mb-3">
                        <label class="form-label small" for="new-slug">{{ __('Slug') }}</label>
                        <input type="text" class="form-control" id="new-slug" name="slug" required>
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label small" for="new-interval">{{ __('Interval') }}</label>
                        <select class="form-control" id="new-interval" name="interval" required>
                            @foreach($intervals as $value => $text)
                                <option value="{{ $value }}">{{ $text }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label small" for="new-billing">{{ __('Billing') }}</label>
                        <select class="form-control" id="new-billing" name="billing_type">
                            <option value="recurring">{{ __('Recurring') }}</option>
                            <option value="one_time">{{ __('One time (pass)') }}</option>
                        </select>
                    </div>
                </div>
            </div>

            @include('admin.billing._plan-terms', ['plan' => null, 'prefix' => 'new'])

            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Price') }}</div>
                <div class="form-row">
                    <div class="col-5 mb-3">
                        <label class="form-label small" for="new-price">{{ __('Price') }}</label>
                        <div class="input-group">
                            <input type="number" min="0" step="any" class="form-control" id="new-price"
                                   name="price" value="9.99" required>
                            <div class="input-group-append"><span class="input-group-text">USD</span></div>
                        </div>
                    </div>
                    <div class="col-3 mb-3">
                        <label class="form-label small" for="new-currency">{{ __('Currency') }}</label>
                        <input type="text" maxlength="3" class="form-control" id="new-currency" name="currency" value="USD" required>
                    </div>
                    <div class="col-4 mb-3">
                        <label class="form-label small" for="new-trial">{{ __('Trial days') }}</label>
                        <input type="number" min="0" class="form-control" id="new-trial" name="trial_days" value="0">
                    </div>
                </div>
            </div>

            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Paywall & store') }}</div>
                <div class="form-row">
                    <div class="col-5 mb-3">
                        <label class="form-label small" for="new-order">{{ __('Sort order') }}</label>
                        <input type="number" min="0" class="form-control" id="new-order" name="sort_order"
                               value="{{ count($catalogue) + 1 }}">
                    </div>
                    <div class="col-7 mb-3">
                        <label class="form-label small" for="new-product">{{ __('Store product id') }}</label>
                        <input type="text" class="form-control" id="new-product" name="revenuecat_product_id"
                               placeholder="{{ __('RevenueCat (mobile only)') }}">
                    </div>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" name="is_active" value="1" id="new-active">
                    <label class="form-check-label small" for="new-active">{{ __('Put on sale now') }}</label>
                </div>
            </div>
        </form>

        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
            <button class="btn btn-sm btn-primary" form="new-plan-form">{{ __('Add plan') }}</button>
        </x-slot>
    </x-drawer>

    {{-- The sync log, for "Re-create at every provider". Opened by the script
         once the answer is in; the hidden trigger is what it clicks. --}}
    <button type="button" class="d-none" data-drawer="#sync-log" aria-hidden="true" tabindex="-1"></button>

    <x-drawer id="sync-log" :title="__('Sync log')" :subtitle="__('Not run yet')" :wide="true">
        <div class="cl-log" data-sync-log>
            <p class="text-muted small mb-0">{{ __('Nothing yet.') }}</p>
        </div>

        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Close') }}</button>
        </x-slot>
    </x-drawer>
@endsection
