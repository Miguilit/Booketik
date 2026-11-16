@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        // Cents to dollars; sub-dollar amounts keep four places (a call costs fractions of a cent).
        $usd = fn ($cents) => '$'.number_format(((float) $cents) / 100, ((float) $cents) > 0 && ((float) $cents) < 100 ? 4 : 2);
    @endphp
    @include('admin.partials.flash')

    <div class="cl-page-head">
        <div>
            <p class="cl-eyebrow">{{ __('Eventgoo AI · since :date', ['date' => $monthStart->format('j M Y')]) }}</p>
            <h1>{{ __('Usage & cost') }}</h1>
            <p class="text-muted">{{ __('Estimated from recorded tokens and the per-token prices in config — not the provider\'s invoice.') }}</p>
        </div>
    </div>

    @include('admin.ai._nav')

    <div class="cl-kpis">
        <div class="cl-kpi">
            <p class="cl-kpi__label">{{ __('Spent this month') }}</p>
            <div class="cl-kpi__value">{{ $usd($spent) }}</div>
            @if($cap !== null)
                <div class="cl-meter mt-2 {{ $share >= 1 ? 'is-over' : ($share >= 0.8 ? 'is-warn' : '') }}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{ (int) round($share * 100) }}" aria-label="{{ __('Share of the monthly cap') }}"><span style="width: {{ round($share * 100, 1) }}%"></span></div>
                <p class="cl-kpi__note">{{ __('of :cap cap · :percent%', ['cap' => $usd($cap), 'percent' => (int) round($share * 100)]) }}</p>
            @else
                <p class="cl-kpi__note">{{ __('No monthly cap set') }}</p>
            @endif
        </div>
        <div class="cl-kpi"><p class="cl-kpi__label">{{ __('Runs') }}</p><div class="cl-kpi__value">{{ number_format($runs) }}</div><p class="cl-kpi__note">{{ __(':count failed (no credit spent)', ['count' => number_format($failed)]) }}</p></div>
        <div class="cl-kpi"><p class="cl-kpi__label">{{ __('Organizer credits spent') }}</p><div class="cl-kpi__value">{{ number_format($credits) }}</div></div>
        <div class="cl-kpi"><p class="cl-kpi__label">{{ __('Tokens in / out') }}</p><div class="cl-kpi__value">{{ number_format($tokens['input']) }}</div><p class="cl-kpi__note">{{ __(':count out', ['count' => number_format($tokens['output'])]) }}</p></div>
    </div>

    <div class="card card-default">
        <div class="card-header"><h2>{{ __('Last 30 days') }}</h2></div>
        <div class="card-body">
            @if(collect($days)->sum('calls') === 0)
                <div class="cl-empty"><i class="mdi mdi-chart-line" aria-hidden="true"></i><strong>{{ __('No AI calls yet') }}</strong>{{ __('Calls appear here as organizers draft events, write copy, triage guests or ask the insights copilot.') }}</div>
            @else
                <div style="height:240px"><canvas id="ai-daily" aria-label="{{ __('AI cost per day, last 30 days') }}" role="img"></canvas></div>
            @endif
        </div>
    </div>

    <div class="row">
        <div class="col-xl-6">
            <div class="card card-default">
                <div class="card-header"><h2>{{ __('By feature') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead><tr><th>{{ __('Feature') }}</th><th class="text-end">{{ __('Runs') }}</th><th class="text-end">{{ __('Failed') }}</th><th class="text-end">{{ __('Credits') }}</th><th class="text-end">{{ __('Cost') }}</th><th>{{ __('Cap') }}</th></tr></thead>
                            <tbody>
                            @forelse($byFeature as $row)
                                <tr>
                                    <td>{{ $row['label'] }}<div class="small text-muted cl-mono">{{ $row['feature'] }}</div></td>
                                    <td class="text-end cl-num">{{ number_format($row['runs']) }}</td>
                                    <td class="text-end cl-num">{{ number_format($row['failed']) }}</td>
                                    <td class="text-end cl-num">{{ number_format($row['credits']) }}</td>
                                    <td class="text-end cl-num">{{ $usd($row['cost']) }}</td>
                                    <td class="small">{{ $row['cap'] !== null ? $usd($row['cap']) : '—' }}</td>
                                </tr>
                            @empty
                                <tr><td colspan="6" class="text-muted">{{ __('No runs this month.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6">
            <div class="card card-default">
                <div class="card-header"><h2>{{ __('By organizer') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead><tr><th>{{ __('Organizer') }}</th><th>{{ __('Plan') }}</th><th class="text-end">{{ __('Runs') }}</th><th class="text-end">{{ __('Credits') }}</th><th class="text-end">{{ __('Cost') }}</th></tr></thead>
                            <tbody>
                            @forelse($byOrganizer as $row)
                                @php $org = $organizers[$row->organizer_id] ?? null; @endphp
                                <tr>
                                    <td>
                                        @if($org)<a href="{{ route('admin.organizers.show', ['locale' => $locale, 'organizer' => $org->id]) }}">{{ $org->name }}</a>@else <span class="text-muted">{{ __('Deleted') }}</span> @endif
                                    </td>
                                    <td class="small">{{ $org?->plan?->name ?? __('Free') }}</td>
                                    <td class="text-end cl-num">{{ number_format((int) $row->runs) }}</td>
                                    <td class="text-end cl-num">{{ number_format((int) $row->credits) }}</td>
                                    <td class="text-end cl-num">{{ $usd($row->cost) }}</td>
                                </tr>
                            @empty
                                <tr><td colspan="5" class="text-muted">{{ __('No organizer has used AI this month.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card card-default">
        <div class="card-header"><h2>{{ __('Recent runs') }}</h2></div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead><tr><th>{{ __('When') }}</th><th>{{ __('Feature') }}</th><th>{{ __('Organizer') }}</th><th>{{ __('Status') }}</th><th>{{ __('Model') }}</th><th class="text-end">{{ __('Credits') }}</th><th class="text-end">{{ __('Cost') }}</th></tr></thead>
                    <tbody>
                    @forelse($recent as $run)
                        <tr>
                            <td class="small text-nowrap">{{ $run->created_at?->format('Y-m-d H:i') }}</td>
                            <td class="small cl-mono">{{ $run->feature ?? $run->type }}</td>
                            <td class="small">{{ $organizerNames[$run->organizer_id] ?? '—' }}</td>
                            <td><span class="badge bg-{{ $run->status === 'done' ? 'success' : ($run->status === 'failed' ? 'danger' : 'secondary') }}">{{ $run->status }}</span></td>
                            <td class="small cl-mono">{{ $run->steps->first()?->model ?? '—' }}</td>
                            <td class="text-end cl-num">{{ (int) $run->credits }}</td>
                            <td class="text-end cl-num">{{ $usd($run->spent_cents) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ __('No runs recorded.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
    @if(collect($days)->sum('calls') > 0)
        <script>
            (function () {
                var el = document.getElementById('ai-daily');
                if (!el || !window.Chart) return;
                var chart = null;
                function draw() {
                if (chart) chart.destroy();
                var css = getComputedStyle(document.documentElement);
                var accent = css.getPropertyValue('--cl-accent').trim() || '#0C5A52';
                var muted = css.getPropertyValue('--cl-text-muted').trim() || '#59625F';
                var line = css.getPropertyValue('--cl-border').trim() || '#E3DDD1';
                var days = @json($days);
                chart = new Chart(el, {
                    type: 'bar',
                    data: {
                        labels: days.map(function (d) { return d.date.slice(5); }),
                        datasets: [{ label: @json(__('Cost (US cents)')), data: days.map(function (d) { return d.cost; }), backgroundColor: accent, borderRadius: 4 }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color: muted, maxRotation: 0, autoSkip: true }, grid: { display: false } },
                            y: { ticks: { color: muted }, grid: { color: line }, beginAtZero: true }
                        }
                    }
                });
                }
                draw();
                window.addEventListener('eg-theme-change', draw);
            })();
        </script>
    @endif
@endsection
