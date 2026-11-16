@extends('admin.admin_master')
@section('admin')
    @php($locale = app()->getLocale())

    <div class="row">
        <div class="col-lg-7">
            <div class="card card-default">
                @include('admin.partials.flash')

                <div class="card-header card-header-border-bottom">
                    <h2>{{ __('dashboard.general_settings') }}</h2>
                </div>

                <div class="card-body">
                    <form action="{{ route('update.env.general', ['locale' => $locale]) }}" method="POST">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])

                        <div class="form-group mb-3">
                            <div class="form-check form-switch">
                                <input type="hidden" name="register_enabled" value="0">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="register_enabled" name="register_enabled" value="1"
                                       @checked($webSettings->is_registration_enabled)>
                                <label class="form-check-label" for="register_enabled">
                                    {{ __('Allow new signups on the website') }}
                                </label>
                            </div>
                        </div>

                        <div class="form-group mb-3">
                            <div class="form-check form-switch">
                                <input type="hidden" name="email_verification_required" value="0">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="email_verification_required" name="email_verification_required" value="1"
                                       @checked($webSettings->is_email_verification_required)>
                                <label class="form-check-label" for="email_verification_required">
                                    {{ __('Require email verification at signup') }}
                                </label>
                            </div>
                            <small class="text-muted">{{ __('Needs working SMTP.') }}</small>
                        </div>

                        <div class="form-group mb-3">
                            <div class="form-check form-switch">
                                <input type="hidden" name="maintenance_mode" value="0">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="maintenance_mode" name="maintenance_mode" value="1"
                                       @checked($appSettings->maintenance_mode)>
                                <label class="form-check-label" for="maintenance_mode">
                                    {{ __('Maintenance mode') }}
                                </label>
                            </div>
                            <small class="text-muted">{{ __('Closes the site and app. Admins keep panel access.') }}</small>
                        </div>

                        <div class="form-group mb-3">
                            <label class="form-label" for="maintenance_message">{{ __('Maintenance message') }}</label>
                            <textarea class="form-control" id="maintenance_message" name="maintenance_message"
                                      rows="2">{{ $appSettings->maintenance_message }}</textarea>
                        </div>

                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-5">
            <div class="card card-default">
                <div class="card-header">{{ __('Deployment configuration') }}</div>
                <div class="card-body">
                    <p class="text-muted small">{!! __('Read-only. Set in :file.', ['file' => '<code>.env</code>']) !!}</p>

                    <dl class="row mb-0">
                        <dt class="col-6">Google Analytics</dt> {{-- i18n-ignore --}}
                        <dd class="col-6"><code>{{ $googleAnalyticsId ?: __('not set') }}</code></dd>

                        <dt class="col-6">{{ __('OneSignal app id') }}</dt>
                        <dd class="col-6"><code>{{ $oneSignalAppId ?: __('not set') }}</code></dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>
@endsection
