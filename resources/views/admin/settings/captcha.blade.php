@php use Carbon\Carbon; @endphp
@extends('admin.admin_master')
@section('admin')
    <div class="row">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">{{ __('dashboard.captcha') }}</div>
                <div class="card-body">
                    <form action="{{ route('update.env.captcha', ['locale' => app()->getLocale()]) }}" method="POST">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])
                        <h5>{{ __('dashboard.cloudflare_turnstile') }}</h5><br>
                        <div class="form-group">
                            <label for="turnstile_site_key">{{ __('dashboard.turnstile_site_key') }}</label>
                            <input type="text" class="form-control" id="turnstile_site_key" name="turnstile_site_key" value="********" required>
                        </div>
                        <div class="form-group">
                            <label for="turnstile_secret_key">{{ __('dashboard.turnstile_secret_key') }}</label>
                            <input type="text" class="form-control" id="turnstile_secret_key" name="turnstile_secret_key" value="********" required>
                        </div>
                        <hr>
                        <h5>{{ __('dashboard.google_recaptcha') }}</h5><br>
                        <div class="form-group">
                            <label for="google_recaptcha_site_key">{{ __('dashboard.google_recaptcha_site_key') }}</label>
                            <input type="text" class="form-control" id="google_recaptcha_site_key" name="google_recaptcha_site_key" value="********" required>
                        </div>
                        <div class="form-group">
                            <label for="google_recaptcha_secret_key">{{ __('dashboard.google_recaptcha_secret_key') }}</label>
                            <input type="text" class="form-control" id="google_recaptcha_secret_key" name="google_recaptcha_secret_key" value="********" required>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
