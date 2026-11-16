@extends('setup.layout')

@section('title', 'Database')
@section('heading', 'Connect the database')
@section('lede', 'Test the connection here before you continue — a wrong value found now is one sentence, and found later is a blank error page. Nothing is written to .env until the test passes.')

@section('body')
    @php
        $connection = $old['db_connection'] ?? ($env->get('DB_CONNECTION') ?: 'mysql');
        $host       = $old['db_host']       ?? ($env->get('DB_HOST') ?: 'localhost');
        $port       = $old['db_port']       ?? ($env->get('DB_PORT') ?: '3306');
        $database   = $old['db_database']   ?? ($env->get('DB_DATABASE') ?: '');
        $username   = $old['db_username']   ?? ($env->get('DB_USERNAME') ?: '');
        $socket     = $old['db_socket']     ?? ($env->get('DB_SOCKET') ?: '');
    @endphp

    <form method="post" action="{{ url('/setup/database') }}" id="db-form">
        <input type="hidden" name="_setup_token" value="{{ $token }}">

        <div class="panel-body">
            <div class="field">
                <label for="db_connection">Database type</label>
                <select id="db_connection" name="db_connection">
                    <option value="mysql" @selected($connection === 'mysql')>MySQL / MariaDB</option>
                    <option value="pgsql" @selected($connection === 'pgsql')>PostgreSQL</option>
                    <option value="sqlite" @selected($connection === 'sqlite')>SQLite (a single file — for testing only)</option>
                </select>
            </div>

            <div class="field">
                <label for="db_database"><span id="db_database_label">Database name</span></label>
                <input type="text" id="db_database" name="db_database" value="{{ $database }}" required>
                <p class="help" id="db_database_help">Create it in your control panel first if it does not exist. On cPanel the real name is prefixed with your account, like <code>myaccount_eventgoo</code>.</p>
            </div>

            <div id="server-fields">
                <div class="row">
                    <div class="field">
                        <label for="db_host">Host</label>
                        <input type="text" id="db_host" name="db_host" value="{{ $host }}">
                        <p class="help">Usually <code>localhost</code> on shared hosting. Testing on your own machine, use <code>127.0.0.1</code> &mdash; PHP ignores the port when the host is <code>localhost</code>.</p>
                    </div>
                    <div class="field">
                        <label for="db_port">Port</label>
                        <input type="text" id="db_port" name="db_port" value="{{ $port }}">
                        <p class="help">3306 for MySQL, 5432 for PostgreSQL, 8889 for MAMP.</p>
                    </div>
                </div>

                <div class="row">
                    <div class="field">
                        <label for="db_username">Username</label>
                        <input type="text" id="db_username" name="db_username" value="{{ $username }}" autocomplete="off">
                    </div>
                    <div class="field">
                        <label for="db_password">Password</label>
                        <input type="password" id="db_password" name="db_password" value="" autocomplete="new-password">
                        <p class="help">{{ $env->filled('DB_PASSWORD') ? 'A password is already saved. Leave blank only if the account genuinely has none — blank replaces it.' : '' }}</p>
                    </div>
                </div>

                <details @if ($socket !== '') open @endif>
                    <summary>Connect through a socket instead of a port</summary>
                    <div class="inner">
                        <div class="field" style="margin:0">
                            <label for="db_socket">Unix socket path</label>
                            <input type="text" id="db_socket" name="db_socket" value="{{ $socket }}" placeholder="leave empty unless you know you need it">
                            <p class="help">
                                Set this <em>only</em> if your MySQL is genuinely reached through a socket — a local MAMP install
                                uses <code>/Applications/MAMP/tmp/mysql/mysql.sock</code>. When it is filled in it overrides host
                                and port completely, so a value left over from another machine produces a connection error that
                                mentions neither.
                            </p>
                        </div>
                    </div>
                </details>
            </div>

            <div id="sqlite-note" class="note note-warn hidden">
                <strong>SQLite is fine for a look around, not for a live site.</strong>
                <p style="margin-top:6px">It serialises writes, so the app stalls under any real traffic. Use MySQL for anything you intend to keep.</p>
            </div>

            <div style="display:flex;gap:10px;align-items:center;margin-top:4px;flex-wrap:wrap">
                <button class="btn" type="button" id="db-test">Test connection</button>
                <button class="btn hidden" type="button" id="db-create">Create this database</button>
                <span id="db-spinner" class="hidden" style="font-size:13px;color:var(--muted)">Connecting…</span>
            </div>

            <div id="db-result" style="margin-top:14px"></div>
        </div>

        <div class="panel-foot">
            <a class="btn btn-ghost" href="{{ url('/setup/application') }}">Back</a>
            <button class="btn btn-primary" type="submit">Save and continue</button>
        </div>
    </form>
@endsection

@push('scripts')
<script>
(function () {
    var form    = document.getElementById('db-form');
    var result  = document.getElementById('db-result');
    var testBtn = document.getElementById('db-test');
    var makeBtn = document.getElementById('db-create');
    var spinner = document.getElementById('db-spinner');
    var type    = document.getElementById('db_connection');

    function payload() {
        return {
            db_connection: type.value,
            db_host:     (document.getElementById('db_host')     || {}).value || '',
            db_port:     (document.getElementById('db_port')     || {}).value || '',
            db_database: (document.getElementById('db_database') || {}).value || '',
            db_username: (document.getElementById('db_username') || {}).value || '',
            db_password: (document.getElementById('db_password') || {}).value || '',
            db_socket:   (document.getElementById('db_socket')   || {}).value || ''
        };
    }

    function show(res) {
        var tone = res.ok ? 'note-ok' : (res.status === 'database_missing' ? 'note-warn' : 'note-bad');
        var extra = '';

        // An existing schema is not an error, but installing over someone
        // else's tables is a bad afternoon — say so before the migration runs.
        if (res.ok && res.tables > 0) {
            tone = 'note-warn';
            extra = '<p style="margin-top:6px">This database already contains <strong>' + res.tables + ' tables</strong>. ' +
                    'The installer will migrate into it rather than replace it. If those tables belong to something else, use an empty database instead.</p>';
        }
        if (res.server) {
            extra += '<p style="margin-top:6px;opacity:.8">Server version ' + res.server + '.</p>';
        }

        result.innerHTML = '<div class="note ' + tone + '"><strong>' + esc(res.message) + '</strong>' +
            (res.detail ? '<p style="margin-top:6px">' + esc(res.detail) + '</p>' : '') + extra + '</div>';

        makeBtn.classList.toggle('hidden', res.status !== 'database_missing');
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
        });
    }

    function run(path, button) {
        button.disabled = true; testBtn.disabled = true;
        spinner.classList.remove('hidden');
        result.innerHTML = '';
        window.SETUP.post(path, payload())
            .then(show)
            .catch(function () { result.innerHTML = '<div class="note note-bad"><strong>The test could not be run.</strong><p style="margin-top:6px">The request never reached the server. Check that you are still online, then reload this page.</p></div>'; })
            .then(function () { button.disabled = false; testBtn.disabled = false; spinner.classList.add('hidden'); });
    }

    testBtn.addEventListener('click', function () { run('/probe/database', testBtn); });
    makeBtn.addEventListener('click', function () { run('/probe/database/create', makeBtn); });

    function syncType() {
        var isSqlite = type.value === 'sqlite';
        document.getElementById('server-fields').classList.toggle('hidden', isSqlite);
        document.getElementById('sqlite-note').classList.toggle('hidden', !isSqlite);
        document.getElementById('db_database').required = !isSqlite;
        document.getElementById('db_database_label').textContent = isSqlite ? 'Path to the SQLite file' : 'Database name';
        document.getElementById('db_database_help').innerHTML = isSqlite
            ? 'Relative to the project root. Leave blank for <code>database/database.sqlite</code>; the installer creates the file.'
            : 'Create it in your control panel first if it does not exist. On cPanel the real name is prefixed with your account, like <code>myaccount_eventgoo</code>.';
        if (type.value === 'pgsql' && document.getElementById('db_port').value === '3306') {
            document.getElementById('db_port').value = '5432';
        }
    }
    type.addEventListener('change', syncType);
    syncType();

    // Submitting is what actually writes .env, and the server re-tests anyway;
    // testing first here just means the error appears next to the fields.
    form.addEventListener('submit', function () { testBtn.disabled = true; });
})();
</script>
@endpush
