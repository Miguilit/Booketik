@extends('setup.layout')

@section('title', 'Finished')
@section('heading', 'The application is installed')
@section('lede', 'The installer has locked itself. Below is what it configured, and the short list of things worth doing before you hand this site to anyone.')

@section('body')
    @php
        $debugOn      = filter_var($env->get('APP_DEBUG', 'false'), FILTER_VALIDATE_BOOL);
        $isProduction = $env->get('APP_ENV') === 'production';
        $appUrl       = (string) $env->get('APP_URL');
        $insecure     = str_starts_with($appUrl, 'http://') && ! str_contains($appUrl, 'localhost') && ! str_contains($appUrl, '127.0.0.1');
        $firebase     = $state->flag('firebase', 'skipped');
        $lockFile     = 'storage/app/'.ltrim((string) config('setup.lock_path'), '/');
    @endphp

    <div class="panel-body">
        <div class="note note-ok">
            <strong>Done.</strong>
            <p style="margin-top:6px">
                The database is built and seeded, and your admin account exists. Sign in with the email and password you chose a moment ago.
            </p>
        </div>

        <dl class="kv" style="margin-bottom:20px">
            <div><dt>Address</dt><dd>{{ $appUrl }}</dd></div>
            <div><dt>Environment</dt><dd>{{ $env->get('APP_ENV') }} &middot; debug {{ $debugOn ? 'on' : 'off' }}</dd></div>
            <div><dt>Database</dt><dd>{{ $env->get('DB_CONNECTION') }} &middot; {{ $env->get('DB_DATABASE') }}</dd></div>
            <div><dt>Admin sign-in</dt><dd>{{ $env->get('ADMIN_EMAIL') }}</dd></div>
            <div><dt>Firebase</dt><dd>{{ $firebase === 'skipped' ? 'not configured — mobile sign-in answers 503 until a key is added' : 'project '.$firebase }}</dd></div>
            <div><dt>Installer</dt><dd>locked by {{ $lockFile }}</dd></div>
        </dl>

        <h3 style="font-size:14px;margin:0 0 10px">Before this site is public</h3>

        @if ($debugOn && $isProduction)
            <div class="note note-bad">
                <strong>Turn off debug mode.</strong>
                <p style="margin-top:6px">
                    <code>APP_DEBUG=true</code> with <code>APP_ENV=production</code> means every error page prints your
                    environment &mdash; database password, API keys, Firebase path &mdash; to whoever triggered it.
                    Set <code>APP_DEBUG=false</code> in <code>.env</code> now.
                </p>
            </div>
        @elseif ($debugOn)
            <div class="note note-warn">
                <strong>Debug mode is on.</strong>
                <p style="margin-top:6px">Fine while you are still setting up. Set <code>APP_DEBUG=false</code> in <code>.env</code> before anyone else can reach this address.</p>
            </div>
        @endif

        @if ($insecure)
            <div class="note note-bad">
                <strong>This site is on plain HTTP.</strong>
                <p style="margin-top:6px">
                    Admin passwords and the mobile app's tokens travel in the clear. Enable the free certificate your host provides,
                    then change <code>APP_URL</code> to the <code>https://</code> address.
                </p>
            </div>
        @endif

        <div class="note note-info">
            <strong>The rest of the list.</strong>
            <ul>
                <li>Set <code>.env</code> to <code>0600</code> (or <code>0640</code>) so other accounts on this server cannot read it.</li>
                <li>Confirm your domain points at the <code>public/</code> folder, not at the project root. Visit <code>{{ rtrim($appUrl, '/') }}/.env</code> &mdash; you should get a 404, not a download.</li>
                <li>Clear <code>ADMIN_PASSWORD</code> from <code>.env</code> now that the account exists. Re-seeding never rotates an existing admin's password, so nothing breaks.</li>
                @if ($firebase === 'skipped')
                    <li>Add a Firebase service-account key when you are ready for the mobile app &mdash; set <code>FIREBASE_CREDENTIALS</code> in <code>.env</code>, or delete <code>{{ $lockFile }}</code> to run this wizard again.</li>
                @endif
                <li>Set up a cron entry for the scheduler if this project uses one: <code class="mono">* * * * * cd {{ base_path() }} &amp;&amp; php artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1</code></li>
                <li>To take <code>/setup</code> off the routing table entirely, add <code>SETUP_ENABLED=false</code> to <code>.env</code>.</li>
            </ul>
        </div>

        <div class="note note-warn">
            <strong>Running the installer again.</strong>
            <p style="margin-top:6px">
                Delete <code>{{ $lockFile }}</code> over FTP or SSH. That is the lock on purpose &mdash; needing filesystem
                access proves it is you rather than someone who guessed the URL.
            </p>
        </div>
    </div>

    <form method="post" action="{{ url('/setup/finish') }}">
        <input type="hidden" name="_setup_token" value="{{ $token }}">
        <div class="panel-foot">
            <span style="font-size:13px;color:var(--muted)">Finishing clears the installer's working files.</span>
            <button class="btn btn-primary" type="submit">Finish and go to the admin panel</button>
        </div>
    </form>
@endsection
