@php use Carbon\Carbon; @endphp
@extends('admin.admin_master')

@section('admin')
    <div class="row">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">{{ __('dashboard.update_smtp_settings') }}</div>
                <div class="card-body">
                    <form action="{{ route('update.env.smtp', ['locale' => app()->getLocale()]) }}" method="POST">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])
                        <div class="form-group">
                            <label for="mail_mailer">{{ __('dashboard.mailer') }}</label>
                            <input type="text" class="form-control" id="mail_mailer" name="mail_mailer" value="{{ config('mail.default') }}" required>
                        </div>
                        <div class="form-group">
                            <label for="mail_host">{{ __('dashboard.host') }}</label>
                            <input type="text" class="form-control" id="mail_host" name="mail_host" value="{{ config('mail.mailers.smtp.host') }}" required>
                        </div>
                        <div class="form-group">
                            <label for="mail_port">{{ __('dashboard.port') }}</label>
                            <input type="text" class="form-control" id="mail_port" name="mail_port" value="{{ config('mail.mailers.smtp.port') }}" required>
                        </div>
                        <div class="form-group">
                            <label for="mail_username">{{ __('dashboard.username') }}</label>
                            <input type="text" class="form-control" id="mail_username" name="mail_username" value="********" required>
                        </div>
                        <div class="form-group">
                            <label for="mail_password">{{ __('dashboard.password') }}</label>
                            <input type="password" class="form-control" id="mail_password" name="mail_password" value="********" required>
                        </div>
                        <div class="form-group">
                            <label for="mail_from_address">{{ __('dashboard.from_address') }}</label>
                            <input type="text" class="form-control" id="mail_from_address" name="mail_from_address" value="{{ config('mail.from.address') }}" required>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
