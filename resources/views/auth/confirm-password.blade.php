<x-guest-layout title="Confirm your password">
    <h4 class="mb-1">Confirm your password</h4>
    <p class="text-muted mb-4">This is a protected area. Enter your password again to continue.</p>

    <form method="POST" action="{{ route('password.confirm') }}">
        @csrf
        <div class="form-group mb-4">
            <label class="form-label" for="password">Password</label>
            <input id="password" class="form-control input-lg" type="password" name="password" required autocomplete="current-password" autofocus>
        </div>
        <button type="submit" class="btn btn-lg btn-primary btn-block w-100">Confirm</button>
    </form>
</x-guest-layout>
