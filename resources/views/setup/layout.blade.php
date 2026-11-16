{{--
    The installer's shell.

    Everything is inline: no Vite, no Tailwind, no CDN. This page has to render
    on a host where `npm run build` has never run and where outbound HTTP may be
    blocked, which rules out every asset pipeline the rest of the app uses. It
    is also the one page in the project that must render before APP_KEY exists,
    so nothing here may touch a session, a cookie or the database.
--}}
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>@yield('title', 'Setup') &middot; {{ $env->get('APP_NAME') ?: 'Installer' }}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        :root {
            --bg: #f4f5f7; --card: #ffffff; --line: #e3e6eb; --line-soft: #eef0f3;
            --ink: #1b1f24; --muted: #667085; --faint: #98a2b3;
            --accent: #2f6feb; --accent-ink: #ffffff; --accent-soft: #eaf1fe;
            --ok: #067a54; --ok-soft: #e7f6f0;
            --warn: #a05a00; --warn-soft: #fdf3e3;
            --bad: #c62d3c; --bad-soft: #fdecee;
            --radius: 10px;
        }
        html { -webkit-text-size-adjust: 100%; }
        body {
            margin: 0; background: var(--bg); color: var(--ink);
            font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        code, pre, .mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
        code { background: var(--line-soft); border-radius: 4px; padding: 1px 5px; font-size: .86em; }
        a { color: var(--accent); }

        .wrap { max-width: 1060px; margin: 0 auto; padding: 32px 20px 64px; }
        .masthead { display: flex; align-items: baseline; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
        .masthead h1 { font-size: 19px; margin: 0; letter-spacing: -.01em; }
        .masthead .sub { color: var(--muted); font-size: 13px; }

        .grid { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 22px; align-items: start; }
        @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }

        /* Step rail */
        .rail { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 8px; position: sticky; top: 20px; }
        @media (max-width: 820px) { .rail { position: static; display: flex; overflow-x: auto; gap: 4px; } }
        .rail-item { display: flex; gap: 10px; align-items: flex-start; padding: 9px 10px; border-radius: 7px; text-decoration: none; color: var(--ink); white-space: nowrap; }
        .rail-item .n { flex: none; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--line); color: var(--faint);
                        font-size: 11px; line-height: 18px; text-align: center; font-weight: 600; }
        .rail-item .t { font-size: 13.5px; font-weight: 500; }
        .rail-item .b { font-size: 11.5px; color: var(--faint); }
        @media (max-width: 820px) { .rail-item .b { display: none; } }
        .rail-item.is-current { background: var(--accent-soft); }
        .rail-item.is-current .n { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
        .rail-item.is-current .t { color: var(--accent); }
        .rail-item.is-done .n { background: var(--ok); border-color: var(--ok); color: #fff; }
        .rail-item.is-locked { opacity: .45; pointer-events: none; }

        /* Panel */
        .panel { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
        .panel-head { padding: 20px 24px 16px; border-bottom: 1px solid var(--line-soft); }
        .panel-head h2 { margin: 0 0 5px; font-size: 17px; letter-spacing: -.01em; }
        .panel-head p { margin: 0; color: var(--muted); font-size: 13.5px; max-width: 62ch; }
        .panel-body { padding: 22px 24px; }
        .panel-foot { padding: 16px 24px; border-top: 1px solid var(--line-soft); background: #fafbfc;
                      display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }

        /* Notices */
        .note { border-radius: 8px; padding: 12px 14px; font-size: 13.5px; margin: 0 0 16px; border: 1px solid; }
        .note :last-child { margin-bottom: 0; }
        .note p { margin: 0 0 6px; }
        .note-info { background: var(--accent-soft); border-color: #cfe0fd; color: #1c4a9e; }
        .note-ok   { background: var(--ok-soft); border-color: #c6e9dc; color: #05563b; }
        .note-warn { background: var(--warn-soft); border-color: #f3ddb4; color: #7a4400; }
        .note-bad  { background: var(--bad-soft); border-color: #f6c9ce; color: #96202d; }
        .note strong { font-weight: 600; }
        .note ul { margin: 6px 0 0; padding-left: 18px; }

        /* Forms */
        .field { margin-bottom: 16px; }
        .field > label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; }
        .field .help { font-size: 12.5px; color: var(--muted); margin: 5px 0 0; }
        input[type=text], input[type=email], input[type=password], input[type=url], input[type=number], select, textarea {
            width: 100%; padding: 9px 11px; border: 1px solid #d3d8df; border-radius: 7px; font: inherit;
            font-size: 14px; background: #fff; color: var(--ink);
        }
        input:focus, select:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: -1px; border-color: var(--accent); }
        textarea { min-height: 150px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
        .check { display: flex; gap: 9px; align-items: flex-start; font-size: 13.5px; }
        .check input { margin: 3px 0 0; }

        /* Buttons */
        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 7px;
               border: 1px solid var(--line); background: #fff; color: var(--ink); font: inherit; font-size: 14px;
               font-weight: 500; cursor: pointer; text-decoration: none; }
        .btn:hover { background: #f7f8fa; }
        .btn-primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
        .btn-primary:hover { background: #2560cf; }
        .btn[disabled] { opacity: .55; cursor: not-allowed; }
        .btn-ghost { border-color: transparent; background: transparent; color: var(--muted); }
        .btn-ghost:hover { background: var(--line-soft); }

        /* Check tables */
        .checks { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .checks caption { text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;
                          letter-spacing: .05em; color: var(--faint); padding: 16px 0 7px; }
        .checks tr { border-top: 1px solid var(--line-soft); }
        .checks tr:first-child { border-top: 0; }
        .checks td { padding: 7px 8px 7px 0; vertical-align: top; }
        .checks td.name { font-weight: 500; width: 44%; }
        .checks td.val { color: var(--muted); text-align: right; white-space: nowrap; }
        .checks .hint { display: block; color: var(--faint); font-size: 12px; font-weight: 400; margin-top: 2px; max-width: 60ch; }
        .pill { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
        .pill-ok { background: var(--ok-soft); color: var(--ok); }
        .pill-warn { background: var(--warn-soft); color: var(--warn); }
        .pill-bad { background: var(--bad-soft); color: var(--bad); }

        details { border: 1px solid var(--line); border-radius: 8px; padding: 0; margin-top: 18px; }
        details summary { cursor: pointer; padding: 11px 14px; font-size: 13.5px; font-weight: 500; }
        details[open] summary { border-bottom: 1px solid var(--line-soft); }
        details .inner { padding: 14px; }
        dl.kv { margin: 0; font-size: 13px; }
        dl.kv div { display: grid; grid-template-columns: 190px minmax(0,1fr); gap: 10px; padding: 5px 0; border-top: 1px solid var(--line-soft); }
        dl.kv div:first-child { border-top: 0; }
        dl.kv dt { color: var(--muted); }
        dl.kv dd { margin: 0; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }

        pre.out { background: #0f1720; color: #d6dde6; padding: 12px 14px; border-radius: 7px; font-size: 12px;
                  overflow-x: auto; margin: 10px 0 0; white-space: pre-wrap; word-break: break-word; max-height: 260px; }

        .task { display: flex; gap: 11px; align-items: flex-start; padding: 11px 0; border-top: 1px solid var(--line-soft); }
        .task:first-child { border-top: 0; }
        .task .dot { flex: none; width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--line); margin-top: 2px; }
        .task.running .dot { border-color: var(--accent); border-top-color: transparent; animation: spin .7s linear infinite; }
        .task.done .dot { background: var(--ok); border-color: var(--ok); }
        .task.warn .dot { background: var(--warn); border-color: var(--warn); }
        .task.failed .dot { background: var(--bad); border-color: var(--bad); }
        .task .label { font-size: 14px; font-weight: 500; }
        .task .msg { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .foot-note { text-align: center; color: var(--faint); font-size: 12px; margin-top: 22px; }
        .hidden { display: none !important; }
    </style>
</head>
<body>
<div class="wrap">
    <div class="masthead">
        <h1>{{ $env->get('APP_NAME') ?: 'Application' }} setup</h1>
        <span class="sub">Step {{ $currentIndex + 1 }} of {{ count($steps) }}</span>
    </div>

    <div class="grid">
        <nav class="rail" aria-label="Setup steps">
            @foreach ($steps as $i => $s)
                @php
                    $isDone = in_array($s['key'], $completed, true);
                    $classes = $s['key'] === $currentStep ? 'is-current' : ($isDone ? 'is-done' : ($i > $currentIndex ? 'is-locked' : ''));
                @endphp
                <a class="rail-item {{ $classes }}"
                   href="{{ $i <= $currentIndex || $isDone ? url('/setup/'.$s['key']) : '#' }}"
                   @if ($s['key'] === $currentStep) aria-current="step" @endif>
                    <span class="n">{{ $isDone && $s['key'] !== $currentStep ? '✓' : $i + 1 }}</span>
                    <span>
                        <span class="t">{{ $s['label'] }}</span><br>
                        <span class="b">{{ $s['blurb'] }}</span>
                    </span>
                </a>
            @endforeach
        </nav>

        <main class="panel">
            <div class="panel-head">
                <h2>@yield('heading')</h2>
                <p>@yield('lede')</p>
            </div>

            @if (! empty($baseWarning))
                <div style="padding: 18px 24px 0;">
                    <div class="note note-bad">
                        <strong>Your document root is wrong.</strong>
                        <p style="margin-top:6px">{{ $baseWarning }}</p>
                    </div>
                </div>
            @endif

            @if (! empty($errors))
                <div style="padding: 18px 24px 0;">
                    <div class="note note-bad">
                        <strong>{{ count($errors) === 1 ? 'That did not work' : 'Some things need fixing' }}</strong>
                        <ul>
                            @foreach ($errors as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            @endif

            @yield('body')
        </main>
    </div>

    <p class="foot-note">
        This installer is reachable by anyone who knows the URL. It locks itself the moment it finishes.
    </p>
</div>

<script>
    // Shared by the live-check buttons and the install runner. Kept tiny and
    // dependency-free — there is no build step on the machine this runs on.
    window.SETUP = {
        token: @json($token),
        base: @json(url('/setup')),
        post: function (path, body) {
            var isForm = body instanceof FormData;
            if (isForm) { body.append('_setup_token', window.SETUP.token); }
            else { body = Object.assign({ _setup_token: window.SETUP.token }, body || {}); }
            return fetch(window.SETUP.base + path, {
                method: 'POST',
                headers: Object.assign({ 'Accept': 'application/json' }, isForm ? {} : { 'Content-Type': 'application/json' }),
                body: isForm ? body : JSON.stringify(body)
            }).then(function (r) { return r.json().catch(function () {
                return { ok: false, message: 'The server returned ' + r.status + ' instead of a result.', detail: '' };
            }); });
        }
    };
</script>
@stack('scripts')
</body>
</html>
