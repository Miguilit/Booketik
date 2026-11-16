@extends('setup.layout')

@section('title', 'Server check')
@section('heading', 'Can this server run the application?')
@section('lede', 'Everything below is read from PHP as it is configured for this domain right now. Required items must pass before the install can start; recommended ones will not stop you, but each is something that bites later.')

@section('body')
    @php
        $groups = $requirements->all();
        $failures = $requirements->failures();
    @endphp

    <div class="panel-body">
        @if ($failures === [])
            <div class="note note-ok">
                <strong>This server is ready.</strong>
                <p style="margin-top:6px">Every required check passed. Anything marked below as recommended is worth fixing, but will not block the install.</p>
            </div>
        @else
            <div class="note note-bad">
                <strong>{{ count($failures) }} {{ \Illuminate\Support\Str::plural('thing', count($failures)) }} to fix before you can continue.</strong>
                <p style="margin-top:6px">Fix them on the server, then press <em>Re-check</em>. Each one below shows the exact change needed.</p>
            </div>
        @endif

        @foreach ($groups as $group)
            <table class="checks">
                <caption>{{ $group['label'] }}</caption>
                <tbody>
                @foreach ($group['checks'] as $check)
                    @php
                        $required = $check['level'] === \App\Support\Setup\Requirements::REQUIRED;
                        $pill = $check['passed'] ? 'pill-ok' : ($required ? 'pill-bad' : 'pill-warn');
                        $word = $check['passed'] ? 'OK' : ($required ? 'Required' : 'Recommended');
                    @endphp
                    <tr>
                        <td class="name">
                            {{ $check['name'] }}
                            @unless ($check['passed'])
                                <span class="hint">{{ $check['hint'] }}</span>
                            @endunless
                        </td>
                        <td class="val">{{ $check['current'] }}</td>
                        <td class="val" style="width:1%"><span class="pill {{ $pill }}">{{ $word }}</span></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        @endforeach

        <details>
            <summary>PHP information</summary>
            <div class="inner">
                <p style="margin:0 0 12px;color:var(--muted);font-size:13px">
                    The same values <code>phpinfo()</code> would show, minus the parts that leak paths and credentials.
                    Send this to your host if you need them to change something.
                </p>
                <dl class="kv">
                    @foreach ($requirements->phpDetails() as $label => $value)
                        <div><dt>{{ $label }}</dt><dd>{{ $value }}</dd></div>
                    @endforeach
                </dl>
            </div>
        </details>
    </div>

    <form method="post" action="{{ url('/setup/requirements') }}">
        <input type="hidden" name="_setup_token" value="{{ $token }}">
        <div class="panel-foot">
            <a class="btn btn-ghost" href="{{ url('/setup/requirements') }}">Re-check</a>
            <button class="btn btn-primary" type="submit" @disabled($failures !== [])>
                Continue
            </button>
        </div>
    </form>
@endsection
