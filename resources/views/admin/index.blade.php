@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $money = fn (int $minor) => \App\Support\Money::format($minor, $kpis['gmv_currency']);
    @endphp

    @include('admin.partials.flash')

    {{-- Headline numbers: is the platform selling, and is anyone showing up.
         GMV is what buyers paid on settled orders, in the reporting currency. --}}
    <div class="row">
        @php
            $tiles = [
                ['label' => 'GMV',                'value' => $money($kpis['gmv_minor']),             'sub' => __(':amount in fees', ['amount' => $money($kpis['fees_minor'])]),                     'icon' => 'mdi-cash-multiple',   'tone' => 'success'],
                ['label' => __('Tickets issued'),     'value' => number_format($kpis['tickets_issued']),  'sub' => __(':count paid orders', ['count' => number_format($kpis['orders_paid'])]),          'icon' => 'mdi-ticket-confirmation',          'tone' => 'primary'],
                ['label' => __('Active organizers'),  'value' => number_format($kpis['active_organizers']), 'sub' => __(':count events this week', ['count' => number_format($kpis['events_this_week'])]), 'icon' => 'mdi-account-group', 'tone' => 'info'],
                ['label' => __('Check-in rate'),      'value' => number_format($kpis['checkin_rate'] * 100, 1).'%', 'sub' => __('of tickets for past events'),                     'icon' => 'mdi-qrcode-scan',     'tone' => 'warning'],
            ];
        @endphp

        @foreach($tiles as $tile)
            <div class="col-xl-3 col-md-6">
                <div class="card card-default">
                    <div class="card-body d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-muted text-uppercase small">{{ $tile['label'] }}</div>
                            <h3 class="mb-0">{{ $tile['value'] }}</h3>
                            <div class="small text-muted">{{ $tile['sub'] }}</div>
                        </div>
                        <i class="mdi {{ $tile['icon'] }} text-{{ $tile['tone'] }}" style="font-size:2.4rem;"></i>
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    <div class="row">
        <div class="col-lg-8">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom">
                    <h2>{{ __('Signups & tickets — last 14 days') }}</h2>
                </div>
                <div class="card-body">
                    {{-- The wrapper owns the height; see maintainAspectRatio below. --}}
                    <div class="cl-chart-wrap" style="position: relative; height: 260px;">
                        <canvas id="signupChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="card card-default">
                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">{{ __('Coming up') }}</h2>
                    <a class="btn btn-sm btn-secondary" href="{{ route('admin.events.index', ['locale' => $locale]) }}">{{ __('All events') }}</a>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                            <tr>
                                <th>{{ __('Event') }}</th>
                                <th>{{ __('Organizer') }}</th>
                                <th>{{ __('Starts') }}</th>
                                <th class="text-end">{{ __('Going') }}</th>
                            </tr>
                            </thead>
                            <tbody>
                            @forelse($upcoming as $event)
                                <tr>
                                    <td><a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $event->id]) }}">{{ $event->title }}</a></td>
                                    <td class="small">{{ $event->organizer?->name }}</td>
                                    {{-- In the event's own zone: "Saturday 20:00" means the venue's Saturday. --}}
                                    <td class="small text-nowrap">{{ $event->starts_at->copy()->setTimezone($event->timezone)->format('D j M, H:i') }} <span class="text-muted">{{ $event->timezone }}</span></td>
                                    <td class="text-end">{{ number_format($event->going_count) }}</td>
                                </tr>
                            @empty
                                <tr><td colspan="4" class="text-muted">{{ __('Nothing scheduled.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            {{-- Work waiting for staff. Each count links to the queue it is from. --}}
            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Waiting on staff') }}</h2></div>
                <div class="card-body">
                    <dl class="row mb-0">
                        <dt class="col-7"><a href="{{ route('admin.events.index', ['locale' => $locale, 'moderation' => 'queue']) }}">{{ __('Events to review') }}</a></dt>
                        <dd class="col-5 text-end">{{ number_format($queues['review']) }}</dd>
                        <dt class="col-7"><a href="{{ route('admin.reports.index', ['locale' => $locale]) }}">{{ __('Open reports') }}</a></dt>
                        <dd class="col-5 text-end">{{ number_format($queues['reports']) }}</dd>
                        <dt class="col-7">{{ __('Payouts requested') }}</dt>
                        <dd class="col-5 text-end">{{ number_format($queues['payouts']) }}</dd>
                        <dt class="col-7">{{ __('Open support requests') }}</dt>
                        <dd class="col-5 text-end">{{ number_format($queues['support']) }}</dd>
                    </dl>
                </div>
            </div>

            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Members') }}</h2></div>
                <div class="card-body">
                    <dl class="row mb-0">
                        <dt class="col-7">{{ __('Members') }}</dt>
                        <dd class="col-5 text-end">{{ number_format($users['total']) }}</dd>
                        <dt class="col-7">{{ __('New this month') }}</dt>
                        <dd class="col-5 text-end">{{ number_format($users['new_month']) }}</dd>
                        <dt class="col-7">Eventgoo Plus</dt> {{-- i18n-ignore --}}
                        <dd class="col-5 text-end">{{ number_format($users['plus']) }}</dd>
                        <dt class="col-7">{{ __('Active subscriptions') }}</dt>
                        <dd class="col-5 text-end">{{ number_format($subscriptions) }}</dd>
                        <dt class="col-7">{{ __('Guests') }}</dt>
                        <dd class="col-5 text-end">{{ number_format($users['guests']) }}</dd>
                        <dt class="col-7">{{ __('Blocked') }}</dt>
                        <dd class="col-5 text-end">{{ number_format($users['blocked']) }}</dd>
                    </dl>
                </div>
            </div>

            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Newest organizers') }}</h2></div>
                <div class="card-body">
                    <table class="table table-sm mb-0">
                        <tbody>
                        @forelse($recentOrganizers as $organizer)
                            <tr>
                                <td><a href="{{ route('admin.organizers.show', ['locale' => $locale, 'organizer' => $organizer->id]) }}">{{ $organizer->name }}</a>
                                    <div class="small text-muted">{{ $organizer->city ?: '—' }}</div></td>
                                <td class="text-end">
                                    @if($organizer->is_verified)<span class="badge bg-success">{{ __('Verified') }}</span>@endif
                                </td>
                            </tr>
                        @empty
                            <tr><td class="text-muted">{{ __('No organizers yet.') }}</td></tr>
                        @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Newest members') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm mb-0">
                            <tbody>
                            @forelse($recentUsers as $user)
                                <tr>
                                    <td>
                                        <a href="{{ route('admin.user.show', ['locale' => $locale, 'id' => $user->id]) }}">
                                            {{ $user->name ?: __('Guest') }}
                                        </a>
                                        <div class="small text-muted">{{ $user->email ?: __('no email') }}</div>
                                    </td>
                                    <td class="text-end">
                                        @if($user->has_plus)
                                            <span class="badge bg-success">{{ __('Plus') }}</span>
                                        @elseif($user->is_guest)
                                            <span class="badge bg-secondary">{{ __('Guest') }}</span>
                                        @endif
                                    </td>
                                    <td class="row-actions-col">
                                        <x-row-actions>
                                            <x-row-action icon="eye-outline"
                                                          :href="route('admin.user.show', ['locale' => $locale, 'id' => $user->id])">{{ __('View member') }}</x-row-action>
                                            @if($user->email)
                                                <x-row-action icon="email-outline" :href="'mailto:'.$user->email">{{ __('Email') }}</x-row-action>
                                            @endif
                                        </x-row-actions>
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="3" class="text-muted">{{ __('No members yet.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Chart.js is loaded in admin_master.
        (function () {
            const series = @json($signupChart);
            const el = document.getElementById('signupChart');
            if (!el || !window.Chart) return;

            let chart = null;
            const draw = () => {
            if (chart) chart.destroy();
            // Civic tokens from the stylesheet, so the chart follows light/dark.
            const css = getComputedStyle(document.documentElement);
            const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
            const teal = token('--cl-accent', '#0C5A52');
            const tangerine = token('--cl-cta', '#FF6B2C');
            const muted = token('--cl-text-muted', '#59625F');
            const line = token('--cl-border', '#E3DDD1');
            const soft = (hex) => {
                const h = hex.replace('#', '');
                const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
                return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0.12)`;
            };

            chart = new Chart(el.getContext('2d'), {
                type: 'line',
                data: {
                    labels: series.map(r => r.date.slice(5)),
                    datasets: [
                        {
                            label: @json(__('Signups')),
                            data: series.map(r => r.users),
                            borderColor: teal,
                            backgroundColor: soft(teal),
                            tension: .3,
                            fill: true,
                        },
                        {
                            label: @json(__('Tickets issued')),
                            data: series.map(r => r.tickets),
                            borderColor: tangerine,
                            backgroundColor: soft(tangerine),
                            tension: .3,
                            fill: true,
                            yAxisID: 'tickets',
                        },
                    ],
                },
                options: {
                    responsive: true,
                    /*
                     | Without this a responsive canvas keeps its aspect ratio,
                     | so it grows taller as the card gets wider and — on a
                     | narrowing viewport — never gives the height back. The
                     | `height` attribute on the canvas is only the initial
                     | ratio; this is what makes the wrapper's height win.
                     */
                    maintainAspectRatio: false,
                    interaction: {mode: 'index', intersect: false},
                    animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
                    plugins: {legend: {labels: {color: muted, usePointStyle: true}}},
                    scales: {
                        x: {ticks: {color: muted}, grid: {color: line}},
                        y: {beginAtZero: true, title: {display: true, text: @json(__('Signups')), color: muted}, ticks: {color: muted}, grid: {color: line}},
                        // Tickets outnumber signups by an order of magnitude, so
                        // sharing one axis would flatten the signup line to zero.
                        tickets: {
                            beginAtZero: true,
                            position: 'right',
                            grid: {drawOnChartArea: false},
                            title: {display: true, text: @json(__('Tickets')), color: muted},
                            ticks: {color: muted},
                        },
                    },
                },
            });
            };
            draw();
            window.addEventListener('eg-theme-change', draw);
        })();
    </script>
@endsection
