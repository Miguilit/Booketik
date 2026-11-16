@php
    /*
     | The storefront theme, decided on the server before anything renders:
     | one stylesheet, one page chunk, and the attribute app.jsx boots from.
     | ThemeResolver memoises per request, so this, the `siteTheme` prop and
     | the Inertia asset version always agree.
     */
    $siteTheme = \App\Support\Themes\ThemeResolver::for(request());
    // Right-to-left for RTL locales, so every theme's `[dir=rtl]` / `rtl:` styles apply.
    $siteDir = \App\Models\Locale::where('code', app()->getLocale())->value('is_rtl') ? 'rtl' : 'ltr';
    // Name / favicon set under Admin → Appearance → Branding, APP_NAME and
    // /favicon.png as fallbacks. Read once here; see App\Support\SiteBrand.
    $siteName = \App\Support\SiteBrand::name();
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ $siteDir }}" class="h-full"
      data-site-theme="{{ $siteTheme }}"
      data-default-mode="{{ \App\Support\Themes\ThemeRegistry::defaultMode($siteTheme) }}"
      data-site-name="{{ $siteName }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    {{-- The app's own mark, shared with the mobile client and the reference
         web build so the three read as one product in a tab strip. --}}
    {{--
        Light / dark, applied before first paint.

        Runs ahead of every stylesheet so the very first frame is already in the
        right mode — no white flash on a dark reload. The rules match
        resources/js/Site/mode.js exactly: an explicit `site_mode` wins, else
        the active theme's `data-default-mode`, else the OS preference. Wrapped
        in try/catch because blocked storage must degrade to "system", never
        to a broken page.
    --}}
    <script>
        (function () {
            var root = document.documentElement, mode = 'system';
            try { mode = localStorage.getItem('site_mode') || root.dataset.defaultMode || 'system'; } catch (e) {}
            var dark = mode === 'dark' || (mode !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
            root.classList.toggle('dark', dark);
            root.style.colorScheme = dark ? 'dark' : 'light';
        })();
    </script>

    {{-- The operator's favicon when one is uploaded (png / ico / webp), the
         bundled one otherwise — plus the bundled SVG and the web manifest
         (public/site.webmanifest). `type` follows the file, so an .ico is not
         announced as a PNG. --}}
    <link rel="icon" type="{{ \App\Support\SiteBrand::faviconType() }}" href="{{ \App\Support\SiteBrand::faviconUrl() }}">
    @if($svgFavicon = \App\Support\SiteBrand::svgFaviconUrl())
        <link rel="icon" type="image/svg+xml" href="{{ $svgFavicon }}">
    @endif
    <link rel="apple-touch-icon" href="{{ \App\Support\SiteBrand::touchIconUrl() }}">
    <link rel="manifest" href="{{ url(\App\Support\SiteBrand::MANIFEST) }}">
    <meta name="theme-color" content="#FF5A36">

    @php
        /*
         | Link-preview meta, rendered here rather than by Inertia's <Head>.
         |
         | Social crawlers do not run JavaScript. Facebook, WhatsApp, Twitter,
         | Slack and iMessage fetch this document and read it as delivered. With
         | Inertia SSR the body is rendered, but <Head> output depends on the
         | SSR process running; without it anything React sets exists only
         | after mount, long after the crawler has taken what it found and left.
         | Meta set in React previews as the site's name on every link, for
         | every event.
         |
         | Pages that build one pass it as an ordinary prop; everything else
         | falls back to the site defaults. See App\Support\PageMeta.
         */
        $meta = $page['props']['meta'] ?? null;
        $metaTitle = $meta['title'] ?? $siteName;
    @endphp

    @php
        // Inertia SSR (memoised: @inertia and @inertiaHead reuse this response).
        // Its head already carries the page's <title>; print ours only without it.
        $ssrResponse = app(\Inertia\Ssr\SsrState::class)->setPage($page)->dispatch();
        $ssrHead = $ssrResponse?->head ?? '';
    @endphp
    @unless(str_contains($ssrHead, '<title'))
        <title data-inertia>{{ $metaTitle }}</title>
    @endunless

    @if($meta)
        <meta name="description" content="{{ $meta['description'] }}">

        {{-- Canonical carries no campaign parameters: a crawler treats
             `?utm_source=…` as a different page, which would split a page's
             ranking and its share counts across every campaign that ever
             pointed at it. --}}
        <link rel="canonical" href="{{ $meta['canonical'] }}">

        @foreach(($meta['alternates'] ?? []) as $code => $href)
            <link rel="alternate" hreflang="{{ $code }}" href="{{ $href }}">
        @endforeach
        @if(!empty($meta['alternates']['en']))
            <link rel="alternate" hreflang="x-default" href="{{ $meta['alternates']['en'] }}">
        @endif

        <meta property="og:site_name" content="{{ $siteName }}">
        <meta property="og:type" content="{{ $meta['type'] }}">
        <meta property="og:url" content="{{ $meta['canonical'] }}">
        <meta property="og:title" content="{{ $meta['title'] }}">
        <meta property="og:description" content="{{ $meta['description'] }}">
        <meta property="og:locale" content="{{ str_replace('-', '_', app()->getLocale()) }}">

        @if(!empty($meta['image']))
            <meta property="og:image" content="{{ $meta['image'] }}">
            {{-- Dimensions declared so the unfurler can reserve the card's
                 shape before it has fetched the file — without them some
                 clients show a text-only preview on first paste. --}}
            <meta property="og:image:width" content="1200">
            <meta property="og:image:height" content="630">
            <meta property="og:image:alt" content="{{ $meta['title'] }}">
        @endif

        {{-- The organizer, for unfurlers that show a byline. --}}
        @if(!empty($meta['author']))
            <meta name="author" content="{{ $meta['author'] }}">
        @endif

        <meta name="twitter:card" content="{{ !empty($meta['image']) ? 'summary_large_image' : 'summary' }}">
        <meta name="twitter:title" content="{{ $meta['title'] }}">
        <meta name="twitter:description" content="{{ $meta['description'] }}">
        @if(!empty($meta['image']))
            <meta name="twitter:image" content="{{ $meta['image'] }}">
        @endif
    @endif

    {{-- schema.org Event for the event pages (App\Support\EventJsonLd),
         already JSON-encoded with `<`, `>` and `&` escaped, so it cannot close
         the script element. Printed here, not by React: crawlers read the
         document as delivered. --}}
    @if(!empty($page['props']['jsonLd']))
        <script type="application/ld+json">{!! $page['props']['jsonLd'] !!}</script>
    @endif

    @if(!empty($page['props']['preloadImage']['href']))
        @php($lcp = $page['props']['preloadImage'])
        @if(!empty($lcp['origin']) && $lcp['origin'] !== request()->getSchemeAndHttpHost())
            <link rel="preconnect" href="{{ $lcp['origin'] }}">
        @endif
        {{-- `type` (image/avif, image/webp) when the cover has responsive copies:
             a browser that cannot decode it skips the hint instead of
             downloading a file the <picture> will not use. --}}
        <link rel="preload" as="image" fetchpriority="high" href="{{ $lcp['href'] }}"
              @if(!empty($lcp['type'])) type="{{ $lcp['type'] }}" @endif
              @if(!empty($lcp['srcset'])) imagesrcset="{{ $lcp['srcset'] }}" imagesizes="{{ $lcp['sizes'] }}" @endif>
    @endif

    @if($displayFont = \App\Support\Themes\ThemeRegistry::displayFontUrl($siteTheme, app()->getLocale()))
        {{-- Only the display face (titles above the fold); the rest swap in from the stylesheet. --}}
        <link rel="preload" as="font" type="font/woff2" href="{{ $displayFont }}" crossorigin>
    @endif

    {{-- Turnstile loads on demand, when a form with a challenge mounts (Core/lib/auth/turnstileScript.js). --}}

    {{-- AdSense, only when the operator has configured it and the visitor is not
         a Plus member. `$page['props']['ads']` is null in both other cases, so the script
         is absent from the document rather than loaded and left unused —
         paying to remove ads should remove the request, not just the box. --}}
    @if(!empty($page['props']['ads']['client']))
        <script async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={{ $page['props']['ads']['client'] }}"
                crossorigin="anonymous"></script>
    @endif

    {{-- The operator's tile server (Admin → Settings → Maps), read by Core/map.js; OSM otherwise. --}}
    @if (\App\Support\MapsSettings::customTiles())
        <script>window.EVENTGOO_TILES = @json(\App\Support\MapsSettings::tileUrl()); window.EVENTGOO_TILE_ATTRIBUTION = @json(\App\Support\MapsSettings::attribution());</script>
    @endif

    <!-- Scripts -->
    {{-- No @routes: nothing on the site calls Ziggy's route(), and its 80 kB of
         inline route table was parsed before the first paint on every page. --}}
    @viteReactRefresh
    {{-- The theme's stylesheet first (app.jsx imports no CSS), then the app,
         then the page chunk — the theme's own page when it has one, else
         Civic's, exactly as resolvePage() in app.jsx decides. --}}
    {{-- Server-rendered pages start their JavaScript on `load` instead
         (App\Support\DeferredVite): the HTML is already the page. --}}
    {{ \App\Support\DeferredVite::tags([
        \App\Support\Themes\ThemeRegistry::cssEntry($siteTheme),
        'resources/js/app.jsx',
        \App\Support\Themes\ThemeRegistry::pageEntry($siteTheme, $page['component']),
        ...array_filter([\App\Support\Themes\ThemeRegistry::layoutEntry($siteTheme)]),
    ], $ssrResponse !== null) }}
    @inertiaHead
</head>
{{-- No colour or font classes here: each theme's stylesheet styles `body`
     itself, because a class only exists in
     the bundle of the theme whose Tailwind config defines it. --}}
<body class="antialiased">
@inertia
@include('partials.demo-frame-notice')


{{-- Only emitted when an id is actually configured: the unquoted interpolation
     used to render `gtag('config', );`, a syntax error that killed the script
     block on every install that had not set GOOGLE_ANALYTICS_ID. --}}
@if(config('eventgoo.analytics.google_id'))
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ config('eventgoo.analytics.google_id') }}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }

        gtag('js', new Date());
        gtag('config', @json(config('eventgoo.analytics.google_id')));
    </script>
@endif

<!-- Cookie Consent by TermsFeed https://www.TermsFeed.com -->
{{--
    Explicit https, not the protocol-relative `//` this shipped with: that form
    resolves to http:// when the page itself is served over http, which is a
    mixed-content block on any origin that later moves to https and a silent
    "no banner at all" rather than a visible failure.
--}}
{{-- `defer`: a parser-blocking third-party script at the end of <body> held
     back every module script (the app) until it had downloaded. Deferred
     scripts still run before DOMContentLoaded, so the handler below fires. --}}
<script type="text/javascript" src="https://www.termsfeed.com/public/cookie-consent/4.1.0/cookie-consent.js"
        charset="UTF-8" defer></script>
<script type="text/javascript" charset="UTF-8">
    document.addEventListener('DOMContentLoaded', function () {
        // Blocked (a privacy extension, a stricter CSP, offline): no banner, no error.
        if (typeof window.cookieconsent === 'undefined') return;
        cookieconsent.run({
            "notice_banner_type": "simple",
            "consent_type": "express",
            /*
             | The stock palette matching the page's mode, as the floor, not the
             | finish: the theme's stylesheet (Themes/shared-base.css) restyles
             | both the bar and the preferences dialog onto the site's tokens. Starting from the
             | matching palette means a load where that stylesheet is missing
             | still shows a card that belongs on the page rather than a slab
             | of the opposite colour across the bottom of it.
             */
            "palette": document.documentElement.classList.contains('dark') ? "dark" : "light",
            "language": @json(app()->getLocale()),
            "page_load_consent_levels": ["strictly-necessary"],
            "notice_banner_reject_button_hide": false,
            "preferences_center_close_button_hide": false,
            "page_refresh_confirmation_buttons": false,
            "website_name": @json($siteName),
            /*
             | Locale-prefixed. Every site page lives under `/{locale}`, so the
             | bare `/pages/privacy-policy` this pointed at matched no route and
             | 404'd — the one link on a consent banner that has to work.
             */
            "website_privacy_policy_url": @json(url(app()->getLocale().'/pages/privacy-policy'))
        });
    });
</script>
<noscript>Free cookie consent management tool by <a href="https://www.termsfeed.com/">TermsFeed</a></noscript>
{{--<a href="#" id="open_preferences_center">Update cookies preferences</a>--}}
</body>
</html>
