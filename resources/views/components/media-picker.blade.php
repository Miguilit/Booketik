{{--
    A catalogue media field: pick a file from Media → Library, upload one into
    it, or paste a URL.

    Stores the library **path** (`catalog/covers/x.jpg`), never a hostname, so
    the file follows whatever storage provider and CDN are chosen under
    Media → Storage & CDN. A pasted absolute URL is still accepted and stored
    as typed.

    Public media only (covers, portraits, logos, icons): everything picked
    here is served from the public library.

    @param string $name     Input name.
    @param string|null $value  Stored value.
    @param string $accept   image | audio | document | video (legacy) — what
                            the library shows first.
    @param string $folder   Library folder new uploads go to.
    @param string|null $label
    @param bool $required
    @param string $size     '' or 'sm', to sit in the compact inline forms.
--}}
@props([
    'name',
    'value' => null,
    'accept' => 'image',
    'folder' => 'uploads',
    'label' => null,
    'required' => false,
    'size' => '',
    'id' => null,
    'labelClass' => null,
    'help' => null,
])

@php
    $id = $id ?? 'media-'.\Illuminate\Support\Str::slug($name).'-'.\Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(6));
    $value = (string) ($value ?? '');
    $url = $value !== '' ? \App\Support\MediaUrl::resolve($value) : null;
    $sm = $size === 'sm';
@endphp

<div {{ $attributes->class(['cl-media-field', 'cl-media-field--sm' => $sm]) }}
     data-media-field data-accept="{{ $accept }}" data-folder="{{ $folder }}">
    @if($label)
        <label class="{{ $labelClass ?? ('form-label'.($sm ? ' small' : '')) }}" for="{{ $id }}">{{ $label }}</label>
    @endif

    <div class="cl-media-field__row">
        <a class="cl-media-field__preview" data-media-preview data-kind="{{ $accept }}"
           @if($url) href="{{ $url }}" target="_blank" rel="noopener" @endif>
            @if($accept === 'audio')
                <i class="mdi mdi-{{ $url ? 'music-note' : 'music-note-outline' }}"></i>
            @elseif($accept === 'document')
                {{-- No picture to draw, so the box says what the file is. --}}
                <i class="mdi mdi-file-document-outline"></i>
                @if($value !== '' && ($ext = strtoupper(pathinfo(parse_url($value, PHP_URL_PATH) ?: $value, PATHINFO_EXTENSION))) !== '')
                    <span class="cl-media-thumb__ext">{{ $ext }}</span>
                @endif
            @elseif($url && $accept === 'video')
                {{-- A video: its first frame stands in for a poster. --}}
                <video src="{{ $url }}#t=1" preload="metadata" muted playsinline></video>
                <i class="mdi mdi-play-circle cl-media-thumb__badge"></i>
            @elseif($url)
                <img src="{{ $url }}" alt="" loading="lazy">
            @else
                <i class="mdi mdi-{{ ['video' => 'filmstrip', 'document' => 'file-document-outline'][$accept] ?? 'image-outline' }}"></i>
            @endif
        </a>

        <input type="text" class="form-control {{ $sm ? 'form-control-sm' : '' }} cl-media-field__input"
               id="{{ $id }}" name="{{ $name }}" value="{{ $value }}"
               data-media-value autocomplete="off" @required($required)
               placeholder="{{ ['video' => 'Choose a video', 'audio' => 'Choose an audio file', 'document' => 'Choose a document'][$accept] ?? 'Choose an image' }}">
        <button type="button" class="btn btn-secondary {{ $sm ? 'btn-sm' : '' }} cl-media-field__btn" data-media-choose title="Media library">
            <i class="mdi mdi-folder-multiple-image"></i>
            @unless($sm)<span class="cl-media-field__btn-label">Library</span>@endunless
        </button>
        <button type="button" class="btn btn-secondary {{ $sm ? 'btn-sm' : '' }} cl-media-field__btn" data-media-clear title="Clear" aria-label="Clear">
            <i class="mdi mdi-close"></i>
        </button>
    </div>

    @if($help)
        <small class="text-muted d-block mt-1">{{ $help }}</small>
    @endif
</div>

@once
    @push('scripts')
        @include('admin.media._picker')
    @endpush
@endonce
