@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $statusLabels = [
            'pending' => __('Pending'), 'approved' => __('Approved'), 'declined' => __('Declined'), 'waitlisted' => __('Waitlisted'),
            'going' => __('Going'), 'cancelled' => __('Cancelled'), 'attended' => __('Attended'),
        ];
    @endphp

    @include('admin.partials.flash')

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
                <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $event->id]) }}" class="small">&larr; {{ $event->title }}</a>
                <h2 class="mb-0">{{ __('Guests') }} <span class="text-muted small ms-2">{{ $registrations->total() }}</span></h2>
            </div>
            <div class="btn-group btn-group-sm flex-wrap">
                <a class="btn {{ $status ? 'btn-secondary' : 'btn-primary' }}" href="{{ route('admin.events.registrations', ['locale' => $locale, 'event' => $event->id]) }}">{{ __('All') }}</a>
                @foreach($statuses as $s)
                    <a class="btn {{ $status === $s->value ? 'btn-primary' : 'btn-secondary' }}"
                       href="{{ route('admin.events.registrations', ['locale' => $locale, 'event' => $event->id, 'status' => $s->value]) }}">
                        {{ $statusLabels[$s->value] ?? ucfirst($s->value) }} <span class="badge bg-light text-dark">{{ (int) ($counts[$s->value] ?? 0) }}</span>
                    </a>
                @endforeach
            </div>
        </div>
        <div class="card-body">
            {{-- Approvals go through RegistrationService, exactly as from the
                 organizer's dashboard: approving a free guest seats and tickets
                 them, or waitlists them if the room filled while they waited. --}}
            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead>
                        <tr><th>{{ __('Guest') }}</th><th>{{ __('Status') }}</th><th>{{ __('Tier') }}</th><th class="text-end">{{ __('Seats') }}</th><th class="text-end">{{ __('Tickets') }}</th><th>{{ __('Registered') }}</th><x-row-actions-header /></tr>
                    </thead>
                    <tbody>
                    @forelse($registrations as $registration)
                        <tr>
                            <td>
                                <strong>{{ $registration->name ?? $registration->user?->name ?? __('Guest') }}</strong>
                                <div class="small text-muted">{{ $registration->email ?? $registration->user?->email }}</div>
                            </td>
                            <td>
                                <span class="badge bg-secondary">{{ $statusLabels[$registration->status->value] ?? $registration->status->value }}</span>
                                @if($registration->waitlist_position)<span class="small text-muted">#{{ $registration->waitlist_position }}</span>@endif
                                @if($registration->hasOpenClaim())<div class="small text-success">{{ __('Offer open until :time', ['time' => $registration->waitlist_claim_expires_at->diffForHumans()]) }}</div>@endif
                            </td>
                            <td class="small">{{ $registration->ticketType?->name ?? '—' }}</td>
                            <td class="text-end">{{ $registration->quantity }}</td>
                            <td class="text-end">{{ $registration->tickets_count }}</td>
                            <td class="small text-nowrap">{{ $registration->created_at?->diffForHumans() }}</td>
                            <td class="row-actions-col">
                                @if(in_array($registration->status->value, ['pending', 'waitlisted', 'approved', 'going'], true))
                                    <x-row-actions>
                                        @if(in_array($registration->status->value, ['pending', 'waitlisted'], true))
                                            <x-row-action-form icon="check" tone="success" method="POST"
                                                               :action="route('admin.events.registrations.approve', ['locale' => $locale, 'event' => $event->id, 'registration' => $registration->id])">{{ __('Approve') }}</x-row-action-form>
                                        @endif
                                        <x-row-action-form icon="close" tone="danger" method="POST"
                                                           :action="route('admin.events.registrations.decline', ['locale' => $locale, 'event' => $event->id, 'registration' => $registration->id])"
                                                           :confirm="__('Decline this guest? Any tickets they hold are voided.')">{{ __('Decline') }}</x-row-action-form>
                                    </x-row-actions>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ $status ? __('No guests with this status.') : __('No guests yet.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
            {{ $registrations->links('pagination::bootstrap-4') }}
        </div>
    </div>
@endsection
