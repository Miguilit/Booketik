@extends('setup.layout')

@section('title', 'Application')
@section('heading', 'Name and address')
@section('lede', 'These end up in .env. The address matters more than it looks: every emailed link, password-reset URL and image path in the mobile app is built from it.')

@section('body')
    @php
        // Prefilled with the address this request actually arrived on, not the
        // one in .env. On a fresh upload .env still carries whatever the author
        // developed against, and the browser you are reading this in is the
        // better authority on where the site lives.
        $configuredUrl = (string) $env->get('APP_URL');
        $appUrl   = $old['app_url']  ?? $detected;
        $appName  = $old['app_name'] ?? ($env->get('APP_NAME') ?: '');
        $appEnv   = $old['app_env']  ?? ($env->get('APP_ENV') ?: 'production');
        $appDebug = array_key_exists('app_debug', $old) ? (bool) $old['app_debug'] : filter_var($env->get('APP_DEBUG', 'false'), FILTER_VALIDATE_BOOL);
        $mismatch = $configuredUrl !== '' && rtrim($configuredUrl, '/') !== rtrim($detected, '/');
    @endphp

    <form method="post" action="{{ url('/setup/application') }}">
        <input type="hidden" name="_setup_token" value="{{ $token }}">

        <div class="panel-body">
            <div class="field">
                <label for="app_name">Site name</label>
                <input type="text" id="app_name" name="app_name" value="{{ $appName }}" required maxlength="100" autofocus>
                <p class="help">Shown in the browser tab, in outgoing email, and at the top of the admin panel.</p>
            </div>

            <div class="field">
                <label for="app_url">Site address</label>
                <input type="url" id="app_url" name="app_url" value="{{ $appUrl }}" required>
                <p class="help">
                    No trailing slash. Detected from this request: <code>{{ $detected }}</code>
                    @if ($mismatch)
                        &mdash; and that is what the field above is set to.
                    @endif
                </p>
            </div>

            @if ($mismatch)
                <div class="note note-warn">
                    <strong>The address in .env does not match the one you are on.</strong>
                    <p style="margin-top:6px">
                        You reached this page at <code>{{ $detected }}</code>, but .env still says <code>{{ $configuredUrl }}</code> &mdash;
                        which is the address the project was developed against, not yours.
                        Left wrong, password-reset emails point at the old address and images in the mobile app fail to load.
                        The field above is already filled in with the detected value &mdash; keep it unless you have a reason not to.
                    </p>
                </div>
            @endif

            @if (str_starts_with($appUrl, 'http://') && ! str_contains($appUrl, 'localhost') && ! str_contains($appUrl, '127.0.0.1'))
                <div class="note note-warn">
                    <strong>This address is not HTTPS.</strong>
                    <p style="margin-top:6px">
                        Admin sign-in, the API tokens the mobile app carries and every password reset would travel in the clear.
                        Nearly all hosts include a free Let's Encrypt certificate &mdash; turn it on for this domain, then come back and use the <code>https://</code> address.
                    </p>
                </div>
            @endif

            <div class="row">
                <div class="field">
                    <label for="app_env">Environment</label>
                    <select id="app_env" name="app_env">
                        <option value="production" @selected($appEnv === 'production')>production &mdash; a live site</option>
                        <option value="staging" @selected($appEnv === 'staging')>staging &mdash; a private copy</option>
                        <option value="local" @selected($appEnv === 'local')>local &mdash; your own machine</option>
                    </select>
                    <p class="help">Leave this on production for anything the public can reach.</p>
                </div>

                @if ($supportsEnvKey('APP_TIMEZONE'))
                    <div class="field">
                        <label for="app_timezone">Timezone</label>
                        <select id="app_timezone" name="app_timezone">
                            @foreach (timezone_identifiers_list() as $tz)
                                <option value="{{ $tz }}" @selected(($old['app_timezone'] ?? $env->get('APP_TIMEZONE', 'UTC')) === $tz)>{{ $tz }}</option>
                            @endforeach
                        </select>
                    </div>
                @endif
            </div>

            <div class="field">
                <label class="check">
                    <input type="checkbox" name="app_debug" value="1" @checked($appDebug)>
                    <span>
                        Show detailed errors in the browser
                        <span class="help" style="display:block">
                            Useful while you are setting up, because otherwise a misconfiguration shows only as
                            <code>500 | Server Error</code>. <strong>Turn it off before the site is public</strong> &mdash;
                            with it on, any error page prints your environment, including the database password, to whoever triggered it.
                        </span>
                    </span>
                </label>
            </div>

            <div class="note note-info">
                <strong>Two secrets are generated for you when you continue.</strong>
                <ul>
                    <li><code>APP_KEY</code> &mdash; encrypts sessions and cookies. {{ $env->filled('APP_KEY') ? 'Already set; it will be left alone.' : 'Not set yet.' }}</li>
                    @if ($supportsEnvKey('JWT_SECRET'))
                        <li><code>JWT_SECRET</code> &mdash; signs the mobile app's sign-in tokens. {{ $env->filled('JWT_SECRET') ? 'Already set; it will be left alone.' : 'Not set yet.' }}</li>
                    @endif
                </ul>
                <p style="margin-top:6px">Neither is ever regenerated once set &mdash; changing <code>APP_KEY</code> on a running site signs everyone out and makes already-encrypted data unreadable.</p>
            </div>
        </div>

        <div class="panel-foot">
            <a class="btn btn-ghost" href="{{ url('/setup/requirements') }}">Back</a>
            <button class="btn btn-primary" type="submit">Save and continue</button>
        </div>
    </form>
@endsection
