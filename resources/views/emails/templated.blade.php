{{--
    Every template an operator can edit, in Laravel's mail frame — the logo
    header, the panel, the footer — so a templated message looks like the rest of
    the mail the product sends.

    The header is the operator's uploaded logo when there is one, else the
    bundled Eventgoo logo (see App\Support\SiteBrand::emailLogoUrl). Absolute,
    because a mail client has no base URL to resolve a relative one against.
    Lines are not indented: this is markdown, and four spaces is a code block.

    The body is stored HTML and passed through untouched: `<p>` and friends are
    block-level HTML that markdown leaves alone. It is written by an operator in
    the panel and substituted with str_replace, never compiled as Blade.
--}}
@php($brandName = \App\Support\SiteBrand::name())
<x-mail::layout>
<x-slot:header>
<x-mail::header :url="config('app.url')">
<img src="{{ \App\Support\SiteBrand::emailLogoUrl() }}" alt="{{ $brandName }}" height="40" style="height: 40px; max-height: 40px; width: auto; border: 0;">
</x-mail::header>
</x-slot:header>

{!! $content !!}

<x-slot:footer>
<x-mail::footer>
© {{ date('Y') }} {{ $brandName }}. {{ __('All rights reserved.') }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
