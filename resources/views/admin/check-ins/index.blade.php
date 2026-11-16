@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $resultLabels = [
            'valid' => __('Valid'), 'already_checked_in' => __('Already checked in'), 'wrong_event' => __('Wrong event'),
            'refunded' => __('Refunded'), 'void' => __('Void'), 'unknown' => __('Unknown'), 'invalid_code' => __('Invalid code'),
        ];
    @endphp

    @include('admin.partials.flash')

    {{-- The door's audit log, read-only. Every scan is here, admitted or not:
         a dispute at the door ("I was let in, then told my ticket was used") is
         settled from these rows, so nothing on this screen edits them. --}}

    <div class="row">
        @foreach($results as $result)
            <div class="col-6 col-md-3 col-xl mb-3">
                <div class="card card-default h-100">
                    <div class="card-body py-3">
                        <div class="small text-muted">{{ $resultLabels[$result->value] ?? str_replace('_', ' ', ucfirst($result->value)) }}</div>
                        <div class="h4 mb-0">{{ number_format((int) ($summary[$result->value] ?? 0)) }}</div>
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom">
            <h2 class="mb-0">{{ __('Check-ins') }} <span class="text-muted small ms-2">{{ trans_choice(':count scan|:count scans', $scans->total(), ['count' => $scans->total()]) }}</span></h2>
        </div>
        <div class="card-body">
            <form method="GET" class="row g-2 mb-3">
                <div class="col-md-5">
                    <select name="event" class="form-control">
                        <option value="">{{ __('Every event') }}</option>
                        @foreach($events as $event)
                            <option value="{{ $event->id }}" @selected(($filters['event'] ?? '') === $event->id)>{{ $event->title }} · {{ $event->starts_at?->format('Y-m-d') }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-3">
                    <select name="result" class="form-control">
                        <option value="">{{ __('Any result') }}</option>
                        @foreach($results as $result)
                            <option value="{{ $result->value }}" @selected(($filters['result'] ?? '') === $result->value)>{{ $resultLabels[$result->value] ?? str_replace('_', ' ', $result->value) }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="offline" class="form-control">
                        <option value="">{{ __('Online and offline') }}</option>
                        <option value="0" @selected(($filters['offline'] ?? '') === '0')>{{ __('Online') }}</option>
                        <option value="1" @selected(($filters['offline'] ?? '') === '1')>{{ __('Synced offline') }}</option>
                    </select>
                </div>
                <div class="col-md-2"><button class="btn btn-secondary w-100">{{ __('Filter') }}</button></div>
            </form>

            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead>
                        <tr>
                            <th>{{ __('Scanned') }}</th>
                            <th>{{ __('Event') }}</th>
                            <th>{{ __('Ticket') }}</th>
                            <th>{{ __('Result') }}</th>
                            <th>{{ __('Staff') }}</th>
                            <th>{{ __('Gate / device') }}</th>
                            <th>{{ __('Mode') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                    @forelse($scans as $scan)
                        <tr>
                            {{-- In the event's own zone: "18:04" means what the door saw. --}}
                            <td class="small text-nowrap">{{ $scan->scanned_at?->setTimezone($scan->event?->timezone ?? 'UTC')->format('Y-m-d H:i:s') }}</td>
                            <td class="small">
                                @if($scan->event)
                                    <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $scan->event->id]) }}">{{ $scan->event->title }}</a>
                                @else — @endif
                            </td>
                            <td class="small">
                                @if($scan->ticket)
                                    <code>{{ $scan->ticket->code }}</code>
                                    <div class="text-muted">{{ $scan->ticket->holder_name }}</div>
                                @else
                                    <span class="text-muted">{{ Str::limit($scan->payload, 24) ?: '—' }}</span>
                                @endif
                            </td>
                            <td>
                                <span class="badge bg-{{ $scan->result->value === 'valid' ? 'success' : ($scan->result->value === 'already_checked_in' ? 'warning text-dark' : 'danger') }}">
                                    {{ $resultLabels[$scan->result->value] ?? str_replace('_', ' ', $scan->result->value) }}
                                </span>
                            </td>
                            <td class="small">{{ $scan->staff?->name ?? '—' }}</td>
                            <td class="small">{{ $scan->gate ?: '—' }}<div class="text-muted">{{ $scan->device_id }}</div></td>
                            <td class="small">{{ $scan->offline ? __('Offline · synced :time', ['time' => $scan->synced_at?->diffForHumans()]) : __('Online') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ __('No scans yet.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>

            {{ $scans->links('pagination::bootstrap-4') }}
        </div>
    </div>
@endsection
