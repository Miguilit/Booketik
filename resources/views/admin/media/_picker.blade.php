{{-- The one picker drawer every <x-media-picker> on the page shares. --}}
@php $locale = app()->getLocale(); @endphp

<button type="button" class="d-none" data-drawer="#media-picker" aria-hidden="true" tabindex="-1" data-media-picker-open></button>

<x-drawer id="media-picker" :title="__('Media library')" :subtitle="__('Choose a file')" :wide="true" :stack="true">
    <div data-media-picker
         data-browse-url="{{ route('admin.media.browse', ['locale' => $locale]) }}"
         data-upload-url="{{ route('admin.media.upload', ['locale' => $locale]) }}"
         data-max-bytes="{{ \App\Support\Media\MediaLibrary::uploadLimitBytes() }}"
         data-limit-source="{{ \App\Support\Media\MediaLibrary::uploadLimitSource() }}">
        <div class="cl-picker-toolbar">
            <input type="search" class="form-control form-control-sm" placeholder="{{ __('Search') }}" data-picker-search>
            <select class="form-control form-control-sm" data-picker-folder>
                <option value="">{{ __('All folders') }}</option>
                @foreach(app(\App\Support\Media\MediaLibrary::class)->folders() as $key => $label)
                    <option value="{{ $key }}">{{ $label }}</option>
                @endforeach
            </select>
            <label class="btn btn-sm btn-primary mb-0">
                <i class="mdi mdi-upload"></i> {{ __('Upload') }}
                <input type="file" multiple hidden data-picker-upload>
            </label>
        </div>

        <div class="cl-upload-list" data-picker-queue></div>

        <div class="cl-picker-grid" data-picker-grid></div>

        <div class="text-center mt-3">
            <button type="button" class="btn btn-sm btn-secondary" data-picker-more hidden>{{ __('Load more') }}</button>
        </div>
    </div>

    <x-slot name="footer">
        <span class="small text-muted me-auto" data-picker-count></span>
        <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
    </x-slot>
</x-drawer>
