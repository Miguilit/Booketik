@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $resultLabels = [
            'valid' => __('Valid'), 'already_checked_in' => __('Already checked in'), 'wrong_event' => __('Wrong event'),
            'refunded' => __('Refunded'), 'void' => __('Void'), 'unknown' => __('Unknown'), 'invalid_code' => __('Invalid code'),
        ];
        // Labels the polling script renders into rows it builds itself.
        $liveLabels = [
            'doors' => __('doors'),
            'checkedIn' => __('Checked in'),
            'noDoors' => __('No doors open right now'),
            'noDoorsHelp' => __('Events appear here twelve hours before they start.'),
            'offline' => __('offline'),
            'noScans' => __('No scans yet.'),
            'pause' => __('Pause'),
            'resume' => __('Resume'),
            'results' => $resultLabels,
        ];
    @endphp
    @include('admin.partials.flash')

    <div class="cl-page-head">
        <div>
            <p class="cl-eyebrow">{{ __('Doors · today') }}</p>
            <h1>{{ __('Live check-ins') }}</h1>
            <p class="text-muted">{{ __('Events within 12 hours of now. Refreshes every 10 seconds; times are each event\'s own.') }}</p>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="cl-live" id="live-state" aria-live="polite">{!! __('Updated :time', ['time' => '<span id="live-at" class="cl-mono">'.e(\Carbon\Carbon::parse($snapshot['at'])->format('H:i:s')).'</span>']) !!}</span>
            <button type="button" class="btn btn-secondary btn-sm" id="live-pause" aria-pressed="false">{{ __('Pause') }}</button>
            <a class="btn btn-secondary btn-sm" href="{{ route('admin.check-ins.index', ['locale' => $locale]) }}">{{ __('Full audit log') }}</a>
        </div>
    </div>

    <div class="cl-kpis cl-kpis--dense" id="live-results">
        @foreach($snapshot['results'] as $result => $count)
            <div class="cl-kpi"><p class="cl-kpi__label">{{ __(':result · last hour', ['result' => $resultLabels[$result] ?? ucfirst(str_replace('_', ' ', $result))]) }}</p><div class="cl-kpi__value" data-result="{{ $result }}">{{ number_format($count) }}</div></div>
        @endforeach
    </div>

    <div class="row">
        <div class="col-xl-6">
            <div class="card card-default">
                <div class="card-header"><h2>{{ __('Events') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead><tr><th>{{ __('Event') }}</th><th>{{ __('Starts') }}</th><th class="text-end">{{ __('In') }}</th><th style="min-width:120px">{{ __('Share') }}</th><th class="text-end">{{ __('Rejected (1 h)') }}</th></tr></thead>
                            <tbody id="live-events"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6">
            <div class="card card-default">
                <div class="card-header"><h2>{{ __('Latest scans') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead><tr><th>{{ __('Time') }}</th><th>{{ __('Ticket') }}</th><th>{{ __('Result') }}</th><th>{{ __('Gate') }}</th></tr></thead>
                            <tbody id="live-latest"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
<script>
    (function () {
        var endpoint = @json(route('admin.check-ins.live.data', ['locale' => $locale]));
        var paused = false;
        var L = @json($liveLabels);
        var esc = function (v) { var d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; };
        var tone = function (r) { return r === 'valid' ? 'success' : (r === 'already_checked_in' ? 'warning' : 'danger'); };

        function render(s) {
            document.getElementById('live-at').textContent = new Date(s.at).toLocaleTimeString();
            Object.keys(s.results).forEach(function (k) {
                var el = document.querySelector('[data-result="' + k + '"]');
                if (el) el.textContent = Number(s.results[k]).toLocaleString();
            });
            var rows = s.events.map(function (e) {
                var share = e.issued > 0 ? Math.round(e.admitted / e.issued * 100) : 0;
                var rejected = Object.keys(e.last_hour).filter(function (k) { return k !== 'valid'; }).reduce(function (n, k) { return n + e.last_hour[k]; }, 0);
                return '<tr><td><a href="' + esc(e.url) + '"><strong>' + esc(e.title) + '</strong></a>'
                    + (e.live ? ' <span class="badge bg-success">' + esc(L.doors) + '</span>' : '')
                    + '<div class="small text-muted">' + esc(e.organizer) + '</div></td>'
                    + '<td class="small text-nowrap cl-mono">' + esc(e.starts_local) + '<div class="text-muted">' + esc(e.timezone) + '</div></td>'
                    + '<td class="text-end cl-num">' + e.admitted + ' / ' + e.issued + '</td>'
                    + '<td><div class="cl-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + share + '" aria-label="' + esc(L.checkedIn) + '"><span style="width:' + share + '%"></span></div><div class="small text-muted">' + share + '%</div></td>'
                    + '<td class="text-end cl-num">' + rejected + '</td></tr>';
            });
            document.getElementById('live-events').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5"><div class="cl-empty"><i class="mdi mdi-qrcode-scan" aria-hidden="true"></i><strong>' + esc(L.noDoors) + '</strong>' + esc(L.noDoorsHelp) + '</div></td></tr>';
            var latest = s.latest.map(function (c) {
                return '<tr><td class="small cl-mono">' + esc(c.at) + '</td><td class="small"><span class="cl-mono">' + esc(c.code || '—') + '</span><div class="text-muted">' + esc(c.event) + '</div></td>'
                    + '<td><span class="badge bg-' + tone(c.result) + '">' + esc(L.results[c.result] || String(c.result).replace(/_/g, ' ')) + '</span>' + (c.offline ? ' <span class="badge bg-secondary">' + esc(L.offline) + '</span>' : '') + '</td>'
                    + '<td class="small">' + esc(c.gate || '—') + (c.staff ? '<div class="text-muted">' + esc(c.staff) + '</div>' : '') + '</td></tr>';
            });
            document.getElementById('live-latest').innerHTML = latest.length ? latest.join('') : '<tr><td colspan="4" class="text-muted">' + esc(L.noScans) + '</td></tr>';
        }

        function poll() {
            if (paused || document.hidden) return;
            fetch(endpoint, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
                .then(function (s) { document.getElementById('live-state').classList.remove('is-paused'); render(s); })
                .catch(function () { document.getElementById('live-state').classList.add('is-paused'); });
        }

        render(@json($snapshot));
        setInterval(poll, 10000);
        document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
        document.getElementById('live-pause').addEventListener('click', function () {
            paused = !paused;
            this.textContent = paused ? L.resume : L.pause;
            this.setAttribute('aria-pressed', paused ? 'true' : 'false');
            document.getElementById('live-state').classList.toggle('is-paused', paused);
            if (!paused) poll();
        });
    })();
</script>
@endsection
