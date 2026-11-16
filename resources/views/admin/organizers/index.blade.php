@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $statusLabels = ['active' => __('active'), 'suspended' => __('suspended')];
    @endphp

    @include('admin.partials.flash')

    <div class="card card-default">
        <div class="card-header card-header-border-bottom">
            <h2 class="mb-0">{{ __('Organizers') }} <span class="text-muted small ms-2">{{ $organizers->total() }}</span></h2>
        </div>
        <div class="card-body">
            <form method="GET" class="row g-2 mb-3">
                <div class="col-md-4"><input type="text" class="form-control" name="search" placeholder="{{ __('Name, slug or email') }}" value="{{ $filters['search'] ?? '' }}"></div>
                <div class="col-md-2">
                    <select name="status" class="form-control">
                        <option value="">{{ __('Any status') }}</option>
                        <option value="active" @selected(($filters['status'] ?? '') === 'active')>{{ __('Active') }}</option>
                        <option value="suspended" @selected(($filters['status'] ?? '') === 'suspended')>{{ __('Suspended') }}</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="verified" class="form-control">
                        <option value="">{{ __('Verified or not') }}</option>
                        <option value="1" @selected(($filters['verified'] ?? '') === '1')>{{ __('Verified') }}</option>
                        <option value="0" @selected(($filters['verified'] ?? '') === '0')>{{ __('Not verified') }}</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="plan" class="form-control">
                        <option value="">{{ __('Any plan') }}</option>
                        <option value="free" @selected(($filters['plan'] ?? '') === 'free')>{{ __('Free') }}</option>
                        @foreach($plans as $plan)
                            <option value="{{ $plan->id }}" @selected((string) ($filters['plan'] ?? '') === (string) $plan->id)>{{ $plan->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-1">
                    <select name="city" class="form-control">
                        <option value="">{{ __('City') }}</option>
                        @foreach($cities as $c)
                            <option value="{{ $c->id }}" @selected((string) ($filters['city'] ?? '') === (string) $c->id)>{{ $c->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-1"><button class="btn btn-secondary w-100">{{ __('Filter') }}</button></div>
            </form>

            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr><th>{{ __('Organizer') }}</th><th>{{ __('City') }}</th><th>{{ __('Plan') }}</th><th class="text-end">{{ __('Followers') }}</th><th class="text-end">{{ __('Events') }}</th><th>{{ __('Status') }}</th><x-row-actions-header /></tr>
                    </thead>
                    <tbody>
                    @forelse($organizers as $organizer)
                        <tr class="{{ $organizer->status === 'suspended' ? 'text-muted' : '' }}">
                            <td>
                                <a href="{{ route('admin.organizers.show', ['locale' => $locale, 'organizer' => $organizer->id]) }}"><strong>{{ $organizer->name }}</strong></a>
                                @if($organizer->is_verified)<i class="mdi mdi-check-decagram text-primary" title="{{ __('Verified') }}"></i>@endif
                                <div class="small text-muted"><code>{{ $organizer->slug }}</code></div>
                            </td>
                            <td class="small">{{ $organizer->homeCity?->name ?? $organizer->city ?? '—' }}</td>
                            <td class="small">{{ $organizer->plan?->name ?? __('Free') }}</td>
                            <td class="text-end">{{ number_format($organizer->follower_count) }}</td>
                            <td class="text-end">{{ number_format($organizer->upcoming_count) }} <span class="text-muted small">/ {{ number_format($organizer->events_count) }}</span></td>
                            <td><span class="badge bg-{{ $organizer->status === 'active' ? 'success' : 'danger' }}">{{ $statusLabels[$organizer->status] ?? $organizer->status }}</span></td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <x-row-action icon="eye" :href="route('admin.organizers.show', ['locale' => $locale, 'organizer' => $organizer->id])">{{ __('Open') }}</x-row-action>
                                    <x-row-action icon="calendar" :href="route('admin.events.index', ['locale' => $locale, 'organizer' => $organizer->id])">{{ __('Events') }}</x-row-action>
                                    <x-row-actions-divider />
                                    <x-row-action-form icon="check-decagram" tone="" method="POST"
                                                       :action="route('admin.organizers.verify', ['locale' => $locale, 'organizer' => $organizer->id])"
                                                       :fields="['verified' => $organizer->is_verified ? '0' : '1']">{{ $organizer->is_verified ? __('Remove verification') : __('Verify') }}</x-row-action-form>
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ __('No organizers match.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
            {{ $organizers->links('pagination::bootstrap-4') }}
        </div>
    </div>
@endsection
