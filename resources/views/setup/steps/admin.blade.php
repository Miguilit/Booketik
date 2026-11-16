@extends('setup.layout')

@section('title', 'Admin account')
@section('heading', 'The first admin account')
@section('lede', 'This account has full read and write access to every member, the whole catalogue and everything the app sells. It is created when the database is seeded in a moment.')

@section('body')
    @php
        $adminName  = $old['admin_name']  ?? ($env->get('ADMIN_NAME') ?: '');
        $adminEmail = $old['admin_email'] ?? ($env->get('ADMIN_EMAIL') ?: '');
    @endphp

    <form method="post" action="{{ url('/setup/admin') }}" id="admin-form">
        <input type="hidden" name="_setup_token" value="{{ $token }}">

        <div class="panel-body">
            <div class="row">
                <div class="field">
                    <label for="admin_name">Your name</label>
                    <input type="text" id="admin_name" name="admin_name" value="{{ $adminName }}" required maxlength="100" autofocus>
                </div>
                <div class="field">
                    <label for="admin_email">Email address</label>
                    <input type="email" id="admin_email" name="admin_email" value="{{ $adminEmail }}" required>
                    <p class="help">This is the username you sign in with.</p>
                </div>
            </div>

            <div class="row">
                <div class="field">
                    <label for="admin_password">Password</label>
                    <input type="password" id="admin_password" name="admin_password" required minlength="12" autocomplete="new-password">
                    <p class="help" id="pw-meter">At least 12 characters.</p>
                </div>
                <div class="field">
                    <label for="admin_password_confirmation">Repeat the password</label>
                    <input type="password" id="admin_password_confirmation" name="admin_password_confirmation" required minlength="12" autocomplete="new-password">
                    <p class="help" id="pw-match">&nbsp;</p>
                </div>
            </div>

            <button class="btn" type="button" id="pw-generate">Generate a strong password</button>
            <div id="pw-generated" class="note note-ok hidden" style="margin-top:14px"></div>

            <div class="note note-warn" style="margin-top:18px">
                <strong>Twelve characters is a hard floor, not a suggestion.</strong>
                <p style="margin-top:6px">
                    The seeder that creates this account refuses anything shorter, or any of the obvious words, and it refuses
                    <em>silently</em> — you would finish the install and simply have no way to sign in. Better to be stopped here.
                </p>
            </div>

            <div class="note note-info">
                <strong>Where this is stored.</strong>
                <p style="margin-top:6px">
                    The password goes into <code>.env</code> as <code>ADMIN_PASSWORD</code>, which is how the seeder reads it, and
                    into the database as a hash. Once you have signed in, you can clear <code>ADMIN_PASSWORD</code> from
                    <code>.env</code> — the account keeps working, and re-seeding never rotates an existing admin's password.
                </p>
            </div>
        </div>

        <div class="panel-foot">
            <a class="btn btn-ghost" href="{{ url('/setup/database') }}">Back</a>
            <button class="btn btn-primary" type="submit">Save and continue</button>
        </div>
    </form>
@endsection

@push('scripts')
<script>
(function () {
    var pw      = document.getElementById('admin_password');
    var confirm = document.getElementById('admin_password_confirmation');
    var meter   = document.getElementById('pw-meter');
    var match   = document.getElementById('pw-match');
    var out     = document.getElementById('pw-generated');
    var weak    = ['password', 'secret', 'admin', 'changeme', '12345678', 'password123', 'administrator'];

    function grade() {
        var v = pw.value;
        if (!v) { meter.textContent = 'At least 12 characters.'; meter.style.color = ''; return; }
        if (weak.indexOf(v.toLowerCase()) !== -1) {
            meter.textContent = 'That is one of the passwords the seeder rejects outright.';
            meter.style.color = 'var(--bad)'; return;
        }
        if (v.length < 12) {
            meter.textContent = (12 - v.length) + ' more character' + (12 - v.length === 1 ? '' : 's') + ' needed.';
            meter.style.color = 'var(--bad)'; return;
        }
        var variety = (/[a-z]/.test(v) ? 1 : 0) + (/[A-Z]/.test(v) ? 1 : 0) + (/[0-9]/.test(v) ? 1 : 0) + (/[^A-Za-z0-9]/.test(v) ? 1 : 0);
        if (v.length >= 20 || variety >= 3) { meter.textContent = 'Strong.'; meter.style.color = 'var(--ok)'; }
        else { meter.textContent = 'Accepted, but mixing in numbers or symbols would be better.'; meter.style.color = 'var(--warn)'; }
    }

    function compare() {
        if (!confirm.value) { match.innerHTML = '&nbsp;'; return; }
        var same = confirm.value === pw.value;
        match.textContent = same ? 'The passwords match.' : 'The passwords do not match.';
        match.style.color = same ? 'var(--ok)' : 'var(--bad)';
    }

    pw.addEventListener('input', function () { grade(); compare(); });
    confirm.addEventListener('input', compare);

    document.getElementById('pw-generate').addEventListener('click', function () {
        // crypto.getRandomValues, not Math.random — this is the password to an
        // account that can read every member's data.
        var alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%^*-_=+';
        var bytes = new Uint32Array(20);
        window.crypto.getRandomValues(bytes);
        var generated = Array.prototype.map.call(bytes, function (n) { return alphabet[n % alphabet.length]; }).join('');

        pw.value = confirm.value = generated;
        pw.type = confirm.type = 'text';
        grade(); compare();

        out.classList.remove('hidden');
        out.innerHTML = '<strong>Copy this somewhere safe now.</strong>' +
            '<p style="margin-top:6px" class="mono" style="word-break:break-all">' + generated + '</p>' +
            '<p style="margin-top:6px">It is shown in full because you will not see it again after this page.</p>';
    });
})();
</script>
@endpush
