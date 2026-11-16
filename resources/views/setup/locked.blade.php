{{--
    Shown by SetupGuard whenever the installer is not allowed to run: it has
    finished, or the app already has an APP_KEY. Standalone
    for the same reason as the wizard itself — this page has to render on an app
    whose configuration might be broken.
--}}
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Already installed</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #f4f5f7; color: #1b1f24;
               font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
        .wrap { max-width: 620px; margin: 0 auto; padding: 72px 20px; }
        .card { background: #fff; border: 1px solid #e3e6eb; border-radius: 10px; overflow: hidden; }
        .card-body { padding: 28px; }
        h1 { font-size: 19px; margin: 0 0 10px; }
        p { margin: 0 0 14px; color: #3d444d; }
        code { background: #eef0f3; border-radius: 4px; padding: 2px 6px; font-size: .86em;
               font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        ol { padding-left: 20px; color: #3d444d; } li { margin: 8px 0; }
        .foot { padding: 16px 28px; border-top: 1px solid #eef0f3; background: #fafbfc; }
        .btn { display: inline-flex; padding: 9px 16px; border-radius: 7px; background: #2f6feb;
               color: #fff; text-decoration: none; font-size: 14px; font-weight: 500; }
        .muted { color: #667085; font-size: 13px; }
    </style>
</head>
<body>
<div class="wrap">
    <div class="card">
        <div class="card-body">
            <h1>This application is already installed</h1>

            <p>
                The installer only runs on an app that has no application key yet, or to finish an install this browser
                started. This app already has an <code>APP_KEY</code>, so the installer is closed and has locked itself
                (<code>{{ $lockPath }}</code>). It can rewrite <code>.env</code> and create an administrator, so it does not
                reopen on its own &mdash; not even when the database is empty or unreachable.
            </p>

            <p><strong>To run it again on purpose:</strong></p>
            <ol>
                <li>Add <code>SETUP_FORCE=true</code> to your <code>.env</code> file and run the wizard.</li>
                <li>Remove that line again as soon as it has finished.</li>
            </ol>

            <p class="muted">
                That needs access to the server's files, which is the point: knowing this URL is not enough to reopen
                the installer.
            </p>
        </div>
        <div class="foot">
            <a class="btn" href="{{ $finishUrl }}">Go to the admin panel</a>
        </div>
    </div>
</div>
</body>
</html>
