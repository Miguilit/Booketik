@php use Illuminate\Support\Facades\Auth;use Illuminate\Support\Facades\Session; @endphp
    <!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ \App\Support\Locales::isRtl(app()->getLocale()) ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ \App\Support\SiteBrand::name() }}</title>

    {{-- Light or dark before the first paint: the operator's pick from the
         header toggle, else the OS preference (eventgoo-admin.css, section 1). --}}
    @include('admin.partials.theme-boot')

    {{--
        Every stylesheet and script below is served from this origin.

        Nothing on the admin prefix is loaded from a public CDN. This is the
        highest-privilege surface in the product, and a script fetched from a
        third party runs with the session of whoever is signed in: a CDN
        compromise, or a silent change behind a floating tag like
        `toastr.js/latest`, is admin account takeover. Self-hosting also means
        the panel works on an offline or air-gapped install.

        Third-party libraries live under `backend/assets/libs/` at a pinned
        version, each beside its own licence file. They are not edited copies:
        jQuery, Bootstrap and Chart.js are declared in package.json and copied
        out of node_modules by `npm run libs`, so upgrading one is

            npm install --save-dev jquery@x.y.z   # or bootstrap, chart.js
            npm run libs

        and the version that ships is the version the lockfile records. That is
        the whole reason for the indirection — a hand-dropped minified file has
        no version anyone can audit, which is how this panel spent a while on
        jQuery 3.2.1 and Bootstrap 4.1.0 without anyone noticing.

        **Bootstrap is 5.x**, which has no jQuery plugin bridge: `$(el).modal()`
        and friends do not exist, and the data attributes are `data-bs-toggle` /
        `data-bs-target`. Only dropdown, collapse and tooltip are used here.
    --}}
    <link href="{{ asset('backend/assets/libs/mdi/css/materialdesignicons.min.css') }}" rel="stylesheet"/>

    <!-- PLUGINS CSS STYLE -->
    <link href="{{ asset('backend/assets/plugins/toaster/toastr.min.css') }}" rel="stylesheet"/>
    <link href="{{ asset('backend/assets/plugins/nprogress/nprogress.css') }}" rel="stylesheet"/>
    <link href="{{ asset('backend/assets/plugins/ladda/ladda.min.css') }}" rel="stylesheet"/>
    <link rel="stylesheet" href="{{ asset('backend/assets/libs/trix/trix.css') }}"/>

    <!-- SLEEK CSS -->
    <link id="sleek-css" rel="stylesheet" href="{{ asset('backend/assets/css/sleek.css') }}"/>

    <!-- FAVICON -->
    {{-- The operator's favicon (Admin → Appearance → Branding), so the panel's
         tab matches the site's; the bundled one when none is uploaded. --}}
    <link rel="icon" type="{{ \App\Support\SiteBrand::faviconType() }}" href="{{ \App\Support\SiteBrand::faviconUrl() }}"/>
    @if($svgFavicon = \App\Support\SiteBrand::svgFaviconUrl())
        <link rel="icon" type="image/svg+xml" href="{{ $svgFavicon }}"/>
    @endif
    <link rel="apple-touch-icon" href="{{ \App\Support\SiteBrand::touchIconUrl() }}"/>
    <link rel="manifest" href="{{ url(\App\Support\SiteBrand::MANIFEST) }}"/>
    <meta name="theme-color" content="#FAF8F4" media="(prefers-color-scheme: light)"/>
    <meta name="theme-color" content="#171412" media="(prefers-color-scheme: dark)"/>

    {{-- jQuery loads here rather than in the footer: the plugins below and
         several page-level scripts call into it before the footer runs. --}}
    <script src="{{ asset('backend/assets/libs/jquery/jquery.min.js') }}"></script>
    <script src="{{ asset('backend/assets/plugins/nprogress/nprogress.js') }}"></script>
    <script src="{{ asset('backend/assets/libs/trix/trix.umd.min.js') }}"></script>
    <script src="{{ asset('backend/assets/libs/chart.js/chart.umd.min.js') }}"></script>

    <!-- PRODUCT THEME — must load last so it overrides sleek.css and every
         plugin stylesheet. All tokens live in :root inside this file. -->
    <link rel="stylesheet" href="{{ asset('backend/assets/css/eventgoo-admin.css') }}?v={{ filemtime(public_path('backend/assets/css/eventgoo-admin.css')) }}"/>
    {{-- Row menus, pill tabs, edit drawers and toasts — the shared list-screen system. --}}
    <link rel="stylesheet" href="{{ asset('backend/assets/css/panel-actions.css') }}?v={{ filemtime(public_path('backend/assets/css/panel-actions.css')) }}"/>
    <link rel="stylesheet" href="{{ asset('backend/assets/css/media-ui.css') }}?v={{ filemtime(public_path('backend/assets/css/media-ui.css')) }}"/>
    {{-- Page-specific styles (e.g. AI Studio), after the theme so they can refine it. --}}
    @stack('styles')
</head>


<body class="sidebar-fixed sidebar-dark header-light header-fixed" id="body">
<script>
    NProgress.configure({showSpinner: false});
    NProgress.start();
</script>

{{-- No static `.mobile-sticky-body-overlay` here: sleek.js adds one when the
     sidebar is opened on a phone. A copy in the markup dimmed every page
     under 768px from the first paint. --}}

<div class="wrapper">

    <!--
====================================
——— LEFT SIDEBAR WITH FOOTER
=====================================
-->

    @include('admin.body.sidebar')

    <div class="page-wrapper">
        <!-- Header -->
        <header class="main-header " id="header">
            <nav class="navbar navbar-static-top navbar-expand-lg">
                <!-- Sidebar toggle button -->
                <button id="sidebar-toggler" class="sidebar-toggle">
                    <span class="sr-only">{{ __('Toggle navigation') }}</span>
                </button>
                <!-- search form -->
                <div class="search-form d-none d-lg-inline-block">

                </div>

                {{--
                    The language picker used to sit in its own `navbar-nav`
                    block before `.navbar-right`. Since `.navbar-right` is
                    pushed over with `margin-left:auto`, that left the picker
                    stranded in the middle of the header. It now lives inside
                    the same list as the account menu, so the two sit together
                    on the right.
                --}}
                <div class="navbar-right">
                    <ul class="nav navbar-nav align-items-center">
                        <li class="nav-item me-1">
                            @include('admin.partials.theme-toggle')
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle cl-lang-toggle" href="#" id="languageDropdown"
                               role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                {{ strtoupper(app()->getLocale()) }}
                            </a>
                            <div class="dropdown-menu dropdown-menu-right" aria-labelledby="languageDropdown">
                                @foreach($locales as $locale)
                                    @php
                                        // Rebuild the current path under the chosen locale.
                                        $segments = explode('/', request()->path());

                                        if (in_array($segments[0], $locales->pluck('code')->toArray())) {
                                            array_shift($segments);
                                        }

                                        $newUrl = url($locale->code . '/' . implode('/', $segments));
                                    @endphp
                                    <a class="dropdown-item {{ app()->getLocale() === $locale->code ? 'active' : '' }}"
                                       href="{{ $newUrl }}">
                                        {{ $locale->name }}
                                    </a>
                                @endforeach
                            </div>
                        </li>

                        <!-- User Account -->
                        <li class="dropdown user-menu">
                            <button href="#" class="dropdown-toggle nav-link" data-bs-toggle="dropdown">
                                @include('admin.partials.user-avatar', ['class' => 'user-image'])
                                <span class="d-none d-lg-inline-block">{{ Auth::user()->name }}</span>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-right">
                                <!-- User image -->
                                <li class="dropdown-header">
                                    @include('admin.partials.user-avatar', ['class' => 'img-circle'])
                                    <div class="d-inline-block">
                                        {{ Auth::user()->name }} <small class="pt-1">{{ Auth::user()->email }}</small>
                                    </div>
                                </li>

                                <li>
                                    <a href="{{ route('profile.update',  ['locale' => app()->getLocale()]) }}">
                                        <i class="mdi mdi-account"></i> {{ __('dashboard.my_profile') }}
                                    </a>
                                </li>
                                <li>
                                    <a href="{{ route('change.password',  ['locale' => app()->getLocale()]) }}">
                                        <i class="mdi mdi-email"></i> {{ __('dashboard.change_password') }}
                                    </a>
                                </li>

                                <li class="dropdown-footer">
                                    <x-admin.destructive-form :action="route('user.logout',  ['locale' => app()->getLocale()])"
                                        method="POST"
                                        :confirm="false"
                                        class=""><i class="mdi mdi-logout"></i> {{ __('dashboard.logout') }}</x-admin.destructive-form>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </nav>

        </header>


        <div class="content-wrapper">
            <div class="content">
                @yield('admin')
            </div>
        </div>

        <footer class="footer mt-auto">
            <div class="copyright bg-white">
                <p>
                    &copy; <span id="copy-year">2024</span> {{ __('dashboard.copyright') }}
                    <span class="text-primary">{{ \App\Support\SiteBrand::name() }}</span>.
                </p>
            </div>
            <script>
                var d = new Date();
                var year = d.getFullYear();
                document.getElementById("copy-year").innerHTML = year;
            </script>
        </footer>

    </div>
</div>


<script src="{{asset('backend/assets/libs/bootstrap/bootstrap.bundle.min.js')}}"></script>
<script src="{{asset('backend/assets/plugins/toaster/toastr.min.js')}}"></script>
<script src="{{asset('backend/assets/plugins/slimscrollbar/jquery.slimscroll.min.js')}}"></script>
<script src="{{asset('backend/assets/plugins/ladda/spin.min.js')}}"></script>
<script src="{{asset('backend/assets/plugins/ladda/ladda.min.js')}}"></script>
<script src="{{asset('backend/assets/js/custom.js')}}"></script>
<script src="{{asset('backend/assets/js/sleek.js')}}"></script>
{{-- Mobile admin: native touch scroll and responsive table containment. --}}
    <script src="{{ asset('backend/assets/js/booketik-admin-mobile-r2.js') }}?v={{ filemtime(public_path('backend/assets/js/booketik-admin-mobile-r2.js')) }}"></script>

{{-- Eventgoo UI enhancements (number steppers). Loaded last so it sees any
     fields the plugins above have already rendered. --}}
<script src="{{ asset('backend/assets/js/eventgoo-ui.js') }}?v={{ filemtime(public_path('backend/assets/js/eventgoo-ui.js')) }}"></script>
<script src="{{ asset('backend/assets/js/panel-actions.js') }}?v={{ filemtime(public_path('backend/assets/js/panel-actions.js')) }}"></script>
<script src="{{ asset('backend/assets/js/media-ui.js') }}?v={{ filemtime(public_path('backend/assets/js/media-ui.js')) }}"></script>
{{-- The read-only-until-Edit lock on detail forms. It fails open: without this
     script every form is simply editable, which is why the contract test in
     AdminFormLockTest checks that it is on the page. --}}
<script src="{{ asset('backend/assets/js/form-lock.js') }}?v={{ filemtime(public_path('backend/assets/js/form-lock.js')) }}"></script>
{{-- Read-only-until-Edit. Deliberately last and deliberately plain: it fails
     open, so a load failure here leaves every form editable rather than
     leaving the panel unusable. --}}

@yield('scripts')

{{-- Partial-level scripts (offer step builder, etc.) push here. --}}
@stack('scripts')

<script>
    @if(Session::has('message'))
    var type = "{{ Session::get('alert-type', 'info') }}";
    switch (type) {
        case 'info':
            toastr.info("{{ Session::get('message') }}")
            break
        case 'success':
            toastr.success("{{ Session::get('message') }}")
            break
        case 'warning':
            toastr.warning("{{ Session::get('message') }}")
            break
        case 'error':
            toastr.error("{{ Session::get('message') }}")
            break
    }
    @endif
</script>

{{-- A rich-text editor, loaded only on the screens that mount one.
     Vite rather than a plain script tag because it is a bundle with real
     dependencies; the rest of this panel's assets predate that and are left
     alone. --}}
@stack('editor')
{{-- Forms for the destructive-action buttons. Rendered here, outside every
     other form on the page, because a form cannot be nested in a form —
     see resources/views/components/admin/destructive-form.blade.php. --}}
@stack('destructive-forms')

@include('partials.demo-frame-notice')
</body>
</html>
