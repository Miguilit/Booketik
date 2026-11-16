@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $money = fn ($minor, $currency) => \App\Support\Money::format((int) $minor, strtoupper($currency ?: 'USD'));

        // Only plans are sold through a card provider; tickets settle through
        // the ticket checkout, not through a provider product.
        $kindLabel = ['plan' => __('Subscription')];
        $kindTone = ['plan' => 'secondary'];
        $drawerId = fn (array $s) => 'product-'.$s['kind'].'-'.$s['id'];
    @endphp

    @include('admin.partials.flash')

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <div>
                <h2 class="mb-0">{{ $label }}</h2>
                <div class="small text-muted">
                    <code>{{ $name }}</code>
                    @if($configured)
                        · {{ $sandbox ? __('sandbox') : __('live') }}
                    @else
                        · {{ __('no credentials') }}
                    @endif
                    @if($isDefault) · {{ __('default') }} @endif
                </div>
            </div>
            <div>
                <a class="btn btn-sm btn-secondary"
                   href="{{ route('admin.billing.providers', ['locale' => $locale]) }}">{{ __('All providers') }}</a>
                @if($attachable['plan'])
                    <button class="btn btn-sm btn-secondary" data-drawer="#attach-product">{{ __('Sell an existing plan') }}</button>
                @endif
                <button class="btn btn-sm btn-primary" data-drawer="#add-provider-plan">{{ __('Add plan') }}</button>
            </div>
        </div>

        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>{{ __('Product') }}</th>
                            <th>{{ __('Kind') }}</th>
                            <th class="text-right">{{ __('Price') }}</th>
                            <th>{{ __('Product id') }}</th>
                            <th>{{ __('Price id') }}</th>
                            <th>{{ __('Mode') }}</th>
                            <th>{{ __('Sold here') }}</th>
                            <th>{{ __('On sale') }}</th>
                            <x-row-actions-header />
                        </tr>
                    </thead>
                    <tbody>
                    @foreach($sellables as $sellable)
                        @php $product = $sellable['product']; @endphp
                        <tr class="{{ $sellable['active'] ? '' : 'text-muted' }}"
                            data-sellable="{{ $sellable['kind'] }}-{{ $sellable['id'] }}">
                            <td class="text-nowrap">
                                <strong>{{ $sellable['name'] }}</strong>
                                <div class="small text-muted"><code>{{ $sellable['slug'] }}</code></div>
                            </td>
                            <td class="small text-nowrap">
                                <span class="badge badge-{{ $kindTone[$sellable['kind']] }}">
                                    {{ $kindLabel[$sellable['kind']] }}
                                </span>
                                <div class="text-muted">{{ $sellable['note'] }}</div>
                            </td>
                            <td class="text-right text-nowrap">
                                {{ $money($sellable['price_cents'], $sellable['currency']) }}
                            </td>
                            <td class="small" style="word-break:break-all" data-cell="product_id">
                                @if($product?->product_id)
                                    <code>{{ $product->product_id }}</code>
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td class="small" style="word-break:break-all" data-cell="price_id">
                                @if($product?->price_id)
                                    <code>{{ $product->price_id }}</code>
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td class="small text-nowrap" data-cell="mode">
                                @if($product)
                                    <span class="badge badge-{{ $product->mode === 'sandbox' ? 'warning' : 'secondary' }}">
                                        {{ ($product->mode ?: 'live') === 'sandbox' ? __('sandbox') : (($product->mode ?: 'live') === 'live' ? __('live') : $product->mode) }}
                                    </span>
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td data-cell="sold">
                                @if($product)
                                    <span class="badge badge-success">{{ __('Yes') }}</span>
                                @else
                                    <span class="badge badge-secondary">{{ __('No') }}</span>
                                @endif
                            </td>
                            {{-- The plan's own flag, which is what the paywall reads.
                                 Submits on change; nothing reloads. --}}
                            <td>
                                <form method="POST" data-async="toggle"
                                      data-async-label="{{ $sellable['active'] ? __('Taking off sale') : __('Putting on sale') }}"
                                      action="{{ route('admin.billing.sellables.active', [
                                          'locale' => $locale, 'kind' => $sellable['kind'], 'id' => $sellable['id'],
                                      ]) }}">
                                    @csrf
                                    <input type="hidden" name="active" value="{{ $sellable['active'] ? 0 : 1 }}">
                                    <div class="form-check form-switch mb-0">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                               id="sale-{{ $sellable['kind'] }}-{{ $sellable['id'] }}"
                                               @checked($sellable['active'])
                                               onchange="this.form.requestSubmit()">
                                        <label class="form-check-label sr-only"
                                               for="sale-{{ $sellable['kind'] }}-{{ $sellable['id'] }}">{{ __('On sale') }}</label>
                                    </div>
                                </form>
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#{{ $drawerId($sellable) }}">
                                        <i class="mdi mdi-pencil" aria-hidden="true"></i>
                                        <span>{{ __('Edit product') }}</span>
                                    </a>
                                    {{-- Creates this one product over there, rather than
                                         walking the whole catalogue to make one thing. --}}
                                    <x-row-action-form method="POST" icon="sync" tone=""
                                                       async="sync"
                                                       :async-label="__('Syncing :provider', ['provider' => $sellable['name']])"
                                                       :action="route('admin.billing.providers.product.sync', [
                                                           'locale' => $locale, 'name' => $name,
                                                           'kind' => $sellable['kind'], 'id' => $sellable['id'],
                                                       ])">
                                        {{ __('Sync this product') }}
                                    </x-row-action-form>
                                    <x-row-action icon="tag-outline"
                                                  :href="route('admin.billing.catalogue', ['locale' => $locale])">{{ __('Plan pricing') }}</x-row-action>

                                    @if($sellable['product'])
                                        <x-row-actions-divider />
                                        {{-- Unlinks from this provider only. The plan is shared —
                                             deleting it from here would delete it from every other
                                             provider too, which is not what "remove from Stripe"
                                             means to anybody. --}}
                                        <x-row-action-form method="DELETE" icon="link-off"
                                                           :action="route('admin.billing.providers.detach', [
                                                               'locale' => $locale, 'name' => $name,
                                                               'kind' => $sellable['kind'], 'id' => $sellable['id'],
                                                           ])"
                                                           :confirm="__('Stop selling :product through :provider?', ['product' => $sellable['name'], 'provider' => $label])">
                                            {{ __('Remove from :provider', ['provider' => $label]) }}
                                        </x-row-action-form>
                                    @endif
                                </x-row-actions>
                            </td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    @foreach($sellables as $sellable)
        @php $product = $sellable['product']; @endphp
        <x-drawer :id="$drawerId($sellable)" :title="$sellable['name']"
                  :subtitle="$label.' · '.$kindLabel[$sellable['kind']]">
            <form id="{{ $drawerId($sellable) }}-form" method="POST"
                  action="{{ route('admin.billing.providers.product', [
                      'locale' => $locale, 'name' => $name,
                      'kind' => $sellable['kind'], 'id' => $sellable['id'],
                  ]) }}">
                @csrf
                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('What :provider calls this', ['provider' => $label]) }}</div>
                    <div class="mb-3">
                        <label class="form-label small" for="{{ $drawerId($sellable) }}-pid">{{ __('Product id') }}</label>
                        <input type="text" class="form-control" id="{{ $drawerId($sellable) }}-pid" name="product_id"
                               value="{{ $product->product_id ?? '' }}" autocomplete="off">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small" for="{{ $drawerId($sellable) }}-prid">{{ __('Price id') }}</label>
                        <input type="text" class="form-control" id="{{ $drawerId($sellable) }}-prid" name="price_id"
                               value="{{ $product->price_id ?? '' }}" autocomplete="off">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small" for="{{ $drawerId($sellable) }}-mode">{{ __('Mode') }}</label>
                        <select class="form-control" id="{{ $drawerId($sellable) }}-mode" name="mode">
                            <option value="live" @selected(($product->mode ?? 'live') !== 'sandbox')>{{ __('Live') }}</option>
                            <option value="sandbox" @selected(($product->mode ?? '') === 'sandbox')>{{ __('Sandbox / test') }}</option>
                        </select>
                    </div>
                </div>

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('This product') }}</div>
                    <div class="small">
                        <div>{{ $kindLabel[$sellable['kind']] }} · {{ $sellable['note'] }}</div>
                        <div>{{ $money($sellable['price_cents'], $sellable['currency']) }}</div>
                    </div>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="{{ $drawerId($sellable) }}-form">{{ __('Save') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach

    {{-- Adding a plan from here rather than from Plans & pricing, because the
         reason to be on this screen is that the product already exists at the
         provider: this creates the plan and points it at that id in one step,
         rather than creating a second copy of something customers are already
         being charged against. --}}
    <x-drawer id="add-provider-plan" :title="__('Add plan')" :subtitle="$label.' · '.__('new plan')">
        <form id="add-provider-plan-form" method="POST"
              action="{{ route('admin.billing.providers.plans.store', ['locale' => $locale, 'name' => $name]) }}">
            @csrf
            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Plan') }}</div>
                <div class="form-row">
                    <div class="col-7 mb-3">
                        <label class="form-label small" for="ap-name">{{ __('Name') }}</label>
                        <input type="text" class="form-control" id="ap-name" name="name" required>
                    </div>
                    <div class="col-5 mb-3">
                        <label class="form-label small" for="ap-slug">{{ __('Slug') }}</label>
                        <input type="text" class="form-control" id="ap-slug" name="slug" required>
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label small" for="ap-interval">{{ __('Interval') }}</label>
                        {{-- Only what this provider will take. Creem refuses weekly, so
                             offering it here would create a plan that fails at the sync
                             and sells nowhere. --}}
                        <select class="form-control" id="ap-interval" name="interval" required>
                            @foreach($intervals as $value => $text)
                                <option value="{{ $value }}" @selected($value === 'month')>{{ $text }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-5 mb-3">
                        <label class="form-label small" for="ap-price">{{ __('Price') }}</label>
                        <div class="input-group">
                            <input type="number" min="0" step="0.01" class="form-control" id="ap-price"
                                   name="price" value="9.99" required>
                            <div class="input-group-append">
                                <span class="input-group-text" data-currency-label>USD</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-3 mb-3">
                        <label class="form-label small" for="ap-currency">{{ __('Currency') }}</label>
                        <input type="text" maxlength="3" class="form-control" id="ap-currency" name="currency" value="USD" required>
                    </div>
                    <div class="col-4 mb-3">
                        <label class="form-label small" for="ap-trial">{{ __('Trial days') }}</label>
                        <input type="number" min="0" class="form-control" id="ap-trial" name="trial_days" value="0">
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label small" for="ap-billing">{{ __('Billing') }}</label>
                        {{-- A 7- or 30-day pass is a week or a month charged once. --}}
                        <select class="form-control" id="ap-billing" name="billing_type">
                            <option value="recurring">{{ __('Recurring') }}</option>
                            <option value="one_time">{{ __('One time (pass)') }}</option>
                        </select>
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label small" for="ap-audience">{{ __('Sold to') }}</label>
                        <select class="form-control" id="ap-audience" name="audience">
                            <option value="organizer">{{ __('Organizers') }}</option>
                            <option value="attendee">{{ __('Attendees (Plus)') }}</option>
                        </select>
                    </div>
                </div>
                {{-- Unchecked on purpose: make it, sync it, check it, then sell it. --}}
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" name="is_active" value="1" id="ap-active">
                    <label class="form-check-label small" for="ap-active">{{ __('Put on sale now') }}</label>
                </div>
            </div>

            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('What :provider calls it', ['provider' => $label]) }}</div>
                <div class="mb-3">
                    <label class="form-label small" for="ap-pid">{{ __('Product id') }}</label>
                    <input type="text" class="form-control" id="ap-pid" name="product_id" autocomplete="off"
                           placeholder="{{ __('the id it already has at :provider', ['provider' => $label]) }}">
                </div>
                <div class="mb-3">
                    <label class="form-label small" for="ap-prid">{{ __('Price id') }}</label>
                    <input type="text" class="form-control" id="ap-prid" name="price_id" autocomplete="off">
                </div>
                <div class="mb-3">
                    <label class="form-label small" for="ap-mode">{{ __('Mode') }}</label>
                    <select class="form-control" id="ap-mode" name="mode">
                        <option value="live" @selected(! $sandbox)>{{ __('Live') }}</option>
                        <option value="sandbox" @selected($sandbox)>{{ __('Sandbox / test') }}</option>
                    </select>
                </div>
            </div>
        </form>

        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
            <button class="btn btn-sm btn-primary" form="add-provider-plan-form">{{ __('Add plan') }}</button>
        </x-slot>
    </x-drawer>


    {{-- The same log the providers list uses: this page can sync one product,
         so it needs somewhere to say what happened. --}}
    <button type="button" class="d-none" data-drawer="#sync-log" aria-hidden="true" tabindex="-1"></button>

    <x-drawer id="sync-log" :title="__('Sync log')" :subtitle="__('Not run yet')" :wide="true">
        <div class="cl-log" data-sync-log>
            <p class="text-muted small mb-0">{{ __('Nothing yet.') }}</p>
        </div>

        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Close') }}</button>
        </x-slot>
    </x-drawer>


    @if($attachable['plan'])
        <x-drawer id="attach-product" :title="__('Sell an existing plan')" :subtitle="__('through :provider', ['provider' => $label])">
            <form id="attach-product-form" method="POST"
                  action="{{ route('admin.billing.providers.attach', ['locale' => $locale, 'name' => $name]) }}">
                @csrf
                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('What to sell') }}</div>
                    <div class="mb-3">
                        <label class="form-label small" for="at-what">{{ __('Plan') }}</label>
                        <select class="form-control" id="at-what" name="what" required
                                onchange="var v = this.value.split(':'); this.form.kind.value = v[0]; this.form.id.value = v[1];">
                            @foreach($attachable['plan'] as $id => $label2)
                                <option value="plan:{{ $id }}">{{ $label2 }}</option>
                            @endforeach
                        </select>
                    </div>
                    <input type="hidden" name="kind" value="plan">
                    <input type="hidden" name="id" value="{{ array_key_first($attachable['plan']) }}">
                </div>

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('What :provider calls it', ['provider' => $label]) }}</div>
                    <div class="mb-3">
                        <label class="form-label small" for="at-pid">{{ __('Product id') }}</label>
                        <input type="text" class="form-control" id="at-pid" name="product_id" autocomplete="off"
                               placeholder="{{ __('leave blank and sync to create it') }}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small" for="at-prid">{{ __('Price id') }}</label>
                        <input type="text" class="form-control" id="at-prid" name="price_id" autocomplete="off">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small" for="at-mode">{{ __('Mode') }}</label>
                        <select class="form-control" id="at-mode" name="mode">
                            <option value="live" @selected(! $sandbox)>{{ __('Live') }}</option>
                            <option value="sandbox" @selected($sandbox)>{{ __('Sandbox / test') }}</option>
                        </select>
                    </div>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="attach-product-form">{{ __('Attach') }}</button>
            </x-slot>
        </x-drawer>
    @endif

@endsection
