@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $money = fn ($minor, $currency) => \App\Support\Money::format((int) $minor, strtoupper($currency ?: 'USD'));
        $statusLabels = ['paid' => __('Paid'), 'pending' => __('Pending'), 'refunded' => __('Refunded'), 'failed' => __('Failed')];
        $typeLabels = ['tickets' => __('Tickets'), 'organizer_plan' => __('Organizer plan'), 'plus' => 'Plus'];
    @endphp

    @include('admin.partials.flash')

    {{-- Totalled in the reporting currency, not in `amount`: adding rupiah to
         dollars produces a number that is not money. See BillingController::revenue(). --}}
    <div class="row">
        <div class="col-md-6">
            <div class="card card-default">
                <div class="card-body">
                    <div class="text-muted text-uppercase small">{{ __('Revenue this month') }}</div>
                    <h3 class="mb-0">{{ $money($revenue['month'], $revenue['base']) }}</h3>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card card-default">
                <div class="card-body">
                    <div class="text-muted text-uppercase small">{{ __('Revenue all time') }}</div>
                    <h3 class="mb-0">{{ $money($revenue['all_time'], $revenue['base']) }}</h3>
                    @if($revenue['unconverted'] > 0)
                        <div class="small text-muted">{{ __('excludes :count unconverted order(s)', ['count' => $revenue['unconverted']]) }}</div>
                    @endif
                    @if($undelivered > 0)
                        {{-- Money taken, nothing handed over: somebody is out of pocket. --}}
                        <a class="small text-danger"
                           href="{{ route('admin.billing.orders', ['locale' => $locale, 'payment_status' => 'undelivered']) }}">
                            {{ __(':count paid but not delivered', ['count' => $undelivered]) }}
                        </a>
                    @endif
                </div>
            </div>
        </div>
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom"><h2>{{ __('Orders') }}</h2></div>
        <div class="card-body">
            <form method="GET" class="row g-2 mb-4">
                <div class="col-md-4">
                    <input type="text" name="search" class="form-control" placeholder="{{ __('Order number or transaction id') }}"
                           value="{{ $filters['search'] ?? '' }}">
                </div>
                <div class="col-md-3">
                    <select name="payment_status" class="form-control">
                        <option value="">{{ __('Any status') }}</option>
                        @foreach(['paid', 'pending', 'refunded', 'failed'] as $status)
                            <option value="{{ $status }}" @selected(($filters['payment_status'] ?? '') === $status)>{{ $statusLabels[$status] ?? ucfirst($status) }}</option>
                        @endforeach
                        <option value="undelivered" @selected(($filters['payment_status'] ?? '') === 'undelivered')>{{ __('Paid, not delivered') }}</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="type" class="form-control">
                        <option value="">{{ __('Any type') }}</option>
                        @foreach($types as $type)
                            <option value="{{ $type->value }}" @selected(($filters['type'] ?? '') === $type->value)>{{ $typeLabels[$type->value] ?? Str::headline($type->value) }}</option>
                        @endforeach
                    </select>
                </div>
                @if(! empty($filters['event']))
                    <input type="hidden" name="event" value="{{ $filters['event'] }}">
                @endif
                @if(! empty($filters['user']))
                    {{-- Kept from the Subscriptions row menu's "Their transactions". --}}
                    <input type="hidden" name="user" value="{{ $filters['user'] }}">
                @endif
                <div class="col-md-2">
                    <button class="btn btn-secondary w-100">{{ __('Filter') }}</button>
                </div>
            </form>

            <table class="table">
                <thead>
                <tr>
                    <th>{{ __('Order') }}</th>
                    <th>{{ __('Member') }}</th>
                    <th>{{ __('Type') }}</th>
                    <th class="text-right">{{ __('Amount') }}</th>
                    <th>{{ __('Status') }}</th>
                    <th>{{ __('When') }}</th>
                    <x-row-actions-header />
                </tr>
                </thead>
                <tbody>
                @forelse($orders as $order)
                    <tr>
                        <td><code>{{ $order->order_number }}</code></td>
                        <td>
                            <a href="{{ route('admin.user.show', ['locale' => $locale, 'id' => $order->user_id]) }}">
                                {{ $order->user?->email ?: '#'.$order->user_id }}
                            </a>
                        </td>
                        <td class="small text-muted">
                            {{ $order->type?->value }}
                            @if($order->event)
                                <div><a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $order->event_id]) }}">{{ Str::limit($order->event->title, 32) }}</a></div>
                            @elseif($order->plan)
                                <div>{{ $order->plan->name }}</div>
                            @endif
                        </td>
                        <td class="text-right">
                            {{ $money($order->amount_minor ?? \App\Support\Money::toMinor($order->amount, $order->currency ?: 'USD'), $order->currency) }}
                        </td>
                        <td>
                            <span class="badge badge-{{ match($order->payment_status) {
                                'paid' => 'success', 'refunded' => 'danger', 'failed' => 'danger', default => 'secondary'
                            } }}">{{ $order->payment_status }}</span>
                            @if($order->payment_status === 'paid' && ! $order->is_delivered)
                                <span class="badge badge-danger">{{ __('not delivered') }}</span>
                            @endif
                        </td>
                        <td class="small">{{ $order->created_at?->format('Y-m-d H:i') }}</td>
                        {{-- Read-only: an order is what a provider already charged. Correcting
                             one is a refund at the provider, not an edit here. --}}
                        <td class="row-actions-col">
                            <x-row-actions>
                                <x-row-action icon="receipt"
                                              :href="route('admin.billing.orders.show', ['locale' => $locale, 'id' => $order->id])">{{ __('View order') }}</x-row-action>
                                {{-- Straight to the provider's document, for "send me my
                                     receipt" — only the web card providers issue one. --}}
                                @if(isset($webProviders[$order->payment_provider]))
                                    <x-row-action icon="file-document-outline" target="_blank"
                                                  :href="route('admin.billing.orders.invoice', ['locale' => $locale, 'id' => $order->id])">{{ __('Open invoice') }}</x-row-action>
                                @endif
                                <x-row-action icon="account-outline"
                                              :href="route('admin.user.show', ['locale' => $locale, 'id' => $order->user_id])">{{ __('View member') }}</x-row-action>
                            </x-row-actions>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="text-muted">{{ __('No transactions yet.') }}</td></tr>
                @endforelse
                </tbody>
            </table>

            {{ $orders->links() }}
        </div>
    </div>
@endsection
