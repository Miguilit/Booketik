<x-guest-layout title="Two-step sign-in">
    <h4 class="mb-1">Two-step sign-in</h4>

    <form method="POST" action="{{ route('two-factor.login') }}" id="tfa-form">
        @csrf

        <div id="tfa-code">
            <p class="text-muted mb-4">Enter the six-digit code from your authenticator app.</p>
            <div class="form-group mb-4">
                <label class="form-label" for="code">Code</label>
                <input id="code" class="form-control input-lg cl-mono" type="text" inputmode="numeric" name="code" autofocus autocomplete="one-time-code">
            </div>
        </div>

        <div id="tfa-recovery" hidden>
            <p class="text-muted mb-4">Enter one of your emergency recovery codes.</p>
            <div class="form-group mb-4">
                <label class="form-label" for="recovery_code">Recovery code</label>
                <input id="recovery_code" class="form-control input-lg cl-mono" type="text" name="recovery_code" autocomplete="one-time-code">
            </div>
        </div>

        <button type="submit" class="btn btn-lg btn-primary btn-block w-100 mb-3">Sign in</button>
        <button type="button" class="btn btn-link p-0 small" id="tfa-switch">Use a recovery code</button>
    </form>

    <script>
        (function () {
            var useRecovery = false;
            var button = document.getElementById('tfa-switch');
            button.addEventListener('click', function () {
                useRecovery = !useRecovery;
                document.getElementById('tfa-code').hidden = useRecovery;
                document.getElementById('tfa-recovery').hidden = !useRecovery;
                // Only one of the two may be sent, or Fortify reads the empty one.
                document.getElementById('code').disabled = useRecovery;
                document.getElementById('recovery_code').disabled = !useRecovery;
                button.textContent = useRecovery ? 'Use an authenticator code' : 'Use a recovery code';
                document.getElementById(useRecovery ? 'recovery_code' : 'code').focus();
            });
            document.getElementById('recovery_code').disabled = true;
        })();
    </script>
</x-guest-layout>
