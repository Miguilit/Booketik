@extends('setup.layout')

@section('title', 'Install')
@section('heading', 'Build the database')
@section('lede', 'This is the only destructive step, and it is additive: it creates the tables the application needs and fills in reference data. Existing tables are left alone.')

@section('body')
    @php
        $tasks = config('setup.tasks', []);
        $existingTables = $state->flag('existing_tables');
    @endphp

    <div class="panel-body">
        <div class="note note-info" id="intro">
            <strong>Each step below runs as its own request.</strong>
            <p style="margin-top:6px">
                That is deliberate: seeding this project does not fit inside the 30-second limit most shared hosts impose,
                and one long request would simply time out with no way to tell how far it got. If a step fails you can fix
                the cause and press retry &mdash; the steps that already finished are not repeated.
            </p>
        </div>

        @if ($existingTables)
            <div class="note note-warn">
                <strong>That database already has {{ $existingTables }} tables in it.</strong>
                <p style="margin-top:6px">Migrations will run alongside them. If they belong to another application, stop now and go back to use an empty database instead.</p>
            </div>
        @endif

        <div id="task-list" style="margin-top:6px">
            @foreach ($tasks as $task)
                <div class="task" data-task="{{ $task['key'] }}">
                    <span class="dot"></span>
                    <span>
                        <span class="label">{{ $task['label'] }}</span>
                        <span class="msg" data-msg>Waiting</span>
                    </span>
                </div>
            @endforeach
        </div>

        <div id="failure" class="hidden" style="margin-top:18px"></div>
        <pre class="out hidden" id="output"></pre>
    </div>

    <div class="panel-foot">
        <a class="btn btn-ghost" href="{{ url('/setup/'.($steps[$currentIndex - 1]['key'] ?? 'admin')) }}" id="back">Back</a>
        <span style="display:flex;gap:10px">
            <button class="btn hidden" type="button" id="show-output">Show details</button>
            <button class="btn btn-primary" type="button" id="start">Run the install</button>
        </span>
    </div>
@endsection

@push('scripts')
<script>
(function () {
    var tasks   = @json(array_column(config('setup.tasks', []), 'key'));
    var rows    = {};
    var output  = document.getElementById('output');
    var failure = document.getElementById('failure');
    var start   = document.getElementById('start');
    var back    = document.getElementById('back');
    var toggle  = document.getElementById('show-output');
    var log     = [];
    var cursor  = 0;

    document.querySelectorAll('.task').forEach(function (row) { rows[row.dataset.task] = row; });

    function set(key, state, message) {
        var row = rows[key];
        row.className = 'task ' + state;
        row.querySelector('[data-msg]').textContent = message;
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
        });
    }

    function record(key, res) {
        if (res.output) { log.push('$ ' + key + '\n' + res.output); output.textContent = log.join('\n\n'); toggle.classList.remove('hidden'); }
    }

    function next() {
        if (cursor >= tasks.length) { return finish(); }

        var key = tasks[cursor];
        set(key, 'running', 'Running…');

        window.SETUP.post('/run/' + key, {})
            .then(function (res) {
                record(key, res);

                if (res.ok && res.warning) {
                    set(key, 'warn', res.message);
                } else if (res.ok) {
                    set(key, 'done', res.message);
                } else {
                    set(key, 'failed', res.message);
                    return fail(res);
                }

                cursor++;
                next();
            })
            .catch(function () {
                set(key, 'failed', 'The request did not complete.');
                fail({
                    message: 'The request did not complete.',
                    output: 'The browser lost the connection, or PHP stopped mid-request. If this step is a long one, raise max_execution_time and press retry.'
                });
            });
    }

    function fail(res) {
        failure.classList.remove('hidden');
        failure.innerHTML = '<div class="note note-bad"><strong>' + esc(res.message) + '</strong>' +
            (res.output ? '<p style="margin-top:6px">' + esc(res.output).slice(0, 800) + '</p>' : '') +
            '<p style="margin-top:8px">Fix the cause, then press <em>Retry</em>. Steps that already finished are skipped.</p></div>';
        start.textContent = 'Retry';
        start.disabled = false;
        back.classList.remove('hidden');
    }

    function finish() {
        start.textContent = 'Finishing…';
        window.location = window.SETUP.base + '/done';
    }

    start.addEventListener('click', function () {
        start.disabled = true;
        start.textContent = 'Installing…';
        back.classList.add('hidden');
        failure.classList.add('hidden');
        document.getElementById('intro').classList.add('hidden');
        next();
    });

    toggle.addEventListener('click', function () {
        output.classList.toggle('hidden');
        toggle.textContent = output.classList.contains('hidden') ? 'Show details' : 'Hide details';
    });

    // Leaving mid-install would abandon a half-migrated database.
    window.addEventListener('beforeunload', function (e) {
        if (start.disabled && cursor < tasks.length) { e.preventDefault(); e.returnValue = ''; }
    });
})();
</script>
@endpush
