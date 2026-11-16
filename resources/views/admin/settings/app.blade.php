@extends('admin.admin_master')
@section('admin')
    {{-- Eventgoo app configuration: moderation windows, web ads, release
         gating and links. Everything public here is read by GET /api/v1/config,
         so a change takes effect on the next request with no deploy. --}}
    @php $locale = app()->getLocale(); @endphp

    <div class="card card-default">
        @include('admin.partials.flash')

        <div class="card-header card-header-border-bottom">
            <h2>{{ __('dashboard.app_settings') }}</h2>
        </div>

        <div class="card-body">
            <form method="POST" action="{{ route('admin.save.app.settings', ['locale' => $locale]) }}">
                @csrf

                @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])

                {{-- The moderation promise: how fast staff look at a report or a
                     submitted event, and how many independent reports hide an event
                     before anyone has. Shown as countdowns on the review queues. --}}
                <h5 class="mb-3">{{ __('Moderation') }}</h5>
                <div class="row">
                    @php
                        $moderation = [
                            'report_response_hours' => __('Answer reports within (hours)'),
                            'review_response_hours' => __('Review events within (hours)'),
                            'auto_hide_report_threshold' => __('Auto-hide after N reports'),
                        ];
                    @endphp
                    @foreach($moderation as $field => $label)
                        <div class="col-md-4 mb-3">
                            <label class="form-label" for="{{ $field }}">{{ $label }}</label>
                            <input type="number" min="0" class="form-control" id="{{ $field }}" name="{{ $field }}"
                                   value="{{ old($field, $appSettings->$field) }}" required>
                        </div>
                    @endforeach
                </div>

                <hr>
                <h5 class="mb-3">{{ __('AdSense (web)') }}</h5>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" value="1" id="is_adsense_enabled"
                           name="is_adsense_enabled" @checked($appSettings->is_adsense_enabled)>
                    <label class="form-check-label" for="is_adsense_enabled">{{ __('Show AdSense on the site') }}</label>
                </div>
                <div class="row">
                    @php
                        $adsense = [
                            'adsense_client_id' => __('Publisher id (ca-pub-…)'),
                            'adsense_slot_header' => __('Header slot id'),
                            'adsense_slot_in_feed' => __('In-feed slot id'),
                        ];
                    @endphp
                    @foreach($adsense as $field => $label)
                        <div class="col-md-3 mb-3">
                            <label class="form-label" for="{{ $field }}">{{ $label }}</label>
                            <input type="text" class="form-control" id="{{ $field }}" name="{{ $field }}"
                                   value="{{ old($field, $appSettings->$field) }}">
                        </div>
                    @endforeach
                </div>
                <p class="text-muted small">{{ __('Empty slots don\'t render. Eventgoo Plus members see no ads.') }}</p>

                <hr>
                <h5 class="mb-3">{{ __('Release gating') }}</h5>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="1" id="maintenance_mode"
                                   name="maintenance_mode" @checked($appSettings->maintenance_mode)>
                            <label class="form-check-label" for="maintenance_mode">{{ __('Maintenance mode') }}</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="1" id="force_update"
                                   name="force_update" @checked($appSettings->force_update)>
                            <label class="form-check-label" for="force_update">{{ __('Force every client to update') }}</label>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label" for="maintenance_message">{{ __('Maintenance message') }}</label>
                        <textarea class="form-control" id="maintenance_message" name="maintenance_message"
                                  rows="2">{{ old('maintenance_message', $appSettings->maintenance_message) }}</textarea>
                    </div>
                </div>

                <div class="row">
                    @php
                        $release = config('eventgoo.ios_app') ? [
                            'min_supported_version_android' => __('Minimum Android version'),
                            'min_supported_version_ios' => __('Minimum iOS version'),
                            'latest_version_android' => __('Latest Android version'),
                            'latest_version_ios' => __('Latest iOS version'),
                        ] : [
                            'min_supported_version_android' => __('Minimum Android version'),
                            'latest_version_android' => __('Latest Android version'),
                        ];
                    @endphp
                    @foreach($release as $field => $label)
                        <div class="col-md-3 mb-3">
                            <label class="form-label" for="{{ $field }}">{{ $label }}</label>
                            <input type="text" class="form-control" id="{{ $field }}" name="{{ $field }}"
                                   value="{{ old($field, $appSettings->$field) }}">
                        </div>
                    @endforeach
                    <div class="col-md-6 mb-3">
                        <label class="form-label" for="android_store_url">{{ __('Play Store URL') }}</label>
                        <input type="url" class="form-control" id="android_store_url" name="android_store_url"
                               value="{{ old('android_store_url', $appSettings->android_store_url) }}">
                    </div>
                    @if (config('eventgoo.ios_app'))
                    <div class="col-md-6 mb-3">
                        <label class="form-label" for="ios_store_url">{{ __('App Store URL') }}</label>
                        <input type="url" class="form-control" id="ios_store_url" name="ios_store_url"
                               value="{{ old('ios_store_url', $appSettings->ios_store_url) }}">
                    </div>
                    @endif
                </div>

                <hr>
                <h5 class="mb-3">{{ __('Links') }}</h5>
                <div class="row">
                    @php
                        $links = [
                            'help_url' => __('Help URL'),
                            'faq_url' => __('FAQ URL'),
                            'privacy_url' => __('Privacy policy URL'),
                            'terms_url' => __('Terms URL'),
                        ];
                    @endphp
                    @foreach($links as $field => $label)
                        <div class="col-md-3 mb-3">
                            <label class="form-label" for="{{ $field }}">{{ $label }}</label>
                            <input type="url" class="form-control" id="{{ $field }}" name="{{ $field }}"
                                   value="{{ old($field, $appSettings->$field) }}">
                        </div>
                    @endforeach
                    <div class="col-md-4 mb-3">
                        <label class="form-label" for="support_email">{{ __('Support email') }}</label>
                        <input type="email" class="form-control" id="support_email" name="support_email"
                               value="{{ old('support_email', $appSettings->support_email) }}">
                    </div>
                </div>

            </form>
        </div>
    </div>
@endsection
