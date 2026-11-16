@extends('setup.layout')

@section('title', 'Firebase')
@section('heading', 'Firebase service account')
@section('lede', 'Firebase verifies every mobile sign-in and delivers Android push. It is optional — skip it and the app installs and runs, answering 503 on mobile sign-in until you come back and add the key.')

@section('body')
    @php
        $envKey  = config('setup.firebase.env_key');
        $current = $env->get($envKey);
        $destination = config('setup.firebase.destination');
        $currentExists = $current && is_file(base_path($current));
    @endphp

    <form method="post" action="{{ url('/setup/firebase') }}" enctype="multipart/form-data" id="fb-form">
        <input type="hidden" name="_setup_token" value="{{ $token }}">

        <div class="panel-body">
            @if ($currentExists)
                <div class="note note-ok">
                    <strong>A key is already in place.</strong>
                    <p style="margin-top:6px">
                        <code>{{ $envKey }}</code> points at <code>{{ $current }}</code>, and that file exists.
                        Upload a new one below to replace it, or continue to keep it.
                    </p>
                </div>
            @elseif ($current)
                <div class="note note-bad">
                    <strong>The configured key is missing.</strong>
                    <p style="margin-top:6px">
                        <code>{{ $envKey }}</code> points at <code>{{ $current }}</code>, but there is no file there.
                        Every Firebase call will throw until you upload the key or skip this step, which clears the setting.
                    </p>
                </div>
            @endif

            <details style="margin-top:0;margin-bottom:18px">
                <summary>Where do I get this file?</summary>
                <div class="inner" style="font-size:13.5px;color:var(--muted)">
                    <ol style="margin:0;padding-left:20px">
                        <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener">Firebase console</a> and select your project.</li>
                        <li>Gear icon &rarr; <strong>Project settings</strong> &rarr; <strong>Service accounts</strong>.</li>
                        <li>Press <strong>Generate new private key</strong>, then confirm. A <code>.json</code> file downloads.</li>
                        <li>Upload that file here.</li>
                    </ol>
                    <p style="margin:12px 0 0">
                        It must be the <em>service account</em> key. <code>google-services.json</code> (the one that goes in the
                        Android app) and the web config snippet are different files and will be rejected.
                    </p>
                </div>
            </details>

            <div class="field">
                <label for="credentials_file">Service account JSON file</label>
                <input type="file" id="credentials_file" name="credentials_file" accept=".json,application/json">
                <p class="help">Saved to <code>{{ $destination }}</code> with 0600 permissions, and <code>{{ $envKey }}</code> is pointed at it.</p>
            </div>

            <details id="paste-box">
                <summary>Or paste the JSON instead</summary>
                <div class="inner">
                    <p class="help" style="margin:0 0 8px">Useful when your browser cannot upload — some control-panel file managers block it.</p>
                    <textarea id="credentials_json" name="credentials_json" placeholder='{&#10;  "type": "service_account",&#10;  "project_id": "…",&#10;  "private_key": "-----BEGIN PRIVATE KEY-----…",&#10;  "client_email": "…@….iam.gserviceaccount.com"&#10;}'></textarea>
                </div>
            </details>

            <div style="display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap">
                <button class="btn" type="button" id="fb-test">Test this key against Google</button>
                <span id="fb-spinner" class="hidden" style="font-size:13px;color:var(--muted)">Asking Google for a token…</span>
            </div>
            <div id="fb-result" style="margin-top:14px"></div>

            <div class="note note-info" style="margin-top:18px">
                <strong>What the test actually does.</strong>
                <p style="margin-top:6px">
                    It signs a request with the private key and exchanges it for an access token at Google's token endpoint.
                    Passing means the key is genuine, has not been revoked, and works <em>from this server</em> — which also rules out
                    a blocked outbound connection and a server clock too far out for Google to accept. Checking that the file
                    is valid JSON would prove none of that.
                </p>
            </div>

            <div class="note note-warn">
                <strong>Treat this file as a password.</strong>
                <p style="margin-top:6px">
                    It grants full control of your Firebase project. It is stored under <code>storage/</code>, which is not
                    web-reachable when your domain points at <code>public/</code> as it should. Never commit it to git.
                </p>
            </div>
        </div>

        <div class="panel-foot">
            <a class="btn btn-ghost" href="{{ url('/setup/admin') }}">Back</a>
            <span style="display:flex;gap:10px">
                <button class="btn" type="submit" name="action" value="skip">Skip for now</button>
                <button class="btn btn-primary" type="submit" name="action" value="save">Save and continue</button>
            </span>
        </div>
    </form>
@endsection

@push('scripts')
<script>
(function () {
    var file    = document.getElementById('credentials_file');
    var pasted  = document.getElementById('credentials_json');
    var result  = document.getElementById('fb-result');
    var testBtn = document.getElementById('fb-test');
    var spinner = document.getElementById('fb-spinner');

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
        });
    }

    testBtn.addEventListener('click', function () {
        var body = new FormData();
        if (file.files && file.files[0]) { body.append('credentials_file', file.files[0]); }
        else if (pasted.value.trim()) { body.append('credentials_json', pasted.value); }
        else {
            result.innerHTML = '<div class="note note-warn"><strong>Choose a file or paste the JSON first.</strong></div>';
            return;
        }

        testBtn.disabled = true;
        spinner.classList.remove('hidden');
        result.innerHTML = '';

        window.SETUP.post('/probe/firebase', body)
            .then(function (res) {
                result.innerHTML = '<div class="note ' + (res.ok ? 'note-ok' : 'note-bad') + '">' +
                    '<strong>' + esc(res.message) + '</strong>' +
                    (res.detail ? '<p style="margin-top:6px">' + esc(res.detail) + '</p>' : '') + '</div>';
            })
            .catch(function () {
                result.innerHTML = '<div class="note note-bad"><strong>The test could not be run.</strong>' +
                    '<p style="margin-top:6px">The request never reached the server. Reload the page and try again.</p></div>';
            })
            .then(function () { testBtn.disabled = false; spinner.classList.add('hidden'); });
    });

    // Open the paste box automatically if someone starts typing in it via keyboard nav.
    pasted.addEventListener('focus', function () { document.getElementById('paste-box').open = true; });
})();
</script>
@endpush
