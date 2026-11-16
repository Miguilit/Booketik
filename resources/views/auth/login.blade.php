<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @include('layouts.admin-auth-head', ['title' => 'Sign in'])
</head>
@php
    /*
     * Test-account panel.
     *
     * Shown on a public demo (DEMO_MODE=on) — in any environment, production
     * included, because that is where a demo runs — and in local development.
     * Never on a normal live site: printing working admin credentials there
     * would hand the panel to anyone who loads the page.
     *
     * DEMO_MODE=on is what makes this safe: it turns the panel read-only, so
     * the published account can look at everything and change nothing.
     */
    $showTestAccount = config('eventgoo.demo_mode') || app()->environment('local');

    $testEmail = config('eventgoo.admin.email');
    $testPassword = config('eventgoo.admin.password');
@endphp
<body class="bg-light-gray" id="body">
<div class="container d-flex flex-column justify-content-between vh-100">
    <div class="row justify-content-center mt-5">
        <div class="col-xl-5 col-lg-6 col-md-10">
            <div class="card">
                <div class="card-header bg-primary">
                    <div class="app-brand">
                        <a href="{{route('login')}}">
                            <span class="brand-name">{{ \App\Support\SiteBrand::name() }}</span>
                        </a>
                    </div>
                </div>

                @if(session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <strong>{{ session('success') }}</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"
                                aria-label="Close"></button>
                    </div>
                @endif

                @if($errors->any())
                    <div class="alert alert-danger" role="alert">
                        <ul class="mb-0">
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <div class="card-body p-5">

                    <h4 class="mb-1">Sign in</h4>
                    <p class="text-muted mb-4">Welcome back. Enter your credentials to continue.</p>
                    <form method="POST" action="{{ route('login') }}">
                        @csrf
                        <div class="row">
                            <div class="form-group col-md-12 mb-4">
                                <input type="email" name="email" id="login_email"
                                       class="form-control input-lg" placeholder="Email"
                                       value="{{ old('email') }}" autocomplete="username" required>
                            </div>
                            <div class="form-group col-md-12 ">
                                <input type="password" name="password" id="login_password"
                                       class="form-control input-lg" placeholder="Password"
                                       autocomplete="current-password" required>
                            </div>
                            {{--
                                The site's reset flow is the only one (Fortify's
                                resetPasswords feature is off): the reset step of
                                the sign-in dialog, over the site's home page. It
                                resolves the account from `users`, so it works
                                for staff too. Named with the locale: this route
                                is outside the `{locale}` prefix.
                            --}}
                            <div class="col-md-12 mb-3 text-end">
                                <a href="{{ url('/'.app()->getLocale()) }}?auth=forgot"
                                   class="text-muted small">{{ __('Forgot your password?') }}</a>
                            </div>
                            <div class="col-md-12">
                                <button type="submit" class="btn btn-lg btn-primary btn-block mb-4">Sign in</button>
                            </div>
                        </div>
                    </form>

                    <p class="text-muted small mb-4">
                        {{ __('This sign-in is for the admin panel.') }}
                        <a href="{{ url('/'.app()->getLocale()) }}?auth=signin">{{ __('Attending or organizing events? Sign in on the site.') }}</a>
                    </p>

                    @if($showTestAccount)
                        <div class="cl-testaccount" id="cl-testaccount"
                             data-email="{{ $testEmail }}" data-password="{{ $testPassword }}">
                            <div class="cl-testaccount-head">
                                <span class="cl-testaccount-tag">Test account</span>
                                <button type="button" class="cl-testaccount-fill" data-fill>Fill form</button>
                            </div>

                            <button type="button" class="cl-testaccount-row" data-copy="email">
                                <span class="cl-testaccount-label">Email</span>
                                <span class="cl-testaccount-value">{{ $testEmail }}</span>
                                <span class="cl-testaccount-hint">Copy</span>
                            </button>

                            <button type="button" class="cl-testaccount-row" data-copy="password">
                                <span class="cl-testaccount-label">Password</span>
                                <span class="cl-testaccount-value">{{ $testPassword }}</span>
                                <span class="cl-testaccount-hint">Copy</span>
                            </button>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
    <div class="copyright pl-0">
        <p class="text-center">
            &copy; {{ date('Y') }} {{ \App\Support\SiteBrand::name() }}
        </p>
    </div>
</div>

@if($showTestAccount)
    <script>
        // Scoped to the login page and only emitted alongside the panel itself.
        (function () {
            var panel = document.getElementById('cl-testaccount');
            if (!panel) return;

            var creds = {
                email: panel.dataset.email,
                password: panel.dataset.password
            };

            function flash(button, text) {
                var hint = button.querySelector('.cl-testaccount-hint') || button;
                var original = hint.textContent;
                hint.textContent = text;
                button.classList.add('is-done');
                setTimeout(function () {
                    hint.textContent = original;
                    button.classList.remove('is-done');
                }, 1200);
            }

            // navigator.clipboard needs a secure context. localhost counts, but a
            // plain-http dev domain does not — hence the textarea fallback.
            function copy(text) {
                if (navigator.clipboard && window.isSecureContext) {
                    return navigator.clipboard.writeText(text);
                }
                return new Promise(function (resolve, reject) {
                    var scratch = document.createElement('textarea');
                    scratch.value = text;
                    scratch.setAttribute('readonly', '');
                    scratch.style.position = 'fixed';
                    scratch.style.opacity = '0';
                    document.body.appendChild(scratch);
                    scratch.select();
                    try {
                        document.execCommand('copy') ? resolve() : reject();
                    } catch (e) {
                        reject(e);
                    } finally {
                        document.body.removeChild(scratch);
                    }
                });
            }

            panel.querySelectorAll('[data-copy]').forEach(function (button) {
                button.addEventListener('click', function () {
                    var value = creds[button.dataset.copy];

                    // Copying is the stated action, but filling the matching field
                    // too means one click gets you logged in either way.
                    var target = document.getElementById(
                        button.dataset.copy === 'email' ? 'login_email' : 'login_password'
                    );
                    if (target) target.value = value;

                    copy(value).then(
                        function () { flash(button, 'Copied'); },
                        function () { flash(button, 'Filled'); }
                    );
                });
            });

            panel.querySelector('[data-fill]').addEventListener('click', function () {
                document.getElementById('login_email').value = creds.email;
                document.getElementById('login_password').value = creds.password;
                this.textContent = 'Filled';
                var self = this;
                setTimeout(function () { self.textContent = 'Fill form'; }, 1200);
                document.getElementById('login_password').focus();
            });
        })();
    </script>
@endif
@include('partials.demo-frame-notice')
</body>
</html>
