@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $statusLabels = [
            'active' => __('Active'), 'cancelling' => __('Cancelling'), 'expired' => __('Expired'),
            'refunded' => __('Refunded'), 'trialing' => __('Trialing'),
        ];
    @endphp

    @include('admin.partials.flash')

    <div class="row">
        @foreach(['active' => 'success', 'cancelling' => 'warning', 'expired' => 'secondary', 'refunded' => 'danger'] as $key => $tone)
            <div class="col-md-3">
                <div class="card card-default">
                    <div class="card-body">
                        <div class="text-muted text-uppercase small">{{ $statusLabels[$key] ?? ucfirst($key) }}</div>
                        <h3 class="mb-0 text-{{ $tone }}">{{ number_format($summary[$key]) }}</h3>
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom">
            <h2>{{ __('Subscriptions') }}</h2>
        </div>
        <div class="card-body">
            {{-- Mirrors RevenueCat and the web card providers. Editing our copy
                 would only make the two disagree, so this screen is read-only. --}}
            {{-- Written by the RevenueCat webhook (app stores) and the web card
                 providers' webhooks (store `web`). To change someone's access,
                 use the Plus toggle on their member page. --}}

            <form method="GET" class="row g-2 mb-4">
                <div class="col-md-4">
                    <input type="text" name="search" class="form-control" placeholder="{{ __('Member name or email') }}"
                           value="{{ $filters['search'] ?? '' }}">
                </div>
                <div class="col-md-3">
                    <select name="status" class="form-control">
                        <option value="">{{ __('Any status') }}</option>
                        @foreach(['active', 'trialing', 'expired', 'refunded'] as $status)
                            <option value="{{ $status }}" @selected(($filters['status'] ?? '') === $status)>{{ $statusLabels[$status] ?? ucfirst($status) }}</option>
                        @endforeach
                    </select>
                </div>
                {{-- Kept from the links that land here: a plan's Members, a web order. --}}
                @foreach(['plan', 'store'] as $kept)
                    @if(! empty($filters[$kept]))
                        <input type="hidden" name="{{ $kept }}" value="{{ $filters[$kept] }}">
                    @endif
                @endforeach
                <div class="col-md-2">
                    <button class="btn btn-secondary w-100">{{ __('Filter') }}</button>
                </div>
            </form>

            <table class="table">
                <thead>
                <tr>
                    <th>{{ __('Member') }}</th>
                    <th>{{ __('Product') }}</th>
                    <th>{{ __('Status') }}</th>
                    <th>{{ __('Period') }}</th>
                    <th>{{ __('Store') }}</th>
                    <th>{{ __('Transaction') }}</th>
                    <x-row-actions-header />
                </tr>
                </thead>
                <tbody>
                @forelse($subscriptions as $sub)
                    <tr>
                        <td>
                            <a href="{{ route('admin.user.show', ['locale' => $locale, 'id' => $sub->user_id]) }}">
                                {{ $sub->user?->name ?: __('Guest') }}
                            </a>
                            <div class="small text-muted">{{ $sub->user?->email ?: '#'.$sub->user_id }}</div>
                        </td>
                        <td><code>{{ $sub->plan_id ?: ($sub->plan?->slug ?? '—') }}</code></td>
                        <td>
                            <span class="badge badge-{{ in_array($sub->status, ['active', 'trialing']) ? 'success' : 'secondary' }}">
                                {{ $sub->status }}
                            </span>
                            @if($sub->cancel_at_period_end)
                                <span class="badge badge-warning">{{ __('cancelling') }}</span>
                            @endif
                        </td>
                        <td class="small">
                            {{ $sub->current_period_start?->format('Y-m-d') }}
                            &rarr;
                            {{ $sub->current_period_end?->format('Y-m-d') }}
                        </td>
                        <td class="small text-muted">
                            {{ $sub->store ?? '—' }}
                            @if($sub->store === 'web')
                                · {{ $webProviders[$sub->payment_provider] ?? $sub->payment_provider }}
                            @endif
                            {{ $sub->environment === 'sandbox' ? __('(sandbox)') : '' }}
                        </td>
                        <td class="small text-muted"><code>{{ Str::limit($sub->revenuecat_transaction_id, 24) }}</code></td>
                        {{-- Read-only: the provider's webhook owns every field on this row.
                             Editing one here would be overwritten by the next event. --}}
                        <td class="row-actions-col">
                            <x-row-actions>
                                <x-row-action icon="account-outline"
                                              :href="route('admin.user.show', ['locale' => $locale, 'id' => $sub->user_id])">{{ __('View member') }}</x-row-action>
                                <x-row-action icon="receipt"
                                              :href="route('admin.billing.orders', ['locale' => $locale, 'user' => $sub->user_id])">{{ __('Their transactions') }}</x-row-action>
                                {{-- Only when the provider can produce one; checked locally, no API call. --}}
                                @if($sub->store === 'web' && $portal->hasInvoice($sub))
                                    <x-row-action icon="file-document-outline" target="_blank"
                                                  :href="route('admin.billing.subscriptions.invoice', ['locale' => $locale, 'id' => $sub->id])">{{ __('Open invoice') }}</x-row-action>
                                @endif
                            </x-row-actions>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="text-muted">{{ __('No subscriptions yet.') }}</td></tr>
                @endforelse
                </tbody>
            </table>

            {{ $subscriptions->links() }}
        </div>
    </div>
@endsection
