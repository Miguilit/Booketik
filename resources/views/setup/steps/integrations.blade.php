@extends('setup.layout')

@section('title', 'Integrations')
@section('heading', 'Optional services')
@section('lede', 'Every one of these can be left blank now and filled in later from the admin panel or .env. Nothing here blocks the install, and each service that is left unconfigured simply reports itself as unavailable rather than failing requests.')

@section('body')
    <form method="post" action="{{ url('/setup/integrations') }}">
        <input type="hidden" name="_setup_token" value="{{ $token }}">

        <div class="panel-body">
            @foreach (config('setup.integrations', []) as $group)
                <details @if ($loop->first) open @endif style="margin-top: {{ $loop->first ? '0' : '12px' }}">
                    <summary>
                        {{ $group['label'] }}
                        @php
                            $configured = collect($group['fields'])->contains(fn ($f) => $env->filled($f['env']));
                        @endphp
                        <span class="pill {{ $configured ? 'pill-ok' : 'pill-warn' }}" style="margin-left:8px">{{ $configured ? 'Configured' : 'Off' }}</span>
                    </summary>
                    <div class="inner">
                        <p class="help" style="margin:0 0 14px">{{ $group['hint'] }}</p>

                        @foreach ($group['fields'] as $field)
                            @php
                                $name = strtolower($field['env']);
                                $secret = (bool) ($field['secret'] ?? false);
                                $value = $old[$name] ?? ($env->get($field['env']) ?: ($field['default'] ?? ''));
                            @endphp
                            <div class="field">
                                <label for="{{ $name }}">{{ $field['label'] }} <span style="font-weight:400;color:var(--faint)">&mdash; {{ $field['env'] }}</span></label>
                                <input type="{{ $secret ? 'password' : 'text' }}"
                                       id="{{ $name }}" name="{{ $name }}"
                                       value="{{ $secret ? '' : $value }}"
                                       placeholder="{{ $field['placeholder'] ?? ($secret && $env->filled($field['env']) ? 'a value is already saved — typing here replaces it' : '') }}"
                                       autocomplete="off">
                            </div>
                        @endforeach
                    </div>
                </details>
            @endforeach

            <div class="note note-info" style="margin-top:20px">
                <strong>A blank field clears that setting.</strong>
                <p style="margin-top:6px">
                    Values you can see are pre-filled from <code>.env</code>. Passwords and API keys are not shown back to you,
                    so leaving one of those empty keeps whatever is already saved &mdash; the placeholder tells you when that is the case.
                </p>
            </div>
        </div>

        <div class="panel-foot">
            <a class="btn btn-ghost" href="{{ url('/setup/'.($steps[$currentIndex - 1]['key'] ?? 'admin')) }}">Back</a>
            <button class="btn btn-primary" type="submit">Continue</button>
        </div>
    </form>
@endsection
