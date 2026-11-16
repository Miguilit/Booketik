@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp

    @include('admin.partials.flash')

    <div class="row">
        @php
            $tiles = [
                [__('Members'), $summary['total'], 'primary'],
                [__('Plus'), $summary['plus'], 'success'],
                [__('Guests'), $summary['guests'], 'secondary'],
                [__('Blocked'), $summary['blocked'], 'danger'],
            ];
        @endphp
        @foreach($tiles as [$label, $value, $tone])
            <div class="col-md-3">
                <div class="card card-default">
                    <div class="card-body">
                        <div class="text-muted text-uppercase small">{{ $label }}</div>
                        <h3 class="mb-0 text-{{ $tone }}">{{ number_format($value) }}</h3>
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom">
            <h2>{{ __('dashboard.users') }}</h2>
        </div>

        <div class="card-body">
            <form method="GET" class="row g-2 mb-4">
                <div class="col-md-4">
                    <input type="text" name="search" class="form-control"
                           placeholder="{{ __('Name, username, email or Firebase uid') }}"
                           value="{{ $filters['search'] ?? '' }}">
                </div>
                <div class="col-6 col-md-2">
                    <select name="status" class="form-control">
                        <option value="">{{ __('Any status') }}</option>
                        <option value="active" @selected(($filters['status'] ?? '') === 'active')>{{ __('Active') }}</option>
                        <option value="suspended" @selected(($filters['status'] ?? '') === 'suspended')>{{ __('Suspended') }}</option>
                    </select>
                </div>
                <div class="col-6 col-md-2">
                    <select name="plan" class="form-control">
                        <option value="">{{ __('Any plan') }}</option>
                        <option value="plus" @selected(($filters['plan'] ?? '') === 'plus')>{{ __('Plus') }}</option>
                        <option value="free" @selected(($filters['plan'] ?? '') === 'free')>{{ __('Free') }}</option>
                    </select>
                </div>
                <div class="col-6 col-md-2">
                    <select name="role" class="form-control">
                        <option value="">{{ __('Any role') }}</option>
                        <option value="admin" @selected(($filters['role'] ?? '') === 'admin')>{{ __('Admin') }}</option>
                        <option value="moderator" @selected(($filters['role'] ?? '') === 'moderator')>{{ __('Moderator') }}</option>
                        <option value="user" @selected(($filters['role'] ?? '') === 'user')>{{ __('Member') }}</option>
                    </select>
                </div>
                <div class="col-6 col-md-2">
                    <button class="btn btn-secondary w-100">{{ __('Filter') }}</button>
                </div>
            </form>

            <div class="table-responsive">
                <table class="table">
                    <thead>
                    <tr>
                        <th>{{ __('dashboard.name') }}</th>
                        <th>{{ __('dashboard.email') }}</th>
                        <th>{{ __('Plan') }}</th>
                        <th>{{ __('dashboard.status') }}</th>
                        <th class="text-end">{{ __('Registrations') }}</th>
                        <th>{{ __('dashboard.created_at') }}</th>
                        <x-row-actions-header />
                    </tr>
                    </thead>

                    <tbody>
                    @forelse($users as $user)
                        <tr>
                            <td>
                                <a href="{{ route('admin.user.show', ['locale' => $locale, 'id' => $user->id]) }}">
                                    {{ $user->name ?: __('Guest') }}
                                </a>
                                <div class="small text-muted">{{ $user->role?->name ?? __('Member') }}</div>
                            </td>
                            <td>{{ $user->email ?: '—' }}</td>
                            <td>
                                @if($user->has_plus)
                                    <span class="badge bg-success">{{ __('Plus') }}</span>
                                @elseif($user->is_guest)
                                    <span class="badge bg-secondary">{{ __('Guest') }}</span>
                                @else
                                    <span class="badge bg-light text-dark">{{ __('Free') }}</span>
                                @endif
                            </td>
                            <td>
                                @if($user->is_blocked)
                                    <span class="badge bg-danger">{{ __('dashboard.blocked') }}</span>
                                @elseif($user->status === 'active')
                                    <span class="badge bg-success">{{ __('dashboard.active') }}</span>
                                @else
                                    <span class="badge bg-secondary">{{ __('dashboard.inactive') }}</span>
                                @endif
                            </td>
                            <td class="text-end">{{ number_format($user->registrations_count) }}
                                @if($user->organizer_memberships_count > 0)
                                    <div><span class="badge bg-info">{{ __('Organizer team') }}</span></div>
                                @endif
                            </td>
                            <td class="small">{{ $user->created_at?->diffForHumans() ?? '—' }}</td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <x-row-action icon="eye-outline"
                                                  :href="route('admin.user.show', ['locale' => $locale, 'id' => $user->id])">{{ __('View') }}</x-row-action>
                                    @if($user->email)
                                        <x-row-action icon="email-outline" :href="'mailto:'.$user->email">{{ __('Email') }}</x-row-action>
                                    @endif
                                    @if(auth()->user()?->isAdmin())
                                        <x-row-actions-divider />
                                        <x-row-action-form icon="delete"
                                                           :action="route('admin.user.delete', ['id' => $user->id, 'locale' => $locale])"
                                                           :confirm="__('dashboard.confirm_delete')">{{ __('dashboard.delete') }}</x-row-action-form>
                                    @endif
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ __('No members match that filter.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>

            {{ $users->links() }}
        </div>
    </div>
@endsection
