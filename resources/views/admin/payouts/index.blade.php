@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $S = \App\Enums\PayoutStatus::class;
        $statusLabels = [
            'requested' => __('Requested'), 'approved' => __('Approved'), 'rejected' => __('Rejected'),
            'processing' => __('Processing'), 'paid' => __('Paid'), 'failed' => __('Failed'),
        ];
        $label = function ($status) use ($statusLabels) {
            $value = $status instanceof \BackedEnum ? $status->value : (string) $status;

            return $statusLabels[$value] ?? \Illuminate\Support\Str::headline($value);
        };
        $methodLabels = ['bank_transfer' => __('bank transfer'), 'ewallet' => __('ewallet'), 'manual' => __('manual'), 'stripe' => 'Stripe'];
        $method = fn ($payout) => $methodLabels[(string) $payout->method] ?? str_replace('_', ' ', (string) $payout->method);
        $isFinal = fn ($payout) => in_array($payout->status, [$S::Paid, $S::Rejected], true);

        // Which drawer to reopen after a validation error. Every drawer form
        // posts its own id as `_drawer`, and a failed validation flashes it
        // back with the rest of the input.
        $reopen = old('_drawer');

        // The typed value is only put back into the drawer it was typed in —
        // otherwise a failed reference on one payout would pre-fill every row.
        $oldFor = fn (string $drawer, string $field) => $reopen === $drawer ? old($field) : null;

        $settleable = [$S::Approved, $S::Processing, $S::Failed];

        $chip = fn ($value) => $status === $value
            ? 'btn btn-sm btn-primary'
            : 'btn btn-sm btn-outline-secondary';
    @endphp
    @include('admin.partials.flash')

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h2>{{ __('Payouts') }}</h2>
            <div class="d-flex align-items-center flex-wrap gap-2">
                <span class="text-muted small">
                    {{ __(':count waiting', ['count' => $counts['requested']]) }} ·
                    {{ __(':count approved, not yet sent', ['count' => $counts['approved']]) }}
                    @if($counts['failed'] > 0) · <span class="text-danger">{{ __(':count failed', ['count' => $counts['failed']]) }}</span> @endif
                </span>

                {{-- The export is the operator's actual workflow: approve a
                     batch, download it, make the transfers, come back and
                     mark them. --}}
                <a href="{{ route('admin.payouts.export', ['locale' => $locale]) }}"
                   class="btn btn-outline-secondary btn-sm">{{ __('Export approved (CSV)') }}</a>

            </div>
        </div>
        <div class="card-body">
            {{-- Status filter as chips: the statuses are the whole navigation of
                 this screen, and a dropdown hides that filtering is possible. --}}
            <div class="mb-3 d-flex flex-wrap gap-1">
                <a href="{{ request()->fullUrlWithQuery(['status' => 'all', 'page' => null]) }}" class="{{ $chip('all') }}">{{ __('Everything') }}</a>
                @foreach($statuses as $option)
                    <a href="{{ request()->fullUrlWithQuery(['status' => $option->value, 'page' => null]) }}" class="{{ $chip($option->value) }}">
                        {{ $label($option) }}
                        @if(($counts[$option->value] ?? 0) > 0)
                            <span class="badge {{ $option === $S::Failed ? 'bg-danger' : 'bg-warning text-dark' }} ms-1">{{ $counts[$option->value] }}</span>
                        @endif
                    </a>
                @endforeach
            </div>

            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead>
                    <tr>
                        <th>{{ __('Organizer') }}</th>
                        <th class="text-end">{{ __('Amount') }}</th>
                        <th class="d-none d-lg-table-cell">{{ __('Balance') }}</th>
                        <th>{{ __('Status') }}</th>
                        <th>{{ __('Reference') }}</th>
                        <x-row-actions-header />
                    </tr>
                    </thead>
                    <tbody>
                    @forelse($payouts as $payout)
                        @php $balance = $balances[$payout->organizer_id] ?? null; @endphp
                        <tr>
                            <td class="cl-wrap">
                                <strong>{{ $payout->organizer?->name }}</strong>
                                <div class="small text-muted">{{ $payout->organizer?->contact_email }}</div>
                                <div class="small text-muted">
                                    {{ __('requested :time', ['time' => $payout->requested_at?->diffForHumans()]) }}
                                    · {{ __('via :method', ['method' => $method($payout)]) }}
                                </div>
                            </td>
                            <td class="text-end text-nowrap">
                                <strong>{{ \App\Support\Money::format((int) $payout->net_minor, $payout->currency) }}</strong>
                                <div class="small text-muted">
                                    {{ __(':amount gross', ['amount' => \App\Support\Money::format((int) $payout->amount_minor, $payout->currency)]) }}
                                    @if($payout->tax_minor)
                                        − {{ __(':amount tax', ['amount' => \App\Support\Money::format((int) $payout->tax_minor, $payout->currency)]) }}
                                    @endif
                                </div>
                            </td>
                            {{-- Their balance beside their request, so a request
                                 that looks wrong is visible without opening
                                 another screen. --}}
                            <td class="small text-muted d-none d-lg-table-cell">
                                @if($balance)
                                    {{ __(':amount available', ['amount' => \App\Support\Money::format((int) $balance['available'], $balance['currency'])]) }}
                                    <div>{{ __(':amount pending', ['amount' => \App\Support\Money::format((int) $balance['pending'], $balance['currency'])]) }}</div>
                                @else
                                    —
                                @endif
                            </td>
                            <td class="cl-wrap">
                                <span class="badge {{ match($payout->status) {
                                    $S::Paid => 'bg-success',
                                    $S::Rejected, $S::Failed => 'bg-danger',
                                    $S::Requested => 'bg-warning text-dark',
                                    default => 'bg-secondary',
                                } }}">{{ $label($payout->status) }}</span>
                                @if($payout->reject_reason)
                                    <div class="small text-muted"><strong>{{ __('Declined:') }}</strong> {{ $payout->reject_reason }}</div>
                                @endif
                                @if($payout->notes)
                                    <div class="small text-muted"><strong>{{ __('Note:') }}</strong> {{ $payout->notes }}</div>
                                @endif
                            </td>
                            <td class="small text-muted">
                                {{ $payout->reference ?? '—' }}
                                @if($payout->reviewer)
                                    <div>{{ __('reviewed by :name', ['name' => $payout->reviewer->name]) }}</div>
                                @endif
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    @if($payout->status === $S::Requested)
                                        <x-row-action-form method="POST" icon="check" tone="success"
                                                           :action="route('admin.payouts.approve', ['locale' => $locale, 'payout' => $payout->id])"
                                                           :confirm="__('Approve this payout?')">{{ __('Approve') }}</x-row-action-form>
                                    @endif

                                    @if(in_array($payout->status, $settleable, true))
                                        <a href="#" class="row-actions-item" role="menuitem" data-drawer="#payout-{{ $payout->id }}">
                                            <i class="mdi mdi-cash-check" aria-hidden="true"></i>
                                            <span>{{ __('Settle payout') }}</span>
                                        </a>
                                    @endif

                                    <x-row-action icon="account-group"
                                                  :href="route('admin.organizers.show', ['locale' => $locale, 'organizer' => $payout->organizer_id])">{{ __('Organizer') }}</x-row-action>

                                    @if(! $isFinal($payout))
                                        <x-row-actions-divider />
                                        <a href="#" class="row-actions-item is-danger" role="menuitem" data-drawer="#payout-decline-{{ $payout->id }}">
                                            <i class="mdi mdi-close-circle-outline" aria-hidden="true"></i>
                                            <span>{{ __('Decline') }}</span>
                                        </a>
                                    @endif
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="6" class="text-muted">{{ __('Nothing here.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>

            {{ $payouts->links('pagination::bootstrap-4') }}
        </div>
    </div>

    {{-- Settling one payout.
         A reference is required for "paid": the money left by hand, and "paid"
         with nothing to point at is a claim rather than a record. A failed
         transfer needs what the bank said for the same reason. --}}
    @foreach($payouts as $payout)
        @continue(! in_array($payout->status, $settleable, true))
        @php $drawer = 'payout-'.$payout->id; @endphp
        <x-drawer :id="$drawer"
                  :title="$payout->organizer?->name ?: __('Organizer')"
                  :subtitle="__(':amount net · via :method', ['amount' => \App\Support\Money::format((int) $payout->net_minor, $payout->currency), 'method' => $method($payout)])"
                  :autoopen="$reopen === $drawer">
            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Payout') }}</div>
                <div class="small">
                    <div>{{ $label($payout->status) }}</div>
                    <div class="text-muted">
                        {{ __(':amount gross', ['amount' => \App\Support\Money::format((int) $payout->amount_minor, $payout->currency)]) }}
                        @if($payout->tax_minor)
                            − {{ __(':amount tax', ['amount' => \App\Support\Money::format((int) $payout->tax_minor, $payout->currency)]) }}
                        @endif
                    </div>
                    <div class="text-muted">{{ __('Account details are in the CSV export.') }}</div>
                </div>
            </div>

            <form method="POST" action="{{ route('admin.payouts.paid', ['locale' => $locale, 'payout' => $payout->id]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="{{ $drawer }}">
                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Mark paid') }}</div>
                    <div class="mb-3">
                        <label class="form-label small" for="reference_{{ $payout->id }}">{{ __('Bank reference') }}</label>
                        <input type="text" class="form-control @if($reopen === $drawer) @error('reference') is-invalid @enderror @endif"
                               id="reference_{{ $payout->id }}" name="reference" required
                               value="{{ $oldFor($drawer, 'reference') }}" placeholder="{{ __('Bank reference') }}">
                        @if($reopen === $drawer)
                            @error('reference')<div class="invalid-feedback">{{ $message }}</div>@enderror
                        @endif
                    </div>
                    <button class="btn btn-sm btn-primary">{{ __('Mark paid') }}</button>
                </div>
            </form>

            <form method="POST" action="{{ route('admin.payouts.failed', ['locale' => $locale, 'payout' => $payout->id]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="{{ $drawer }}">
                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Mark failed') }}</div>
                    <div class="mb-3">
                        <label class="form-label small" for="notes_{{ $payout->id }}">{{ __('What the bank said') }}</label>
                        <input type="text" class="form-control @if($reopen === $drawer) @error('notes') is-invalid @enderror @endif"
                               id="notes_{{ $payout->id }}" name="notes" minlength="5" required
                               value="{{ $oldFor($drawer, 'notes') }}" placeholder="{{ __('What the bank said') }}">
                        @if($reopen === $drawer)
                            @error('notes')<div class="invalid-feedback">{{ $message }}</div>@enderror
                        @endif
                    </div>
                    <button class="btn btn-sm btn-outline-warning">{{ __('Mark failed') }}</button>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Close') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach

    {{-- Declining one payout. The organizer is shown the reason; a decline with
         no reason produces an identical request tomorrow. --}}
    @foreach($payouts as $payout)
        @continue($isFinal($payout))
        @php $drawer = 'payout-decline-'.$payout->id; @endphp
        <x-drawer :id="$drawer"
                  :title="__('Decline — :organizer', ['organizer' => $payout->organizer?->name ?: __('Organizer')])"
                  :subtitle="__(':amount net · :status', ['amount' => \App\Support\Money::format((int) $payout->net_minor, $payout->currency), 'status' => $label($payout->status)])"
                  :autoopen="$reopen === $drawer">
            <form id="{{ $drawer }}-form" method="POST"
                  action="{{ route('admin.payouts.reject', ['locale' => $locale, 'payout' => $payout->id]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="{{ $drawer }}">
                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Decline') }}</div>
                    <label class="form-label small" for="reject_reason_{{ $payout->id }}">{{ __('Reason') }}</label>
                    <textarea class="form-control @if($reopen === $drawer) @error('reject_reason') is-invalid @enderror @endif"
                              id="reject_reason_{{ $payout->id }}" name="reject_reason" rows="3"
                              minlength="5" required placeholder="{{ __('Shown to the organizer') }}">{{ $oldFor($drawer, 'reject_reason') }}</textarea>
                    @if($reopen === $drawer)
                        @error('reject_reason')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    @endif
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button type="submit" form="{{ $drawer }}-form" class="btn btn-sm btn-outline-danger">{{ __('Decline') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach
@endsection
