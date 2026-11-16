@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();

        // Mirrors config/payments.php. Credentials are .env-only, so this is a
        // reference for what to set rather than a form.
        $envKeys = [
            'stripe' => ['STRIPE_KEY', 'STRIPE_SECRET', 'STRIPE_WEBHOOK_SECRET'],
            'lemonsqueezy' => ['LEMONSQUEEZY_KEY', 'LEMONSQUEEZY_STORE', 'LEMONSQUEEZY_WEBHOOK_SECRET'],
            'polar' => ['POLAR_SECRET', 'POLAR_WEBHOOK_SECRET', 'POLAR_SANDBOX'],
            'paddle' => ['PADDLE_API_KEY', 'PADDLE_CLIENT_TOKEN', 'PADDLE_WEBHOOK_SECRET', 'PADDLE_SANDBOX'],
            'creem' => ['CREEM_API_KEY', 'CREEM_WEBHOOK_SECRET', 'CREEM_TEST_MODE'],
            'dodopay' => ['DODO_PAYMENTS_API_KEY', 'DODO_PAYMENTS_WEBHOOK_SECRET', 'DODO_PAYMENTS_TEST_MODE'],
        ];
    @endphp

    @include('admin.partials.flash')

    <div class="row">
        <div class="col-md-3">
            <div class="card card-default"><div class="card-body">
                <div class="text-muted text-uppercase small">{{ __('Configured') }}</div>
                <h3 class="mb-0">{{ collect($rows)->where('configured', true)->count() }}
                    <span class="text-muted small">{{ __('of :total', ['total' => count($rows)]) }}</span></h3>
            </div></div>
        </div>
        <div class="col-md-3">
            <div class="card card-default"><div class="card-body">
                <div class="text-muted text-uppercase small">{{ __('Takes the money') }}</div>
                <h3 class="mb-0 text-success">{{ $rows[$default]['label'] ?? $default }}</h3>
                @if($requested !== $default)
                    {{-- PAYMENTS_DEFAULT names a provider without credentials, so
                         PaymentProviders::default() fell through to another one. --}}
                    <div class="small text-warning">{!! __(':setting has no credentials', ['setting' => '<code>PAYMENTS_DEFAULT='.e($requested).'</code>']) !!}</div>
                @endif
            </div></div>
        </div>
        <div class="col-md-3">
            <div class="card card-default"><div class="card-body">
                <div class="text-muted text-uppercase small">{{ __('Active plans') }}</div>
                <h3 class="mb-0">{{ $planCount }}</h3>
            </div></div>
        </div>
        <div class="col-md-3">
            <div class="card card-default"><div class="card-body">
                <div class="text-muted text-uppercase small">{{ __('Products') }}</div>
                <h3 class="mb-0">{{ collect($rows)->sum('products') }}</h3>
            </div></div>
        </div>
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom">
            <h2 class="mb-0">{{ __('Payment providers') }}</h2>
        </div>

        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>{{ __('Provider') }}</th>
                            <th>{{ __('Mode') }}</th>
                            <th>{{ __('Credentials') }}</th>
                            <th>{{ __('Webhook') }}</th>
                            <th class="text-right">{{ __('Plans sold') }}</th>
                            <x-row-actions-header />
                        </tr>
                    </thead>
                    <tbody>
                    @foreach($rows as $name => $row)
                        <tr class="{{ $row['configured'] ? '' : 'text-muted' }}" data-provider-row="{{ $name }}">
                            <td class="text-nowrap">
                                <a href="{{ route('admin.billing.providers.show', ['locale' => $locale, 'name' => $name]) }}">
                                    <strong>{{ $row['label'] }}</strong>
                                </a>
                                @if($name === $default)
                                    <span class="badge badge-success ml-1">{{ __('Default') }}</span>
                                @endif
                                <div class="small text-muted"><code>{{ $name }}</code></div>
                            </td>
                            <td class="small text-nowrap">
                                @if(! $row['configured'])
                                    <span class="text-muted">—</span>
                                @elseif($row['sandbox'])
                                    <span class="badge badge-warning">{{ __('Sandbox') }}</span>
                                @else
                                    <span class="badge badge-secondary">{{ __('Live') }}</span>
                                @endif
                            </td>
                            <td class="small">
                                @if($row['configured'])
                                    <span class="badge badge-success">{{ __('Set') }}</span>
                                @else
                                    <span class="badge badge-secondary">{{ __('Not set') }}</span>
                                @endif
                            </td>
                            <td class="small">
                                @if($row['has_webhook_secret'])
                                    <span class="badge badge-success">{{ __('Signed') }}</span>
                                @else
                                    <span class="badge badge-warning">{{ __('No secret') }}</span>
                                @endif
                            </td>
                            <td class="text-right" data-cell="products">{{ $row['products'] ?: '—' }}</td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    {{-- This provider on its own: the question an operator
                                         actually asks is "does Polar work", not "do all six". --}}
                                    <x-row-action-form method="POST" icon="lan-connect" tone=""
                                                       async="verify"
                                                       :async-label="__('Testing :provider', ['provider' => $row['label']])"
                                                       :action="route('admin.billing.providers.verify', ['locale' => $locale, 'name' => $name])">
                                        {{ __('Test credentials') }}
                                    </x-row-action-form>
                                    <x-row-action-form method="POST" icon="sync" tone=""
                                                       async="sync"
                                                       :async-label="__('Syncing :provider', ['provider' => $row['label']])"
                                                       :action="route('admin.billing.providers.sync', ['locale' => $locale])"
                                                       :fields="['provider' => $name]"
                                                       :confirm="__('Sync all active products to :provider?', ['provider' => $row['label']])">
                                        {{ __('Sync products') }}
                                    </x-row-action-form>
                                    <x-row-actions-divider />
                                    <x-row-action icon="format-list-bulleted"
                                                  :href="route('admin.billing.providers.show', ['locale' => $locale, 'name' => $name])">{{ __('Plans & product ids') }}</x-row-action>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#setup-{{ $name }}">
                                        <i class="mdi mdi-key-variant" aria-hidden="true"></i>
                                        <span>{{ __('Keys & webhook') }}</span>
                                    </a>
                                </x-row-actions>
                            </td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {{-- Credentials are .env-only, so this is a reference panel rather than a
         form: what to paste, and where to point the provider's webhook. --}}
    @foreach($rows as $name => $row)
        <x-drawer :id="'setup-'.$name" :title="$row['label']" :subtitle="__('Environment keys and webhook')">
            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Webhook URL') }}</div>
                <input type="text" class="form-control" readonly value="{{ $row['webhook'] }}" onclick="this.select()">
                <p class="small text-muted mt-2 mb-0">
                    @if($row['has_webhook_secret'])
                        {{ __('Signing secret is set.') }}
                    @else
                        {{ __('No signing secret set. Payments will not be granted.') }}
                    @endif
                </p>
            </div>

            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Environment keys') }}</div>
                @foreach($envKeys[$name] ?? [] as $key)
                    <div class="mb-1"><code>{{ $key }}</code></div>
                @endforeach
            </div>

            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('State') }}</div>
                <div class="small">
                    {{ __('Credentials: :value', ['value' => $row['configured'] ? __('set') : __('not set')]) }}<br>
                    {{ __('Mode: :value', ['value' => $row['configured'] ? ($row['sandbox'] ? __('sandbox') : __('live')) : '—']) }}<br>
                    {{ __('Products: :value', ['value' => $row['products']]) }}<br>
                    {{ __('Default provider: :value', ['value' => $name === $default ? __('yes') : __('no')]) }}
                </div>
            </div>

            <x-slot name="footer">
                <a class="btn btn-sm btn-secondary" data-drawer-close href="#">{{ __('Close') }}</a>
                <a class="btn btn-sm btn-primary"
                   href="{{ route('admin.billing.providers.show', ['locale' => $locale, 'name' => $name]) }}">{{ __('Plans & product ids') }}</a>
            </x-slot>
        </x-drawer>
    @endforeach

    @if(session('sync_rows'))
        <div class="card card-default">
            <div class="card-header card-header-border-bottom"><h2>{{ __('Last sync') }}</h2></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead><tr><th>{{ __('Provider') }}</th><th>{{ __('Product') }}</th><th>{{ __('Result') }}</th><th>{{ __('Id / detail') }}</th></tr></thead>
                        <tbody>
                        @foreach(session('sync_rows') as $row)
                            <tr>@foreach(array_values((array) $row) as $cell)<td class="small" style="word-break:break-all">{{ is_scalar($cell) || $cell === null ? $cell : json_encode($cell) }}</td>@endforeach</tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    @endif

    {{-- The sync log. Opened by the script once the answer is in; the hidden
         trigger is what it clicks, so opening stays one code path. --}}
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
