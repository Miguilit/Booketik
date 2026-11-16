@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $amountMinor = (int) ($order->amount_minor ?? \App\Support\Money::toMinor($order->amount, $order->currency ?: 'USD'));
        $providerName = $isWeb ? $webLabel : ($gateway?->displayName() ?? $order->payment_provider);
    @endphp

    @include('admin.partials.flash')

    @if($order->payment_status === 'paid' && ! $order->is_delivered)
        {{-- Money taken, nothing handed over. Almost always a webhook that never
             arrived; for a regional gateway, almost always fixed by Re-check. --}}
        <div class="alert alert-danger">
            <strong>{{ __('Paid but not delivered.') }}</strong>
            @if($gateway)
                {!! __('Try :action.', ['action' => '<em>'.e(__('Re-check with gateway')).'</em>']) !!}
            @endif
        </div>
    @endif

    <div class="row">
        <div class="col-lg-6">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">{{ $order->order_number }}</h2>
                    <div>
                        {{-- Re-check is the regional gateways' (Midtrans, Duitku)
                             only: `$gateway` is null for store and web card orders. It is
                             idempotent — the same delivery guard and amount check the
                             webhook runs — so pressing it twice cannot pay twice. --}}
                        @if($gateway && auth()->user()?->isAdmin())
                            <x-admin.destructive-form :action="route('admin.billing.orders.recheck', ['locale' => $locale, 'id' => $order->id])"
                                method="POST"
                                :confirm="false"
                                class="btn btn-sm btn-secondary">{{ __('Re-check with gateway') }}</x-admin.destructive-form>
                        @endif
                        @if($hasInvoice)
                            {{-- The provider's own document, same as the member sees in their
                                 history. Opened in a tab because it leaves this site. --}}
                            <a class="btn btn-sm btn-primary" target="_blank" rel="noopener"
                               href="{{ route('admin.billing.orders.invoice', ['locale' => $locale, 'id' => $order->id]) }}">{{ __('Open invoice') }}</a>
                        @endif
                    </div>
                </div>
                <div class="card-body">
                    <dl class="row mb-0">
                        <dt class="col-5">{{ __('Member') }}</dt>
                        <dd class="col-7">
                            <a href="{{ route('admin.user.show', ['locale' => $locale, 'id' => $order->user_id]) }}">
                                {{ $order->user?->email ?: '#'.$order->user_id }}
                            </a>
                        </dd>
                        @if($order->type === \App\Enums\OrderType::Tickets)
                            <dt class="col-5">{{ __('Event') }}</dt>
                            <dd class="col-7">
                                @if($order->event)
                                    <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $order->event_id]) }}">{{ $order->event->title }}</a>
                                @else
                                    —
                                @endif
                            </dd>
                            <dt class="col-5">{{ __('Tickets') }}</dt>
                            <dd class="col-7">
                                @forelse($order->items as $item)
                                    <div class="small">{{ $item->qty }} × {{ $item->ticketType?->name ?? __('tier') }}
                                        · {{ \App\Support\Money::format((int) $item->unit_price_cents, strtoupper($order->currency ?: 'EUR')) }}</div>
                                @empty
                                    —
                                @endforelse
                            </dd>
                            <dt class="col-5">{{ __('Fees') }}</dt>
                            <dd class="col-7">{{ \App\Support\Money::format((int) $order->fees_cents, strtoupper($order->currency ?: 'EUR')) }}
                                <span class="small text-muted">· {{ __('platform :amount', ['amount' => \App\Support\Money::format((int) $order->platform_fee_cents, strtoupper($order->currency ?: 'EUR'))]) }}</span></dd>
                        @else
                            <dt class="col-5">{{ __('Plan') }}</dt>
                            <dd class="col-7">{{ $order->plan?->name ?? '—' }}</dd>
                        @endif
                        <dt class="col-5">{{ __('Type') }}</dt>
                        <dd class="col-7">{{ $order->type?->value }}</dd>
                        <dt class="col-5">{{ __('Amount') }}</dt>
                        <dd class="col-7">
                            {{ \App\Support\Money::format($amountMinor, strtoupper($order->currency ?: 'USD')) }}
                            @if($order->base_amount_minor !== null && $order->base_currency !== $order->currency)
                                {{-- What this order contributes to revenue, fixed at capture. --}}
                                <div class="small text-muted">
                                    {{ \App\Support\Money::format((int) $order->base_amount_minor, $order->base_currency) }}
                                    {{ __('at :rate', ['rate' => rtrim(rtrim((string) $order->fx_rate_used, '0'), '.')]) }}
                                </div>
                            @endif
                        </dd>
                        <dt class="col-5">{{ __('Payment status') }}</dt>
                        <dd class="col-7">
                            {{ $order->payment_status }}
                            @unless($order->is_delivered)
                                <span class="badge badge-secondary">{{ __('not delivered') }}</span>
                            @endunless
                        </dd>
                        <dt class="col-5">{{ __('Provider') }}</dt>
                        <dd class="col-7">
                            {{ $providerName }}
                            @if($order->provider_channel)
                                <span class="small text-muted">· {{ $order->provider_channel }}</span>
                            @endif
                        </dd>
                        <dt class="col-5">{{ __('Transaction id') }}</dt>
                        <dd class="col-7" style="word-break:break-all"><code>{{ $order->provider_reference ?? $order->revenuecat_transaction_id ?? '—' }}</code></dd>
                        @if($order->provider_payment_id)
                            <dt class="col-5">{{ __('Payment id') }}</dt>
                            <dd class="col-7" style="word-break:break-all"><code>{{ $order->provider_payment_id }}</code></dd>
                        @endif
                        <dt class="col-5">{{ __('Event id') }}</dt>
                        <dd class="col-7"><code>{{ $order->revenuecat_event_id ?? '—' }}</code></dd>
                        <dt class="col-5">{{ __('Created') }}</dt>
                        <dd class="col-7">{{ $order->created_at?->format('Y-m-d H:i:s') }}</dd>
                        @if($order->expires_at)
                            <dt class="col-5">{{ __('Payment code expires') }}</dt>
                            <dd class="col-7">
                                {{ $order->expires_at->format('Y-m-d H:i:s') }}
                                @if($order->expires_at->isPast())
                                    <span class="badge badge-secondary">{{ __('expired') }}</span>
                                @endif
                            </dd>
                        @endif
                        <dt class="col-5">{{ __('Invoice') }}</dt>
                        <dd class="col-7">
                            @if($hasInvoice)
                                <a target="_blank" rel="noopener"
                                   href="{{ route('admin.billing.orders.invoice', ['locale' => $locale, 'id' => $order->id]) }}">
                                    {{ $order->type === \App\Enums\OrderType::Tickets ? __(':provider receipt', ['provider' => $webLabel]) : __(':provider invoice', ['provider' => $webLabel]) }}
                                </a>
                            @else
                                <span class="text-muted">{{ $providerName ? __('none from :provider', ['provider' => $providerName]) : __('none from this provider') }}</span>
                            @endif
                        </dd>
                        <dt class="col-5">{{ __('Belongs to') }}</dt>
                        <dd class="col-7">
                            @if($source instanceof \App\Models\Subscription)
                                <a href="{{ route('admin.billing.subscriptions', ['locale' => $locale, 'plan' => $source->subscription_plan_id]) }}">
                                    {{ __('Subscription #:id', ['id' => $source->id]) }}
                                </a>
                                <span class="small text-muted">· {{ $source->status }}</span>
                            @elseif($order->type === \App\Enums\OrderType::Tickets && $order->event_id)
                                <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $order->event_id]) }}">
                                    {{ $order->event?->title ?? __('Event') }}
                                </a>
                            @elseif($order->subscription_plan_id)
                                <a href="{{ route('admin.billing.subscriptions', ['locale' => $locale, 'plan' => $order->subscription_plan_id]) }}">
                                    {{ $order->plan?->name ?? __('Plan') }} #{{ $order->subscription_plan_id }}
                                </a>
                            @else
                                <span class="text-muted">{{ __('nothing found for this reference') }}</span>
                            @endif
                        </dd>
                    </dl>
                </div>
            </div>
        </div>

        <div class="col-lg-6">
            {{-- The webhook body verbatim. When a purchase did not land as
                 expected, this is the only record of what the provider actually said. --}}
            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Raw webhook event') }}</h2></div>
                <div class="card-body">
                    <pre class="small mb-0" style="max-height:520px;overflow:auto;">{{ json_encode($order->raw_event, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
                </div>
            </div>
        </div>
    </div>
@endsection
