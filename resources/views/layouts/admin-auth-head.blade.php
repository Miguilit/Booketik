{{--
    The <head> of the panel's own sign-in screens (login, two-factor,
    confirm password). Static files from this origin only — these pages sit
    behind the panel's Content-Security-Policy and must not need a Vite build:
    the same eventgoo-admin.css as the panel, so they wear Daylight Civic in
    light and dark like everything behind them.
--}}
<meta charset="utf-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>{{ isset($title) ? $title.' · ' : '' }}{{ \App\Support\SiteBrand::name() }}</title>
@include('admin.partials.theme-boot')
<link href="{{ asset('backend/assets/libs/mdi/css/materialdesignicons.min.css') }}" rel="stylesheet"/>
<link href="{{ asset('backend/assets/plugins/nprogress/nprogress.css') }}" rel="stylesheet"/>
<link id="sleek-css" rel="stylesheet" href="{{ asset('backend/assets/css/sleek.css') }}"/>
<link rel="icon" type="{{ \App\Support\SiteBrand::faviconType() }}" href="{{ \App\Support\SiteBrand::faviconUrl() }}"/>
@if($svgFavicon = \App\Support\SiteBrand::svgFaviconUrl())
    <link rel="icon" type="image/svg+xml" href="{{ $svgFavicon }}"/>
@endif
<link rel="apple-touch-icon" href="{{ \App\Support\SiteBrand::touchIconUrl() }}"/>
<link rel="manifest" href="{{ url(\App\Support\SiteBrand::MANIFEST) }}"/>
<meta name="theme-color" content="#FAF8F4" media="(prefers-color-scheme: light)"/>
<meta name="theme-color" content="#171412" media="(prefers-color-scheme: dark)"/>
{{-- Must load last so it overrides sleek.css. --}}
<link rel="stylesheet" href="{{ asset('backend/assets/css/eventgoo-admin.css') }}?v={{ filemtime(public_path('backend/assets/css/eventgoo-admin.css')) }}"/>
