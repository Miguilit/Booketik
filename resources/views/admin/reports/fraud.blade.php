@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="cl-page-head">
        <div>
            <p class="cl-eyebrow">{{ __('Reports · last :days days', ['days' => $days]) }}</p>
            <h1>{{ __('Fraud flags') }}</h1>
            <p class="text-muted">{{ __('Computed from door scans and payments that already happened. Each flag is a pattern to look at, not a verdict.') }}</p>
        </div>
    </div>

    <div class="cl-kpis">
        @foreach($types as $key => [$label, $tone, $hint])
            <a class="cl-kpi text-decoration-none" href="{{ route('admin.reports.fraud', ['locale' => $locale, 'type' => $key]) }}" @if($type === $key) aria-current="true" style="border-color: var(--cl-accent)" @endif>
                <p class="cl-kpi__label">{{ $label }}</p>
                <div class="cl-kpi__value">{{ number_format($counts[$key] ?? 0) }}</div>
                <p class="cl-kpi__note">{{ $hint }}</p>
            </a>
        @endforeach
    </div>

    <div class="card card-default">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h2 class="mb-0">{{ $type === 'all' ? __('All flags') : $types[$type][0] ?? __('Flags') }} <span class="text-muted small ms-2">{{ $flags->count() }}</span></h2>
            @if($type !== 'all')
                <a class="btn btn-secondary btn-sm" href="{{ route('admin.reports.fraud', ['locale' => $locale]) }}">{{ __('Show all :count', ['count' => $total]) }}</a>
            @endif
        </div>
        <div class="card-body">
            @if($flags->isEmpty())
                <div class="cl-empty"><i class="mdi mdi-shield-outline" aria-hidden="true"></i><strong>{{ __('Nothing flagged') }}</strong>{{ __('No shared tickets, passbacks, forged codes, oversold payments or failed-payment bursts in the last :days days.', ['days' => $days]) }}</div>
            @else
                <div class="table-responsive">
                    <table class="table table-sm align-middle">
                        <thead><tr><th>{{ __('When') }}</th><th>{{ __('Signal') }}</th><th>{{ __('Subject') }}</th><th>{{ __('Event') }}</th><th>{{ __('Detail') }}</th><th></th></tr></thead>
                        <tbody>
                        @foreach($flags as $flag)
                            @php [$label, $tone] = $types[$flag['type']]; @endphp
                            <tr>
                                <td class="small text-nowrap">{{ $flag['at']?->format('Y-m-d H:i') }}</td>
                                <td><span class="badge bg-{{ $tone }}">{{ $label }}</span></td>
                                <td class="small cl-mono">{{ $flag['subject'] }}</td>
                                <td class="small">
                                    @if($flag['event'])<a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $flag['event']->id]) }}">{{ $flag['event']->title }}</a>@else — @endif
                                </td>
                                <td class="small">{{ $flag['detail'] }}</td>
                                <td class="text-end">
                                    @if(isset($flag['filter']))
                                        <a class="btn btn-secondary btn-sm" href="{{ route('admin.check-ins.index', ['locale' => $locale] + $flag['filter']) }}">{{ __('Scans') }}</a>
                                    @elseif(isset($flag['order_id']))
                                        <a class="btn btn-secondary btn-sm" href="{{ route('admin.billing.orders.show', ['locale' => $locale, 'id' => $flag['order_id']]) }}">{{ __('Order') }}</a>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
            <p class="small text-muted mt-3 mb-0">{{ __('Chargebacks and disputes are not recorded yet: no gateway dispute webhook is stored, so they cannot be flagged here.') }}</p>
        </div>
    </div>
@endsection
