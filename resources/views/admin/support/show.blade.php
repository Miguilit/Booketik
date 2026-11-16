@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="cl-page-head">
        <div>
            <p class="cl-eyebrow"><a href="{{ route('admin.support.index', ['locale' => $locale]) }}">{{ __('Support') }}</a> · {{ __('request #:id', ['id' => $ticket->id]) }}</p>
            <h1>{{ $ticket->subject }}</h1>
            <p class="text-muted">{{ $ticket->name }} · {{ $ticket->email }} · {{ $ticket->created_at?->format('D j M Y, H:i') }} · <span class="badge bg-secondary">{{ $ticket->status }}</span></p>
        </div>
    </div>

    <div class="row">
        <div class="col-lg-7">
            <div class="card card-default">
                <div class="card-header"><h2>{{ __('Their message') }}</h2></div>
                <div class="card-body"><p style="white-space:pre-line">{{ $ticket->message }}</p></div>
            </div>

            <div class="card card-default">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">{{ __('Reply') }}</h2>
                    @if($aiAvailable)
                        <form method="POST" action="{{ route('admin.support.draft', ['locale' => $locale, 'ticket' => $ticket->id]) }}">
                            @csrf
                            <button class="btn btn-secondary btn-sm" type="submit"><i class="mdi mdi-text-box-edit-outline" aria-hidden="true"></i> {{ $ticket->ai_draft ? __('Draft again') : __('Draft a reply') }}</button>
                        </form>
                    @else
                        <span class="badge bg-secondary" data-ai="unavailable" title="{{ __('No AI provider is configured (Admin → AI)') }}">{{ __('AI unavailable') }}</span>
                    @endif
                </div>
                <div class="card-body">
                    @if($ticket->replied_at)
                        <div class="alert alert-light border small mb-3">
                            <strong>{{ __('Sent :date', ['date' => $ticket->replied_at->format('Y-m-d H:i')]) }}</strong>
                            <p class="mb-0 mt-1" style="white-space:pre-line">{{ $ticket->reply }}</p>
                        </div>
                    @endif

                    @if($ticket->ai_draft)
                        <p class="small text-muted mb-2">
                            {!! __('Draft from the support assistant, :when — :not_sent. Edit it before you send.', ['when' => e($ticket->ai_drafted_at?->diffForHumans()), 'not_sent' => '<strong>'.e(__('not sent')).'</strong>']) !!}
                            @if(! empty($draftMeta['needs_human']))<span class="badge bg-warning text-dark ms-1">{{ __('Needs a decision') }}</span>@endif
                        </p>
                        @if(! empty($draftMeta['internal_note']))<p class="small"><strong>{{ __('Note for you:') }}</strong> {{ $draftMeta['internal_note'] }}</p>@endif
                        @if(! empty($draftMeta['sources']))
                            <p class="small text-muted">{{ __('From: :sources', ['sources' => collect($draftMeta['sources'])->pluck('title')->implode(' · ')]) }}</p>
                        @endif
                    @endif

                    <form method="POST" action="{{ route('admin.support.reply', ['locale' => $locale, 'ticket' => $ticket->id]) }}">
                        @csrf
                        <label class="form-label" for="reply">{{ __('Your reply to :name', ['name' => $ticket->name]) }}</label>
                        <textarea class="form-control" id="reply" name="reply" rows="9" required maxlength="5000">{{ old('reply', $ticket->ai_draft) }}</textarea>
                        <div class="form-check mt-2">
                            <input class="form-check-input" type="checkbox" value="1" id="resolve" name="resolve" @checked($ticket->status !== 'resolved')>
                            <label class="form-check-label" for="resolve">{{ __('Mark as resolved') }}</label>
                        </div>
                        <button class="btn btn-primary mt-3" type="submit">{{ __('Send reply') }}</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-5">
            <div class="card card-default">
                <div class="card-header"><h2>{{ __('Their orders') }}</h2></div>
                <div class="card-body">
                    @forelse($facts['orders'] as $order)
                        <div class="border-bottom py-2 small">
                            <strong class="cl-mono">{{ $order['order_number'] }}</strong> · {{ $order['event'] ?? $order['type'] }}
                            <div class="text-muted">{{ $order['placed'] }} · {{ $order['payment_status'] }}@if($order['refund_status']) · {{ __('refund :status', ['status' => $order['refund_status']]) }}@endif @if($order['total']) · {{ $order['total'] }}@endif @if($order['event_cancelled']) · <span class="text-danger">{{ __('event cancelled') }}</span>@endif</div>
                        </div>
                    @empty
                        <p class="text-muted small mb-0">{{ __('No orders under this account or address.') }}</p>
                    @endforelse
                    @if($facts['refund_requests'] !== [])
                        <h3 class="h6 mt-3">{{ __('Refund requests') }}</h3>
                        @foreach($facts['refund_requests'] as $refund)
                            <div class="small">{{ $refund['event'] }} · {{ $refund['status'] }} · {{ $refund['asked'] }}</div>
                        @endforeach
                    @endif
                    @if($ticket->user)
                        <p class="mt-3 mb-0"><a class="small" href="{{ route('admin.user.show', ['locale' => $locale, 'id' => $ticket->user->id]) }}">{{ __('Open their account') }}</a></p>
                    @endif
                </div>
            </div>
        </div>
    </div>
@endsection
