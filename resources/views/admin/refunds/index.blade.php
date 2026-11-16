@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $money = fn (int $minor, string $currency) => \App\Support\Money::format($minor, $currency);
        $statusLabels = ['requested' => __('Requested'), 'refunded' => __('Refunded'), 'rejected' => __('Rejected'), 'all' => __('All')];
    @endphp
    @include('admin.partials.flash')

    <div class="card card-default mb-4">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h2>{{ __('Refund requests') }}</h2>
            <div class="d-flex gap-2">
                @foreach(['requested', 'refunded', 'rejected', 'all'] as $s)
                    <a href="{{ route('admin.refunds.index', ['locale' => $locale, 'status' => $s]) }}"
                       class="btn btn-sm {{ $status === $s ? 'btn-primary' : 'btn-outline-secondary' }}">{{ $statusLabels[$s] ?? ucfirst($s) }}</a>
                @endforeach
            </div>
        </div>
        <div class="card-body">
            <p class="text-muted small">{{ __('Organizers decide their own guests\' requests in organizer mode; act here only to step in.') }}
                {!! __('Whether the fee comes back follows :link.', ['link' => '<a href="'.e(route('admin.fees.edit', ['locale' => $locale])).'">'.e(__('the fee settings')).'</a>']) !!}</p>
            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead><tr><th>{{ __('Requested') }}</th><th>{{ __('Event') }}</th><th>{{ __('Guest') }}</th><th>{{ __('Ticket') }}</th><th>{{ __('Paid') }}</th><th>{{ __('Reason') }}</th><th>{{ __('Status') }}</th><th></th></tr></thead>
                    <tbody>
                    @forelse($requests as $r)
                        @php($item = $r->ticket?->orderItem)
                        <tr>
                            <td class="small">{{ $r->created_at?->diffForHumans() }}</td>
                            <td>{{ $r->event?->title }}<div class="small text-muted">{{ $r->event?->organizer?->name }}</div></td>
                            <td>{{ $r->user?->name }}<div class="small text-muted">{{ $r->user?->email }}</div></td>
                            <td><code>{{ $r->ticket?->code }}</code></td>
                            <td>{{ $item ? $money((int) $item->unit_price_cents + (int) $item->unit_fee_cents, (string) ($item->order?->currency ?? 'EUR')) : '—' }}</td>
                            <td class="small">{{ $r->reason }}</td>
                            <td><span class="badge bg-light text-dark">{{ $statusLabels[$r->status] ?? $r->status }}</span></td>
                            <td class="text-end">
                                @if($r->status === 'requested')
                                    <form method="POST" class="d-inline-flex gap-1" action="{{ route('admin.refunds.approve', ['locale' => $locale, 'id' => $r->id]) }}">
                                        @csrf
                                        <input type="number" step="0.01" min="0.01" name="amount" class="form-control form-control-sm" style="width:7rem" placeholder="{{ __('Full') }}">
                                        <button class="btn btn-sm btn-success">{{ __('Refund') }}</button>
                                    </form>
                                    <form method="POST" class="d-inline-flex gap-1 mt-1" action="{{ route('admin.refunds.reject', ['locale' => $locale, 'id' => $r->id]) }}">
                                        @csrf
                                        <input type="text" name="note" class="form-control form-control-sm" placeholder="{{ __('Reason shown to the guest') }}" required minlength="3">
                                        <button class="btn btn-sm btn-outline-danger">{{ __('Decline') }}</button>
                                    </form>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="8" class="text-muted">{{ __('Nothing here.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
            {{ $requests->links() }}
        </div>
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom"><h2>{{ __('Manual refunds to make') }}</h2></div>
        <div class="card-body">
            <p class="text-muted small">{{ __('Midtrans and Duitku orders: the ledger and the tickets are already reversed — send the money back in that gateway\'s dashboard, then mark it done.') }}</p>
            <table class="table table-sm">
                <thead><tr><th>{{ __('Order') }}</th><th>{{ __('Gateway') }}</th><th>{{ __('Amount') }}</th><th>{{ __('Reason') }}</th><th></th></tr></thead>
                <tbody>
                @forelse($manual as $refund)
                    <tr>
                        <td><code>{{ $refund->order?->order_number }}</code></td>
                        <td>{{ $refund->provider }}</td>
                        <td>{{ $money($refund->amount_minor, $refund->currency) }}</td>
                        <td class="small">{{ $refund->reason }}</td>
                        <td class="text-end">
                            <form method="POST" action="{{ route('admin.refunds.done', ['locale' => $locale, 'id' => $refund->id]) }}">@csrf<button class="btn btn-sm btn-outline-secondary">{{ __('Mark refunded') }}</button></form>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="text-muted">{{ __('None outstanding.') }}</td></tr>
                @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection
