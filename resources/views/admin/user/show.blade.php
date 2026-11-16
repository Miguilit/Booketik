@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
    @endphp

    @include('admin.partials.flash')

    <div class="row">
        <div class="col-lg-5">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom">
                    <h2>{{ $user->name ?: __('Guest') }}</h2>
                </div>
                <div class="card-body">
                    <dl class="row mb-0">
                        <dt class="col-5">{{ __('Id') }}</dt>
                        <dd class="col-7"><code>{{ $user->id }}</code></dd>
                        <dt class="col-5">{{ __('Email') }}</dt>
                        <dd class="col-7">{{ $user->email ?: '—' }}</dd>
                        <dt class="col-5">{{ __('Username') }}</dt>
                        <dd class="col-7">{{ $user->username ?: '—' }}</dd>
                        <dt class="col-5">{{ __('Role') }}</dt>
                        <dd class="col-7">{{ $user->role?->name ?? __('Member') }}</dd>
                        <dt class="col-5">{{ __('Account') }}</dt>
                        <dd class="col-7">
                            @if($user->is_guest)
                                <span class="badge bg-secondary">{{ __('Guest') }}</span>
                            @else
                                <span class="badge bg-primary">{{ __('Registered') }}</span>
                            @endif
                            @if($user->has_plus)<span class="badge bg-success">{{ __('Plus') }}</span>@endif
                        </dd>
                        <dt class="col-5">{{ __('Plus expires') }}</dt>
                        <dd class="col-7">{{ $user->subscription_expiration_date?->format('Y-m-d H:i') ?? '—' }}</dd>
                        <dt class="col-5">{{ __('Firebase uid') }}</dt>
                        <dd class="col-7"><code class="small">{{ $user->firebase_uid ?? '—' }}</code></dd>
                        <dt class="col-5">{{ __('RevenueCat id') }}</dt>
                        <dd class="col-7"><code class="small">{{ $user->revenuecat_app_user_id ?? '—' }}</code></dd>
                        <dt class="col-5">{{ __('Locale') }}</dt>
                        <dd class="col-7">{{ $user->locale }}</dd>
                        <dt class="col-5">{{ __('Joined') }}</dt>
                        <dd class="col-7">{{ $user->created_at?->format('Y-m-d H:i') }}</dd>
                        <dt class="col-5">{{ __('Last seen') }}</dt>
                        <dd class="col-7">{{ $user->last_seen_at?->diffForHumans() ?? '—' }}</dd>
                    </dl>
                </div>
            </div>

            @if(auth()->user()?->isAdmin())
            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Account status') }}</h2></div>
                <div class="card-body">
                    <form method="POST" action="{{ route('admin.user.update', ['locale' => $locale, 'id' => $user->id]) }}">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save account'), 'sticky' => false])
                        <div class="mb-3">
                            <label class="form-label" for="name">{{ __('Name') }}</label>
                            <input type="text" class="form-control" id="name" name="name" value="{{ $user->name }}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="status">{{ __('Status') }}</label>
                            <select class="form-control" id="status" name="status">
                                <option value="active" @selected($user->status === 'active')>{{ __('Active') }}</option>
                                <option value="suspended" @selected($user->status === 'suspended')>{{ __('Suspended') }}</option>
                            </select>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" name="is_blocked" value="1"
                                   id="is_blocked" @checked($user->is_blocked)>
                            <label class="form-check-label" for="is_blocked">{{ __('Blocked from the app') }}</label>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="blocked_reason">{{ __('Reason') }}</label>
                            <input type="text" class="form-control" id="blocked_reason" name="blocked_reason"
                                   value="{{ $user->blocked_reason }}">
                        </div>
                    </form>
                </div>
            </div>
            @endif

            @if(auth()->user()?->isAdmin())
                <div class="card card-default">
                    <div class="card-header card-header-border-bottom"><h2>Eventgoo Plus</h2></div> {{-- i18n-ignore --}}
                    <div class="card-body">
                        <p class="text-muted small">{{ __('Normally set by RevenueCat. Use for support fixes only.') }}</p>
                        <form method="POST" action="{{ route('admin.user.plus', ['locale' => $locale, 'id' => $user->id]) }}">
                            @csrf
                            <div class="row g-2 align-items-end">
                                <div class="col-6">
                                    <label class="form-label" for="has_plus">{{ __('Access') }}</label>
                                    <select class="form-control" id="has_plus" name="has_plus">
                                        <option value="1" @selected($user->has_plus)>{{ __('Plus') }}</option>
                                        <option value="0" @selected(! $user->has_plus)>{{ __('Free') }}</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label" for="expires_at">{{ __('Expires') }}</label>
                                    <input type="datetime-local" class="form-control" id="expires_at" name="expires_at"
                                           value="{{ $user->subscription_expiration_date?->format('Y-m-d\TH:i') }}">
                                </div>
                            </div>
                            <button class="btn btn-primary mt-3">{{ __('Apply') }}</button>
                        </form>
                    </div>
                </div>
            @endif
        </div>

        <div class="col-lg-7">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Going out') }}</h2></div>
                <div class="card-body">
                    <div class="row text-center">
                        <div class="col"><div class="text-muted small">{{ __('Registrations') }}</div><h4>{{ number_format($activity['registrations']) }}</h4></div>
                        <div class="col"><div class="text-muted small">{{ __('Tickets') }}</div><h4>{{ number_format($activity['tickets']) }}</h4></div>
                        <div class="col"><div class="text-muted small">{{ __('Checked in') }}</div><h4>{{ number_format($activity['checked_in']) }}</h4></div>
                        <div class="col"><div class="text-muted small">{{ __('Saved') }}</div><h4>{{ number_format($activity['saved']) }}</h4></div>
                        <div class="col"><div class="text-muted small">{{ __('Following') }}</div><h4>{{ number_format($activity['following']) }}</h4></div>
                    </div>
                    @if($user->organizerMemberships->isNotEmpty())
                        <p class="small mt-3 mb-0">
                            {{ __('On the team of:') }}
                            @foreach($user->organizerMemberships as $membership)
                                <a href="{{ route('admin.organizers.show', ['locale' => $locale, 'organizer' => $membership->organizer_id]) }}">{{ $membership->organizer?->name }}</a>
                                <span class="text-muted">({{ $membership->role->label() }})</span>@if(! $loop->last), @endif
                            @endforeach
                        </p>
                    @endif
                </div>
            </div>

            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Recent registrations') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm mb-0">
                            <thead>
                            <tr><th>{{ __('Event') }}</th><th>{{ __('Starts') }}</th><th>{{ __('Status') }}</th></tr>
                            </thead>
                            <tbody>
                            @forelse($recentRegistrations as $registration)
                                <tr>
                                    <td>
                                        @if($registration->event)
                                            <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $registration->event_id]) }}">{{ $registration->event->title }}</a>
                                        @else
                                            —
                                        @endif
                                    </td>
                                    <td class="small">{{ $registration->event?->starts_at?->copy()->setTimezone($registration->event->timezone)->format('Y-m-d H:i') }}</td>
                                    <td><span class="badge bg-secondary">{{ $registration->status->value }}</span></td>
                                </tr>
                            @empty
                                <tr><td colspan="3" class="text-muted">{{ __('No registrations yet.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card card-default">
                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">{{ __('Orders') }}</h2>
                    <a class="btn btn-sm btn-secondary" href="{{ route('admin.billing.orders', ['locale' => $locale, 'user' => $user->id]) }}">{{ __('All') }}</a>
                </div>
                <div class="card-body">
                    <table class="table table-sm mb-0">
                        <tbody>
                        @forelse($recentOrders as $order)
                            <tr>
                                <td><a href="{{ route('admin.billing.orders.show', ['locale' => $locale, 'id' => $order->id]) }}"><code>{{ $order->order_number }}</code></a></td>
                                <td class="small">{{ $order->type?->value }}</td>
                                <td class="small text-end">{{ \App\Support\Money::format((int) ($order->amount_minor ?? 0), strtoupper($order->currency ?: 'USD')) }}</td>
                                <td class="small">{{ $order->payment_status }}</td>
                            </tr>
                        @empty
                            <tr><td class="text-muted">{{ __('No orders.') }}</td></tr>
                        @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            @if($user->subscriptions->isNotEmpty())
                <div class="card card-default">
                    <div class="card-header card-header-border-bottom"><h2>{{ __('Subscriptions') }}</h2></div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-sm mb-0">
                                <tbody>
                                @foreach($user->subscriptions as $sub)
                                    <tr>
                                        <td>{{ $sub->plan?->name ?? $sub->plan_id }}</td>
                                        <td>{{ $sub->status }}</td>
                                        <td class="small">
                                            {{ $sub->current_period_start?->format('Y-m-d') }} &rarr;
                                            {{ $sub->current_period_end?->format('Y-m-d') }}
                                        </td>
                                    </tr>
                                @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            @endif

            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Support tickets') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm mb-0">
                            <tbody>
                            @forelse($tickets as $ticket)
                                <tr>
                                    <td>{{ $ticket->subject }}</td>
                                    <td class="small">{{ $ticket->status }}</td>
                                    <td class="small text-muted">{{ $ticket->created_at?->format('Y-m-d') }}</td>
                                </tr>
                            @empty
                                <tr><td class="text-muted">{{ __('No tickets.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
