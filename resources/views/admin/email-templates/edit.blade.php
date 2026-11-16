@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();

        // Built from pieces: a literal {{ in a Blade string is compiled as an echo.
        $placeholder = fn (string $name) => '{'.'{ $'.$name.' }'.'}';
    @endphp

    @include('admin.partials.flash')

    <div class="py-12">
        <div class="container">
            <div class="row">

                <div class="col-md-12">
                    <div class="card-body">
                        <form
                            action="{{ route('admin.email-templates.update', ['locale' => $locale, 'id' => $template->id]) }}"
                            method="POST">
                            @csrf
                            <h3>
                                {{ $template->name }}
                            </h3><br>

                            <div class="form-group">
                                <label for="name" class="form-label">{{ __('dashboard.template_name') }}</label>
                                <input type="text" name="name" class="form-control"
                                       id="name" required
                                       placeholder="{{ __('dashboard.template_name') }}" value="{{ old('name', $template->name) }}">
                            </div>

                            <div class="form-group">
                                <label for="subject" class="form-label">{{ __('Subject') }}</label>
                                <input type="text" name="subject" class="form-control" id="subject"
                                       value="{{ old('subject', $template->subject) }}">
                            </div>

                            <div class="form-group">
                                <label class="form-label">{{ __('Key') }}</label>
                                <input type="text" class="form-control" value="{{ $template->key }}" disabled>
                                <small class="text-muted">{{ __('Cannot be changed.') }}</small>
                            </div>

                            <div class="form-group">
                                <label for="template" class="form-label">{{ __('dashboard.template') }}</label>
                                <div class="small mb-2">
                                    @foreach(array_keys($samples) as $name)
                                        <code class="mr-1">{{ $placeholder($name) }}</code>
                                    @endforeach
                                    <code class="mr-1">{{ $placeholder('app_name') }}</code>
                                </div>
                                {{-- A plain HTML field rather than the Trix editor: it stripped
                                     inline styles (the big verification code) and rewrote markup
                                     on every save. --}}
                                <textarea name="template" id="template" class="form-control" rows="16" required
                                          style="font-family:monospace; font-size:12px">{{ old('template', $template->template) }}</textarea>
                            </div>

                            <div class="pt-4 mt-4 border-top"></div>
                            <div class="form-footer pt-4 mt-4">
                                <button type="submit" class="btn btn-primary">{{ __('dashboard.save_template') }}</button>
                                <a class="btn btn-secondary" target="_blank" rel="noopener"
                                   href="{{ route('admin.email-templates.preview', ['locale' => $locale, 'id' => $template->id]) }}">{{ __('Preview') }}</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
