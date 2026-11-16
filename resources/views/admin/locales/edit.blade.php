@extends('admin.admin_master')
@section('admin')
    @php($current = app()->getLocale())

    {{--
        The wrapper was `<div class="py-12"><div class="container">` — `py-12`
        is a Tailwind class that does nothing here, and the nested `.container`
        re-padded content that `.content` has already padded, narrowing the form
        against every other screen.
    --}}
    <div class="row">
        <div class="col-lg-7">
            <div class="card card-default">
                @include('admin.partials.flash')

                <div class="card-header card-header-border-bottom">
                    <h2>{{ __('dashboard.update_locale') }}</h2>
                </div>

                <div class="card-body">
                    <form action="{{ route('admin.locales.update', ['locale' => $current, 'id' => $locale->id]) }}"
                          method="POST" enctype="multipart/form-data">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save locale')])

                        <div class="form-group mb-3">
                            <label for="localeName" class="form-label">{{ __('dashboard.locale_name') }}</label>
                            <input type="text" name="name" class="form-control" id="localeName"
                                   value="{{ old('name', $locale->name) }}" required>
                            @error('name')
                            <span class="text-danger">{{ $message }}</span>
                            @enderror
                        </div>

                        <div class="form-group mb-3">
                            <label for="localeCode" class="form-label">{{ __('dashboard.locale_code') }}</label>
                            <input type="text" name="code" class="form-control" id="localeCode"
                                   value="{{ old('code', $locale->code) }}" required>
                            <small class="text-muted">{{ __('Needs a matching translation folder.') }}</small>
                            @error('code')
                            <span class="text-danger">{{ $message }}</span>
                            @enderror
                        </div>

                        {{-- The file input carried id="exampleInputEmail1", a
                             `value` attribute (ignored on file inputs) and an
                             aria-describedby pointing at no element. The current
                             flag now sits beside the field instead of floating
                             below it in a fixed 50px box. --}}
                        <div class="form-group mb-3">
                            <label for="flag_image" class="form-label">{{ __('dashboard.flag_image') }}</label>
                            <div class="d-flex align-items-center gap-3">
                                @if($locale->flag_image)
                                    <img src="{{ asset($locale->flag_image) }}" alt="" class="cl-flag">
                                @else
                                    <span class="cl-flag cl-flag-empty">{{ Str::upper($locale->code) }}</span>
                                @endif
                                <input type="file" name="flag_image" class="form-control" id="flag_image"
                                       accept="image/*">
                            </div>
                            <small class="text-muted">{{ __('Leave empty to keep the current flag.') }}</small>
                            @error('flag_image')
                            <span class="text-danger">{{ $message }}</span>
                            @enderror
                        </div>

                        {{--
                            No hidden "0" companion here, unlike the other boolean
                            fields: LocaleController uses `$request->has('is_active')`,
                            which would read a hidden 0 as "on" and make every locale
                            permanently active.
                        --}}
                        <div class="form-group mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       name="is_active" value="1" id="is_active"
                                       @checked($locale->is_active)>
                                <label class="form-check-label"
                                       for="is_active">{{ __('dashboard.active') }}</label>
                            </div>
                        </div>

                        <div class="pt-3 mt-3 border-top">
                            <a href="{{ route('admin.all.locales', ['locale' => $current]) }}"
                               class="btn btn-secondary">{{ __('dashboard.cancel') }}</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
