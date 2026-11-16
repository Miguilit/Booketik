@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $isAdmin = auth()->user()?->isAdmin();
        $money = fn (int $minor) => \App\Support\Money::format($minor, $balance['currency']);
        $statusLabels = [
            'draft' => __('draft'), 'scheduled' => __('scheduled'), 'published' => __('published'),
            'cancelled' => __('cancelled'), 'postponed' => __('postponed'), 'ended' => __('ended'),
        ];
    @endphp

    @include('admin.partials.flash')

    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
            <a href="{{ route('admin.organizers.index', ['locale' => $locale]) }}" class="small">&larr; {{ __('Organizers') }}</a>
            <h2 class="mb-0">
                {{ $organizer->name }}
                @if($organizer->is_verified)<i class="mdi mdi-check-decagram text-primary" title="{{ __('Verified') }}"></i>@endif
            </h2>
            <div class="small text-muted">
                <code>{{ $organizer->slug }}</code> · {{ trans_choice(':count follower|:count followers', $organizer->followers_count, ['count' => number_format($organizer->followers_count)]) }}
                · {{ trans_choice(':count event|:count events', $organizer->events_count, ['count' => number_format($organizer->events_count)]) }} · {{ $organizer->plan?->name ?? __('Free') }}
            </div>
        </div>
        <div class="d-flex gap-2">
            <form method="POST" action="{{ route('admin.organizers.verify', ['locale' => $locale, 'organizer' => $organizer->id]) }}">
                @csrf
                <input type="hidden" name="verified" value="{{ $organizer->is_verified ? 0 : 1 }}">
                <button class="btn btn-sm {{ $organizer->is_verified ? 'btn-secondary' : 'btn-primary' }}">{{ $organizer->is_verified ? __('Remove verification') : __('Verify') }}</button>
            </form>
            <form method="POST" action="{{ route('admin.organizers.suspend', ['locale' => $locale, 'organizer' => $organizer->id]) }}"
                  data-confirm="{{ $organizer->status === 'active' ? __('Suspend? Every event is hidden and sales stop.') : __('Reinstate this organizer?') }}">
                @csrf
                <input type="hidden" name="suspended" value="{{ $organizer->status === 'active' ? 1 : 0 }}">
                <button class="btn btn-sm {{ $organizer->status === 'active' ? 'btn-outline-danger' : 'btn-success' }}">{{ $organizer->status === 'active' ? __('Suspend') : __('Reinstate') }}</button>
            </form>
        </div>
    </div>

    <div class="row">
        <div class="col-lg-7">
            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Profile') }}</h2></div>
                <div class="card-body">
                    {{-- Verification, plan and status have their own buttons: a
                         profile save is never how a badge or a plan changes. --}}
                    <form method="POST" action="{{ route('admin.organizers.update', ['locale' => $locale, 'organizer' => $organizer->id]) }}">
                        @csrf
                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save profile')])
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label small" for="name">{{ __('Name') }}</label>
                                <input type="text" class="form-control" id="name" name="name" value="{{ old('name', $organizer->name) }}" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small" for="slug">{{ __('Slug') }}</label>
                                <input type="text" class="form-control" id="slug" name="slug" value="{{ old('slug', $organizer->slug) }}" required>
                                <span class="small text-muted">{{ __('Changing it breaks shared hub links.') }}</span>
                            </div>
                            <div class="col-12">
                                <label class="form-label small" for="bio">{{ __('Bio') }}</label>
                                <textarea class="form-control" id="bio" name="bio" rows="3">{{ old('bio', $organizer->bio) }}</textarea>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="city">{{ __('City (label)') }}</label>
                                <input type="text" class="form-control" id="city" name="city" value="{{ old('city', $organizer->city) }}">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="city_id">{{ __('Home city') }}</label>
                                <select class="form-control" id="city_id" name="city_id">
                                    <option value="">{{ __('None') }}</option>
                                    @foreach($cities as $c)
                                        <option value="{{ $c->id }}" @selected((string) old('city_id', $organizer->city_id) === (string) $c->id)>{{ $c->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small" for="theme_accent">{{ __('Accent') }}</label>
                                <input type="text" class="form-control" id="theme_accent" name="theme_accent" value="{{ old('theme_accent', $organizer->theme_accent) }}" placeholder="#C2532B">
                            </div>
                            <div class="col-md-6">
                                @php $mayTheme = \App\Support\Themes\ThemeResolver::organizerMayTheme($organizer); @endphp
                                <label class="form-label small" for="theme_key">{{ __('Page look') }}</label>
                                <select class="form-select" id="theme_key" name="theme_key">
                                    <option value="">{{ __('Site default') }}</option>
                                    @foreach(\App\Support\Themes\ThemeRegistry::all() as $key => $theme)
                                        @if($theme['built'])
                                            <option value="{{ $key }}" @selected(old('theme_key', $organizer->theme_key) === $key)>{{ $theme['name'] }}</option>
                                        @endif
                                    @endforeach
                                </select>
                                <div class="form-text">
                                    {{ __('The look of this organizer\'s hub and event pages.') }}
                                    @unless($mayTheme) {{ __('Only applied on a plan with a custom theme (Pro, Business).') }} @endunless
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small" for="contact_email">{{ __('Contact email') }}</label>
                                <input type="email" class="form-control" id="contact_email" name="contact_email" value="{{ old('contact_email', $organizer->contact_email) }}">
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Team') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead><tr><th>{{ __('Member') }}</th><th>{{ __('Role') }}</th><th>{{ __('Joined') }}</th><x-row-actions-header /></tr></thead>
                            <tbody>
                            @foreach($organizer->members->sortByDesc(fn ($m) => $m->role->rank()) as $member)
                                <tr>
                                    <td>
                                        <strong>{{ $member->user?->name }}</strong>
                                        <div class="small text-muted">{{ $member->user?->email }}</div>
                                    </td>
                                    <td>
                                        @if($member->role === \App\Enums\OrganizerRole::Owner)
                                            {{-- Ownership moves by transfer, never by a role edit. --}}
                                            <span class="badge bg-dark">{{ __('Owner') }}</span>
                                        @else
                                            <form method="POST" class="d-flex gap-1"
                                                  action="{{ route('admin.organizers.members.role', ['locale' => $locale, 'organizer' => $organizer->id, 'user' => $member->user_id]) }}">
                                                @csrf
                                                <select name="role" class="form-control form-control-sm">
                                                    @foreach($roles as $role)
                                                        @continue($role === \App\Enums\OrganizerRole::Owner)
                                                        <option value="{{ $role->value }}" @selected($member->role === $role)>{{ $role->label() }}</option>
                                                    @endforeach
                                                </select>
                                                <button class="btn btn-sm btn-secondary">{{ __('Set') }}</button>
                                            </form>
                                        @endif
                                    </td>
                                    <td class="small">{{ $member->created_at?->toDateString() }}@if($member->inviter) · {{ __('by :name', ['name' => $member->inviter->name]) }}@endif</td>
                                    <td class="row-actions-col">
                                        @unless($member->role === \App\Enums\OrganizerRole::Owner)
                                            <x-row-actions>
                                                <x-row-action-form icon="account-remove" tone="danger"
                                                                   :action="route('admin.organizers.members.delete', ['locale' => $locale, 'organizer' => $organizer->id, 'user' => $member->user_id])"
                                                                   :confirm="__('Remove from the team?')">{{ __('Remove') }}</x-row-action-form>
                                            </x-row-actions>
                                        @endunless
                                    </td>
                                </tr>
                            @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-5">
            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Plan') }}</h2></div>
                <div class="card-body">
                    <p class="mb-2"><strong>{{ $organizer->plan?->name ?? __('Free') }}</strong>
                        @if($organizer->plan_expires_at)<span class="small text-muted">· {{ __('until :date', ['date' => $organizer->plan_expires_at->toDateString()]) }}</span>@endif
                    </p>
                    @if($isAdmin)
                        <form method="POST" action="{{ route('admin.organizers.plan', ['locale' => $locale, 'organizer' => $organizer->id]) }}">
                            @csrf
                            <div class="row g-2">
                                <div class="col-7">
                                    <select name="plan_id" class="form-control form-control-sm">
                                        <option value="">{{ __('Free') }}</option>
                                        @foreach($plans as $plan)
                                            <option value="{{ $plan->id }}" @selected($organizer->plan_id === $plan->id)>{{ $plan->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-5"><input type="date" name="plan_expires_at" class="form-control form-control-sm" aria-label="{{ __('Until') }}"></div>
                            </div>
                            <button class="btn btn-sm btn-primary mt-2">{{ __('Set plan') }}</button>
                        </form>
                    @endif
                </div>
            </div>

            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Balance') }}</h2></div>
                <div class="card-body">
                    <dl class="row mb-0 small">
                        <dt class="col-6">{{ __('Available') }}</dt><dd class="col-6 text-end">{{ $money($balance['available']) }}</dd>
                        <dt class="col-6 fw-normal">{{ __('In hold') }}</dt><dd class="col-6 text-end">{{ $money($balance['pending']) }}</dd>
                        <dt class="col-6 fw-normal">{{ __('Payout method') }}</dt><dd class="col-6 text-end">{{ $organizer->payout_method ?? '—' }}</dd>
                        <dt class="col-6 fw-normal">Stripe Connect</dt><dd class="col-6 text-end">{{ $organizer->stripe_connect_account_id ? __('Connected') : __('Not connected') }}</dd> {{-- i18n-ignore: brand name --}}
                    </dl>
                    @if($isAdmin)
                        <a class="small" href="{{ route('admin.payouts.index', ['locale' => $locale, 'organizer' => $organizer->id, 'status' => 'all']) }}">{{ __('Payouts') }} &rarr;</a>
                    @endif
                </div>
            </div>

            <div class="card card-default mb-4">
                <div class="card-header card-header-border-bottom"><h2 class="mb-0">{{ __('Recent events') }}</h2></div>
                <div class="card-body">
                    <ul class="list-unstyled mb-0 small">
                        @forelse($events as $event)
                            <li class="mb-1">
                                <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $event->id]) }}">{{ $event->title }}</a>
                                <span class="text-muted">· {{ $event->starts_at->copy()->setTimezone($event->timezone)->format('Y-m-d') }} · {{ $statusLabels[$event->status->value] ?? $event->status->value }}</span>
                            </li>
                        @empty
                            <li class="text-muted">{{ __('No events yet.') }}</li>
                        @endforelse
                    </ul>
                </div>
            </div>
        </div>
    </div>
@endsection
