@extends('admin.admin_master')

@section('admin')
    <div class="row">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header">{{ __('dashboard.update_social_login') }}</div>
                <div class="card-body">
                    <p class="text-muted">
                        {!! __('"Continue with Google / Facebook" on the website\'s sign-in and register pages. A provider\'s button appears only when it is switched on <strong>and</strong> has both a client id and a secret. Empty fields fall back to the server environment (:env). Secrets are stored encrypted and never shown again; leave a secret blank to keep the current one.', ['env' => '<code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, <code>FACEBOOK_CLIENT_ID</code>, <code>FACEBOOK_CLIENT_SECRET</code>']) !!}
                    </p>

                    <form action="{{ route('update.env.social-login', ['locale' => app()->getLocale()]) }}" method="POST">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])

                        @foreach ($providers as $key => $p)
                            @if (! $loop->first)<hr>@endif
                            <h5 class="d-flex align-items-center gap-2">
                                {{ __('dashboard.'.$key.'_settings') }}
                                @if ($p['configured'])
                                    <span class="badge bg-success">{{ __('Credentials set') }}</span>
                                @else
                                    <span class="badge bg-secondary">{{ __('No credentials') }}</span>
                                @endif
                            </h5>

                            <div class="form-group mb-3">
                                <div class="form-check form-switch">
                                    <input type="hidden" name="is_{{ $key }}_login_enabled" value="0">
                                    <input class="form-check-input" type="checkbox" role="switch" value="1"
                                           id="is_{{ $key }}_login_enabled" name="is_{{ $key }}_login_enabled" @checked($p['enabled'])>
                                    <label class="form-check-label" for="is_{{ $key }}_login_enabled">{{ __('dashboard.'.$key.'_login_enable') }}</label>
                                </div>
                            </div>

                            <div class="form-group mb-3">
                                <label for="{{ $key }}_client_id">{{ __('dashboard.'.$key.'_client_id') }}</label>
                                <input type="text" class="form-control" id="{{ $key }}_client_id" name="{{ $key }}_client_id"
                                       value="{{ old($key.'_client_id', $p['client_id']) }}" autocomplete="off"
                                       placeholder="{{ $p['uses_env_id'] ? __('Using the value from the server environment') : '' }}">
                                @error($key.'_client_id')<div class="text-danger small">{{ $message }}</div>@enderror
                            </div>

                            <div class="form-group mb-3">
                                <label for="{{ $key }}_client_secret">{{ __('dashboard.'.$key.'_client_secret') }}</label>
                                <input type="password" class="form-control" id="{{ $key }}_client_secret" name="{{ $key }}_client_secret"
                                       value="" autocomplete="new-password"
                                       placeholder="{{ $p['has_db_secret'] ? '•••••••• '.__('(saved — leave blank to keep)') : ($p['uses_env_secret'] ? __('Using the value from the server environment') : __('Not set')) }}">
                                @if ($p['has_db_secret'])
                                    <div class="form-check mt-1">
                                        <input class="form-check-input" type="checkbox" value="1" id="clear_{{ $key }}_client_secret" name="clear_{{ $key }}_client_secret">
                                        <label class="form-check-label small" for="clear_{{ $key }}_client_secret">{{ __('Remove the saved secret') }}</label>
                                    </div>
                                @endif
                                @error($key.'_client_secret')<div class="text-danger small">{{ $message }}</div>@enderror
                            </div>

                            <div class="form-group mb-3">
                                <label for="{{ $key }}_callback">{{ __('dashboard.'.$key.'_redirect_url') }}</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="{{ $key }}_callback" value="{{ $p['callback'] }}" readonly data-lock-exempt>
                                    <button type="button" class="btn btn-outline-secondary" data-lock-exempt
                                            onclick="navigator.clipboard && navigator.clipboard.writeText(document.getElementById('{{ $key }}_callback').value); this.textContent=this.dataset.copied;" data-copied="{{ __('Copied') }}">{{ __('Copy') }}</button>
                                </div>
                                <small class="text-muted">
                                    @if ($key === 'google')
                                        {{ __('Add this under "Authorized redirect URIs" of the OAuth client in Google Cloud Console.') }}
                                    @else
                                        {{ __('Add this under Facebook Login → Settings → "Valid OAuth Redirect URIs".') }}
                                    @endif
                                </small>
                            </div>
                        @endforeach
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
