@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="row">
        <div class="col-lg-8">
            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2>{{ __('Deep links') }}</h2>
                    <a class="btn btn-sm btn-outline-secondary"
                       href="{{ route('admin.settings.deep-links.verify', ['locale' => $locale]) }}">
                        {{ config('eventgoo.ios_app') ? __('Verify both files') : __('Verify the file') }}
                    </a>
                </div>
                <div class="card-body">
                    <form method="POST"
                          action="{{ route('admin.settings.deep-links.save', ['locale' => $locale]) }}">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])

                        <div class="form-check form-switch mb-4">
                            <input class="form-check-input" type="checkbox" role="switch" value="1"
                                   id="is_deep_linking_enabled" name="is_deep_linking_enabled"
                                   @checked($settings->is_deep_linking_enabled)>
                            <label class="form-check-label" for="is_deep_linking_enabled">
                                {{ __('Claim these links for the app') }}
                            </label>
                        </div>

                        <div class="form-check form-switch mb-4">
                            <input class="form-check-input" type="checkbox" role="switch" value="1"
                                   id="is_app_banner_enabled" name="is_app_banner_enabled"
                                   @checked($settings->is_app_banner_enabled)>
                            <label class="form-check-label" for="is_app_banner_enabled">
                                {{ __('Offer “Open in app” on mobile web') }}
                                <span class="d-block text-muted small">
                                    {!! __('Uses the store URLs from :link.', ['link' => '<a href="'.e(route('admin.settings.app', ['locale' => $locale])).'">'.e(__('App settings')).'</a>']) !!}
                                </span>
                            </label>
                        </div>

                        <h6 class="mt-4">Android</h6>

                        <div class="mb-3">
                            <label class="form-label" for="android_package_name">{{ __('Package name') }}</label>
                            <input type="text" class="form-control" id="android_package_name"
                                   name="android_package_name" placeholder="com.eventgoo.best"
                                   value="{{ old('android_package_name', $settings->android_package_name) }}">
                            <small class="text-muted">{!! __('The app\'s :field.', ['field' => '<code>applicationId</code>']) !!}</small>
                        </div>

                        <div class="mb-3">
                            <label class="form-label" for="android_sha256_fingerprints">
                                {{ __('SHA-256 certificate fingerprints') }}
                            </label>
                            <textarea class="form-control font-monospace" rows="4"
                                      id="android_sha256_fingerprints" name="android_sha256_fingerprints"
                                      placeholder="AA:BB:CC:… {{ __('(one per line)') }}">{{ old('android_sha256_fingerprints', implode("\n", (array) $settings->android_sha256_fingerprints)) }}</textarea>
                            <small class="text-muted">{{ __('Include Play App Signing, upload and debug keys.') }}</small>
                        </div>

                        @if (config('eventgoo.ios_app'))
                        <h6 class="mt-4">iOS</h6>

                        <div class="row">
                            <div class="col-md-5 mb-3">
                                <label class="form-label" for="ios_team_id">{{ __('Team ID') }}</label>
                                <input type="text" class="form-control" id="ios_team_id" name="ios_team_id"
                                       placeholder="ABCDE12345"
                                       value="{{ old('ios_team_id', $settings->ios_team_id) }}">
                                <small class="text-muted">{{ __('Apple Developer → Membership.') }}</small>
                            </div>
                            <div class="col-md-7 mb-3">
                                <label class="form-label" for="ios_bundle_id">{{ __('Bundle ID') }}</label>
                                <input type="text" class="form-control" id="ios_bundle_id" name="ios_bundle_id"
                                       placeholder="com.eventgoo.best"
                                       value="{{ old('ios_bundle_id', $settings->ios_bundle_id) }}">
                            </div>
                        </div>

                        <p class="text-muted small mb-0">
                            {{ __('iOS entitlement:') }} <code>applinks:{{ parse_url(config('app.url'), PHP_URL_HOST) }}</code> {{-- i18n-ignore --}}
                        </p>
                        @endif

                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-4 cl-aside-sticky">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Files') }}</h2></div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label small">Android</label>
                        <input type="text" class="form-control form-control-sm" readonly
                               value="{{ $assetLinksUrl }}">
                        <a class="small" href="{{ $assetLinksUrl }}" target="_blank" rel="noopener">{{ __('Open') }} ↗</a>
                    </div>

                    @if (config('eventgoo.ios_app'))
                    <div class="mb-3">
                        <label class="form-label small">iOS</label>
                        <input type="text" class="form-control form-control-sm" readonly value="{{ $aasaUrl }}">
                        <a class="small" href="{{ $aasaUrl }}" target="_blank" rel="noopener">{{ __('Open') }} ↗</a>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
@endsection
