@extends('admin.admin_master')
@section('admin')
    {{-- Event reports filed by attendees.

         "Reviewed" and "dismissed" are flags, not deletes: a handled report is
         still evidence of a pattern — against one organizer, or from one
         reporter — and removing it throws away the only record either happened. --}}
    @php $locale = app()->getLocale(); @endphp

    @include('admin.partials.flash')


    <div class="alert alert-info py-2 px-3 small">
        {!! __('Response target: :hours.', ['hours' => '<strong>'.e(trans_choice(':count hour|:count hours', $slaHours)).'</strong>']) !!}
        @if($autoHideAt > 0)
            {!! __('Auto-hidden after :count reports.', ['count' => '<strong>'.e($autoHideAt).'</strong>']) !!}
        @else
            {{ __('Auto-hide is off.') }}
        @endif
    </div>
    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <h2>{{ __('Event reports') }}</h2>
            <div class="btn-group btn-group-sm">
                @foreach(['pending' => __('Pending'), 'reviewed' => __('Reviewed'), 'dismissed' => __('Dismissed'), 'all' => __('All')] as $key => $label)
                    <a class="btn {{ $status === $key ? 'btn-primary' : 'btn-secondary' }}"
                       href="{{ route('admin.reports.index', ['locale' => $locale, 'status' => $key]) }}">
                        {{ $label }}
                        @if($key !== 'all')<span class="badge bg-light text-dark">{{ $counts[$key] ?? 0 }}</span>@endif
                    </a>
                @endforeach
            </div>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                    <tr>
                        <th>{{ __('Filed') }}</th>
                        <th>{{ __('Due') }}</th>
                        <th>{{ __('Event') }}</th>
                        <th>{{ __('Reason') }}</th>
                        <th>{{ __('Details') }}</th>
                        <th>{{ __('Reporter') }}</th>
                        <x-row-actions-header />
                    </tr>
                    </thead>
                    <tbody>
                    @forelse($reports as $report)
                        <tr>
                            <td class="small text-nowrap">{{ $report->created_at?->diffForHumans() }}</td>
                            {{-- The clock. A published response time nobody
                                 working the queue can see is a response time
                                 that gets missed — not through negligence, but
                                 because "this has waited 26 hours" is not a
                                 fact you derive from a list sorted by date. --}}
                            @php $sla = \App\Support\ModerationSla::status($report->created_at, $slaHours); @endphp
                            <td class="small text-nowrap">
                                @if($report->status === 'pending')
                                    <span class="badge {{ match($sla['state']) {
                                        'breached' => 'bg-danger',
                                        'due' => 'bg-warning text-dark',
                                        default => 'bg-secondary',
                                    } }}">{{ $sla['label'] }}</span>
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td>
                                @if($report->event)
                                    <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $report->event->id]) }}">
                                        {{ $report->event->title }}
                                    </a>
                                    <div class="small text-muted">
                                        {{ $report->event->organizer?->name }}
                                        @if($report->event->hidden_at) · <span class="text-danger">{{ __('hidden') }}</span>@endif
                                    </div>
                                @else
                                    <span class="text-muted">{{ __('Deleted') }}</span>
                                @endif
                            </td>
                            <td><span class="badge bg-secondary">{{ $report->reason }}</span></td>
                            <td class="small">{{ Str::limit($report->details, 160) ?: '—' }}</td>
                            <td class="small">
                                {{-- A blank reporter is expected, not corrupt: reports survive
                                     the account that filed them. --}}
                                {{ $report->user?->email ?? __('Signed out / deleted') }}
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    @if($report->event)
                                        <x-row-action icon="calendar"
                                                      :href="route('admin.events.edit', ['locale' => $locale, 'event' => $report->event->id])">{{ __('Open event') }}</x-row-action>
                                    @endif
                                    @if($report->status === 'pending')
                                        <x-row-action-form icon="check" tone="success" method="POST"
                                                           :action="route('admin.reports.review', ['locale' => $locale, 'report' => $report->id])">{{ __('Mark reviewed') }}</x-row-action-form>
                                        <x-row-action-form icon="close" tone="" method="POST"
                                                           :action="route('admin.reports.dismiss', ['locale' => $locale, 'report' => $report->id])">{{ __('Dismiss') }}</x-row-action-form>
                                    @else
                                        <x-row-action-form icon="restore" tone="" method="POST"
                                                           :action="route('admin.reports.reopen', ['locale' => $locale, 'report' => $report->id])">{{ __('Reopen') }}</x-row-action-form>
                                    @endif
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ __('Nothing reported.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>

            {{ $reports->links() }}
        </div>
    </div>
@endsection
