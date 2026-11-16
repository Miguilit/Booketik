@extends('admin.admin_master')
@section('admin')
    {{-- Gateway and push credentials.

         These are stored in the database, encrypted, rather than in .env — see
         the note on Admin\IntegrationSettingsController for why that is not a
         reversal of the "no env writes from the panel" rule.

         Secret fields are write-only: they render a masked placeholder and are
         never sent back to the browser. Leaving one blank keeps the stored
         value; removing one takes an explicit tick. --}}
    @php
        $locale = app()->getLocale();
        $mask = fn ($value) => filled($value) ? '••••••••'.substr((string) $value, -4) : null;
    @endphp

    @include('admin.partials.flash')

    <form method="POST" action="{{ route('admin.settings.integrations.save', ['locale' => $locale]) }}" enctype="multipart/form-data">
        @csrf

        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])

        {{-- ── Midtrans ──────────────────────────────────────────────── --}}
        <div class="card card-default mb-4">
            <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                <h2>Midtrans <span class="badge bg-secondary">{{ __('IDR only') }}</span></h2>
                <a class="btn btn-sm btn-outline-secondary"
                   href="{{ route('admin.settings.integrations.test', ['locale' => $locale, 'gateway' => 'midtrans']) }}">
                    {{ __('Test connection') }}
                </a>
            </div>
            <div class="card-body">
                @unless($rupiahIsActive && $hasRupiahPricing)
                    <div class="alert alert-warning small">
                        @unless($rupiahIsActive)
                            {{ __('IDR is not active.') }}
                            <a href="{{ route('admin.settings.currencies.index', ['locale' => $locale]) }}">{{ __('Currencies') }}</a>
                        @else
                            {!! __('No IDR prices on :link.', ['link' => '<a href="'.e(route('admin.billing.plans.prices', ['locale' => $locale])).'">'.e(__('plans')).'</a>']) !!}
                        @endunless
                        {{ __('Hidden at checkout until fixed.') }}
                    </div>
                @endunless

                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" value="1" id="is_midtrans_enabled"
                           name="is_midtrans_enabled" @checked($integrations->is_midtrans_enabled)>
                    <label class="form-check-label" for="is_midtrans_enabled">{{ __('Offer Midtrans at checkout') }}</label>
                </div>

                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" value="1" id="midtrans_is_production"
                           name="midtrans_is_production" @checked($integrations->midtrans_is_production)>
                    <label class="form-check-label" for="midtrans_is_production">
                        {{ __('Production') }}
                        <span class="text-muted small">{{ __('(needs production keys)') }}</span>
                    </label>
                </div>

                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="midtrans_merchant_id">{{ __('Merchant ID') }}</label>
                        <input type="text" class="form-control" id="midtrans_merchant_id" name="midtrans_merchant_id"
                               value="{{ old('midtrans_merchant_id', $integrations->midtrans_merchant_id) }}"
                               placeholder="G123456789">
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="midtrans_client_key">{{ __('Client key') }}</label>
                        <input type="text" class="form-control" id="midtrans_client_key" name="midtrans_client_key"
                               value="{{ old('midtrans_client_key', $integrations->midtrans_client_key) }}"
                               placeholder="SB-Mid-client-…"> {{-- i18n-ignore --}}
                        <small class="text-muted">{{ __('Public key.') }}</small>
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="midtrans_server_key">{{ __('Server key') }}</label>
                        <input type="password" class="form-control" id="midtrans_server_key" name="midtrans_server_key"
                               autocomplete="new-password"
                               placeholder="{{ $mask($integrations->midtrans_server_key) ?? __('Not set') }}">
                        <div class="form-check mt-1">
                            <input class="form-check-input" type="checkbox" value="1"
                                   id="clear_midtrans_server_key" name="clear_midtrans_server_key">
                            <label class="form-check-label small text-muted" for="clear_midtrans_server_key">
                                {{ __('Remove the stored key') }}
                            </label>
                        </div>
                    </div>

                    <div class="col-md-8 mb-3">
                        <label class="form-label d-block">{{ __('Channels') }}</label>
                        @foreach(['qris' => 'QRIS', 'gopay' => 'GoPay', 'shopeepay' => 'ShopeePay',
                                  'va_bca' => 'BCA VA', 'va_bni' => 'BNI VA', 'va_bri' => 'BRI VA',
                                  'va_permata' => 'Permata VA'] as $value => $label)
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" name="midtrans_channels[]"
                                       value="{{ $value }}" id="mt_ch_{{ $value }}"
                                       @checked(in_array($value, (array) $integrations->midtrans_channels, true))>
                                <label class="form-check-label small" for="mt_ch_{{ $value }}">{{ $label }}</label>
                            </div>
                        @endforeach
                        <small class="text-muted d-block mt-1">{{ __('Only channels enabled on your Midtrans account.') }}</small>
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="midtrans_expiry_minutes">{{ __('QR expiry (minutes)') }}</label>
                        <input type="number" min="15" max="10080" class="form-control"
                               id="midtrans_expiry_minutes" name="midtrans_expiry_minutes"
                               value="{{ old('midtrans_expiry_minutes', $integrations->midtrans_expiry_minutes ?: 15) }}">
                        <small class="text-muted">{{ __('Minimum 15.') }}</small>
                    </div>

                    <div class="col-md-8 mb-3">
                        <label class="form-label">{{ __('Notification URL') }}</label>
                        <input type="text" class="form-control" readonly value="{{ url('/api/webhooks/midtrans') }}">
                        <small class="text-muted">{{ __('Set as Payment Notification URL in Midtrans.') }}</small>
                    </div>
                </div>
            </div>
        </div>

        {{-- ── Duitku ────────────────────────────────────────────────── --}}
        <div class="card card-default mb-4">
            <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                <h2>Duitku <span class="badge bg-secondary">{{ __('IDR only') }}</span></h2>
                <a class="btn btn-sm btn-outline-secondary"
                   href="{{ route('admin.settings.integrations.test', ['locale' => $locale, 'gateway' => 'duitku']) }}">
                    {{ __('Test connection') }}
                </a>
            </div>
            <div class="card-body">
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" value="1" id="is_duitku_enabled"
                           name="is_duitku_enabled" @checked($integrations->is_duitku_enabled)>
                    <label class="form-check-label" for="is_duitku_enabled">{{ __('Offer Duitku at checkout') }}</label>
                </div>

                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" value="1" id="duitku_is_production"
                           name="duitku_is_production" @checked($integrations->duitku_is_production)>
                    <label class="form-check-label" for="duitku_is_production">{{ __('Production') }}</label>
                </div>

                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="duitku_merchant_code">{{ __('Merchant code') }}</label>
                        <input type="text" class="form-control" id="duitku_merchant_code" name="duitku_merchant_code"
                               value="{{ old('duitku_merchant_code', $integrations->duitku_merchant_code) }}"
                               placeholder="DS12345">
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="duitku_api_key">{{ __('API key') }}</label>
                        <input type="password" class="form-control" id="duitku_api_key" name="duitku_api_key"
                               autocomplete="new-password"
                               placeholder="{{ $mask($integrations->duitku_api_key) ?? __('Not set') }}">
                        <div class="form-check mt-1">
                            <input class="form-check-input" type="checkbox" value="1"
                                   id="clear_duitku_api_key" name="clear_duitku_api_key">
                            <label class="form-check-label small text-muted" for="clear_duitku_api_key">
                                {{ __('Remove the stored key') }}
                            </label>
                        </div>
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="duitku_api_flavour">{{ __('API generation') }}</label>
                        <select class="form-control" id="duitku_api_flavour" name="duitku_api_flavour">
                            <option value="pop" @selected($integrations->duitku_api_flavour === 'pop')>
                                {{ __('POP — createInvoice (hosted page)') }}
                            </option>
                            <option value="classic" @selected($integrations->duitku_api_flavour === 'classic')>
                                {{ __('Classic — v2/inquiry (QR in our checkout)') }}
                            </option>
                        </select>
                        <small class="text-muted">{{ __('Must match your Duitku account.') }}</small>
                    </div>

                    <div class="col-md-8 mb-3">
                        <label class="form-label d-block">{{ __('Channels') }}</label>
                        @foreach(['qris' => 'QRIS', 'ovo' => 'OVO', 'shopeepay' => 'ShopeePay',
                                  'va_bca' => 'BCA VA', 'va_bni' => 'BNI VA', 'va_mandiri' => 'Mandiri VA',
                                  'va_cimb' => 'CIMB VA', 'va_permata' => 'Permata VA',
                                  'atm_bersama' => 'ATM Bersama', 'indodana' => 'Indodana'] as $value => $label)
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" name="duitku_channels[]"
                                       value="{{ $value }}" id="dk_ch_{{ $value }}"
                                       @checked(in_array($value, (array) $integrations->duitku_channels, true))>
                                <label class="form-check-label small" for="dk_ch_{{ $value }}">{{ $label }}</label>
                            </div>
                        @endforeach
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="duitku_expiry_minutes">{{ __('Expiry (minutes)') }}</label>
                        <input type="number" min="5" max="10080" class="form-control"
                               id="duitku_expiry_minutes" name="duitku_expiry_minutes"
                               value="{{ old('duitku_expiry_minutes', $integrations->duitku_expiry_minutes ?: 60) }}">
                    </div>

                    <div class="col-md-8 mb-3">
                        <label class="form-label">{{ __('Callback URL') }}</label>
                        <input type="text" class="form-control" readonly value="{{ url('/api/webhooks/duitku') }}">
                        <small class="text-muted">{{ __('Register in the Duitku dashboard.') }}</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="card card-default mb-4">
            <div class="card-header card-header-border-bottom">
                <h2>{{ __('OneSignal push') }}</h2>
            </div>
            <div class="card-body">
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" value="1" id="is_push_enabled"
                           name="is_push_enabled" @checked($appSettings->is_push_enabled)>
                    <label class="form-check-label" for="is_push_enabled">{{ __('Push notifications enabled') }}</label>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label" for="onesignal_app_id">{{ __('App ID') }}</label>
                        <input type="text" class="form-control" id="onesignal_app_id" name="onesignal_app_id"
                               value="{{ old('onesignal_app_id', $appSettings->onesignal_app_id) }}">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label" for="onesignal_rest_api_key">{{ __('REST API key') }}</label>
                        <input type="password" class="form-control" id="onesignal_rest_api_key"
                               name="onesignal_rest_api_key" autocomplete="new-password"
                               placeholder="{{ $mask($integrations->onesignal_rest_api_key) ?? __('Not set') }}">
                        <div class="form-check mt-1">
                            <input class="form-check-input" type="checkbox" value="1"
                                   id="clear_onesignal_rest_api_key" name="clear_onesignal_rest_api_key">
                            <label class="form-check-label small text-muted" for="clear_onesignal_rest_api_key">
                                {{ __('Remove the stored key') }}
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Stripe Connect (tickets). The platform's Stripe keys stay in the
             environment (STRIPE_KEY / STRIPE_SECRET); this is the Connect side. --}}
        <div class="card card-default mb-4">
            <div class="card-header card-header-border-bottom">
                <h2>{{ __('Stripe Connect — ticket payouts') }}</h2>
            </div>
            <div class="card-body">
                <p class="text-muted small mb-3">
                    {{ __('Stripe keys: :state (environment).', ['state' => filled(config('payments.providers.stripe.secret')) ? __('configured') : __('not configured')]) }}
                    {{ __('Organizers with a ready Express account are paid by destination charges; everyone else by platform charge and payout.') }}
                </p>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" value="1" id="is_stripe_connect_enabled"
                           name="is_stripe_connect_enabled" @checked($integrations->stripeConnectEnabled())>
                    <label class="form-check-label" for="is_stripe_connect_enabled">{{ __('Pay connected organizers through Stripe Connect') }}</label>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label" for="stripe_connect_webhook_secret">{{ __('Connect webhook secret') }}</label>
                        <input type="password" class="form-control" id="stripe_connect_webhook_secret" name="stripe_connect_webhook_secret"
                               autocomplete="new-password"
                               placeholder="{{ $mask($integrations->stripe_connect_webhook_secret) ?? __('Not set') }}">
                        <div class="form-check mt-1">
                            <input class="form-check-input" type="checkbox" value="1" id="clear_stripe_connect_webhook_secret" name="clear_stripe_connect_webhook_secret">
                            <label class="form-check-label small text-muted" for="clear_stripe_connect_webhook_secret">{{ __('Remove the stored secret') }}</label>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">{{ __('Connect webhook URL') }}</label>
                        <input type="text" class="form-control" readonly value="{{ url('/api/webhooks/stripe-connect') }}">
                        <small class="text-muted">{!! __('"Events on Connected accounts": :events.', ['events' => '<code>account.updated</code>, <code>payout.paid</code>, <code>payout.failed</code>']) !!}
                            {!! __('The platform endpoint :endpoint needs :events.', ['endpoint' => '<code>'.e(url('/api/webhooks/stripe')).'</code>', 'events' => '<code>payment_intent.succeeded</code>, <code>payment_intent.payment_failed</code>, <code>payment_intent.canceled</code>, <code>charge.refunded</code>']) !!}</small>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label" for="stripe_merchant_country">{{ __('Platform country') }}</label>
                        <input type="text" class="form-control" id="stripe_merchant_country" name="stripe_merchant_country" maxlength="2"
                               value="{{ old('stripe_merchant_country', $integrations->stripe_merchant_country) }}" placeholder="DE">
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label" for="stripe_connect_default_country">{{ __('Default organizer country') }}</label>
                        <input type="text" class="form-control" id="stripe_connect_default_country" name="stripe_connect_default_country" maxlength="2"
                               value="{{ old('stripe_connect_default_country', $integrations->stripe_connect_default_country) }}" placeholder="DE">
                    </div>
                </div>
            </div>
        </div>

        {{-- Wallet passes. Certificates and keys are stored encrypted and never
             shown again; uploading a new file replaces the old one. --}}
        <div class="card card-default mb-4">
            <div class="card-header card-header-border-bottom">
                <h2>{{ __('Wallet passes') }}</h2>
            </div>
            <div class="card-body">
                @if (config('eventgoo.ios_app'))
                <h5 class="mb-2">Apple Wallet <small class="text-muted">— {{ $integrations->appleWalletIsUsable() ? __('ready') : __('not configured') }}</small></h5> {{-- i18n-ignore --}}
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="apple_pass_type_identifier">{{ __('Pass Type ID') }}</label>
                        <input type="text" class="form-control" id="apple_pass_type_identifier" name="apple_pass_type_identifier"
                               value="{{ old('apple_pass_type_identifier', $integrations->apple_pass_type_identifier) }}" placeholder="pass.com.eventgoo.best">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="apple_team_identifier">{{ __('Team ID') }}</label>
                        <input type="text" class="form-control" id="apple_team_identifier" name="apple_team_identifier"
                               value="{{ old('apple_team_identifier', $integrations->apple_team_identifier) }}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="apple_pass_organization">{{ __('Organization name') }}</label>
                        <input type="text" class="form-control" id="apple_pass_organization" name="apple_pass_organization"
                               value="{{ old('apple_pass_organization', $integrations->apple_pass_organization) }}" placeholder="Eventgoo">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="apple_pass_certificate">{{ __('Pass certificate (.p12)') }}</label>
                        <input type="file" class="form-control" id="apple_pass_certificate" name="apple_pass_certificate" accept=".p12,.pfx">
                        <small class="text-muted">{{ filled($integrations->apple_pass_certificate) ? __('Uploaded.') : __('Not uploaded.') }}</small>
                        <div class="form-check mt-1">
                            <input class="form-check-input" type="checkbox" value="1" id="clear_apple_pass_certificate" name="clear_apple_pass_certificate">
                            <label class="form-check-label small text-muted" for="clear_apple_pass_certificate">{{ __('Remove the stored certificate') }}</label>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="apple_pass_certificate_password">{{ __('Certificate password') }}</label>
                        <input type="password" class="form-control" id="apple_pass_certificate_password" name="apple_pass_certificate_password"
                               autocomplete="new-password" placeholder="{{ filled($integrations->apple_pass_certificate_password) ? '••••••••' : __('Not set') }}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="apple_wwdr_certificate">{{ __('Apple WWDR certificate (.pem / .cer)') }}</label>
                        <input type="file" class="form-control" id="apple_wwdr_certificate" name="apple_wwdr_certificate" accept=".pem,.cer,.crt">
                        <small class="text-muted">{{ filled($integrations->apple_wwdr_certificate) ? __('Uploaded.') : __('Not uploaded.') }}</small>
                    </div>
                </div>

                @endif

                <h5 class="mb-2 mt-2">Google Wallet <small class="text-muted">— {{ $integrations->googleWalletIsUsable() ? __('ready') : __('not configured') }}</small></h5> {{-- i18n-ignore --}}
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="google_wallet_issuer_id">{{ __('Issuer ID') }}</label>
                        <input type="text" class="form-control" id="google_wallet_issuer_id" name="google_wallet_issuer_id"
                               value="{{ old('google_wallet_issuer_id', $integrations->google_wallet_issuer_id) }}">
                    </div>
                    <div class="col-md-8 mb-3">
                        <label class="form-label" for="google_wallet_service_account">{{ __('Service account key (.json)') }}</label>
                        <input type="file" class="form-control" id="google_wallet_service_account" name="google_wallet_service_account" accept=".json,application/json">
                        <small class="text-muted">{{ filled($integrations->google_wallet_service_account) ? __('Uploaded.') : __('Not uploaded.') }}</small>
                        <div class="form-check mt-1">
                            <input class="form-check-input" type="checkbox" value="1" id="clear_google_wallet_service_account" name="clear_google_wallet_service_account">
                            <label class="form-check-label small text-muted" for="clear_google_wallet_service_account">{{ __('Remove the stored key') }}</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection
