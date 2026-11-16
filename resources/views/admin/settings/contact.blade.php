@extends('admin.admin_master')
@section('admin')
    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>{{ session('success') }}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert"
                    aria-label="{{ __('Close') }}"></button>
        </div>
    @endif

    <div class="row">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">{{ __('dashboard.contact_settings') }}</div>
                <div class="card-body">
                    <form action="{{ route('admin.save.contact.settings', ['locale' => app()->getLocale()]) }}"
                          method="POST"
                          enctype="multipart/form-data">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])
                        <div class="form-group">
                            <label for="contact_title" class="form-label">{{ __('dashboard.contact_title') }}</label>
                            <input type="text" name="contact_title" class="form-control"
                                   placeholder="{{ __('dashboard.contact_title') }}"
                                   value="{{ $contactSettings ? $contactSettings->contact_title : '' }}">
                        </div>

                        <div class="form-group">
                            <label for="contact_form_title" class="form-label">{{ __('dashboard.contact_form_title') }}</label>
                            <input type="text" name="contact_form_title" class="form-control"
                                   placeholder="{{ __('dashboard.contact_form_title') }}"
                                   value="{{ $contactSettings ? $contactSettings->contact_form_title : '' }}">
                        </div>

                        <div class="form-group">
                            <label for="contact_form_button_text" class="form-label">{{ __('dashboard.contact_form_button_text') }}</label>
                            <input type="text" name="contact_form_button_text" class="form-control"
                                   placeholder="{{ __('dashboard.contact_form_button_text') }}"
                                   value="{{ $contactSettings ? $contactSettings->contact_form_button_text : '' }}">
                        </div>

                        <div class="form-group">
                            <label for="address" class="form-label">{{ __('dashboard.address') }}</label>
                            <input type="text" name="address" class="form-control"
                                   placeholder="{{ __('dashboard.address') }}"
                                   value="{{ $contactSettings ? $contactSettings->address : '' }}">
                        </div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="address_status" name="address_status" {{ optional($contactSettings)->address_status ? 'checked' : '' }}>
                                <label class="form-check-label" for="address_status">{{ __('dashboard.address_status') }}</label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="tel" class="form-label">{{ __('dashboard.tel') }}</label>
                            <input type="text" name="tel" class="form-control"
                                   placeholder="{{ __('dashboard.tel') }}"
                                   value="{{ $contactSettings ? $contactSettings->tel : '' }}">
                        </div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="tel_status" name="tel_status" {{ optional($contactSettings)->tel_status ? 'checked' : '' }}>
                                <label class="form-check-label" for="tel_status">{{ __('dashboard.tel_status') }}</label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="email" class="form-label">{{ __('dashboard.email') }}</label>
                            <input type="text" name="email" class="form-control"
                                   placeholder="{{ __('dashboard.email') }}"
                                   value="{{ $contactSettings ? $contactSettings->email : '' }}">
                        </div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="email_status" name="email_status" {{ optional($contactSettings)->email_status ? 'checked' : '' }}>
                                <label class="form-check-label" for="email_status">{{ __('dashboard.email_status') }}</label>
                            </div>
                        </div>
                        <div class="form-footer pt-4 mt-4">
                        </div>
                    </form>
                </div>
            </div>
        </div>

    </div>
@endsection
