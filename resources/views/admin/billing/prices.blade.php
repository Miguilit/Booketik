@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $money = fn ($minor, $currency) => \App\Support\Money::format((int) $minor, strtoupper($currency ?: 'USD'));
    @endphp

    @include('admin.partials.flash')

    {{-- Each plan's price in every active currency. The plan itself — name,
         interval, fallback price, where it is sold — is edited on Plans & products. --}}
    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <h2 class="mb-0">{{ __('Prices by currency') }}</h2>
            <a class="btn btn-sm btn-secondary"
               href="{{ route('admin.billing.catalogue', ['locale' => $locale]) }}">{{ __('Plans & products') }}</a>
        </div>

        <div class="card-body">
            @forelse($plans as $plan)
                {{-- Anchored so Plans & products can link straight to a plan. --}}
                <div id="plan-{{ $plan->id }}" class="mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>{{ $plan->name }}</strong>
                            <span class="small text-muted"><code>{{ $plan->slug }}</code> · {{ $plan->interval }}</span>
                        </div>
                        <span class="small text-muted">{{ __('fallback :price', ['price' => $money($plan->price_cents, $plan->currency)]) }}</span>
                    </div>

                    @include('admin.partials.price-matrix', [
                        'product' => $plan,
                        'type' => 'subscription-plan',
                        'currencies' => $currencies,
                    ])
                </div>
            @empty
                <p class="text-muted mb-0">{{ __('No plans yet.') }}</p>
            @endforelse
        </div>
    </div>
@endsection
