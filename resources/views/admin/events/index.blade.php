@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $badge = fn (string $status) => match ($status) {
            'published' => 'success', 'draft' => 'secondary', 'scheduled' => 'info',
            'cancelled' => 'danger', 'postponed' => 'warning text-dark', default => 'light text-dark',
        };
        $statusLabels = [
            'draft' => __('Draft'), 'scheduled' => __('Scheduled'), 'published' => __('Published'),
            'cancelled' => __('Cancelled'), 'postponed' => __('Postponed'), 'ended' => __('Ended'),
        ];
        $formatLabels = ['in_person' => __('in person'), 'online' => __('online'), 'hybrid' => __('hybrid')];
        $visibilityLabels = ['public' => __('public'), 'unlisted' => __('unlisted'), 'private' => __('private')];
    @endphp

    @include('admin.partials.flash')

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h2 class="mb-0">{{ $queue ? __('Review queue') : __('Events') }} <span class="text-muted small ms-2">{{ $events->total() }}</span></h2>
            @if(auth()->user()?->isAdmin())
                <a class="btn btn-sm btn-outline-secondary" href="{{ route('admin.external-events.index', ['locale' => $locale]) }}">{{ __('External event catalogue') }}</a>
            @endif
            <div class="btn-group btn-group-sm">
                <a class="btn {{ ! $queue && ($filters['moderation'] ?? '') !== 'hidden' ? 'btn-primary' : 'btn-secondary' }}"
                   href="{{ route('admin.events.index', ['locale' => $locale]) }}">{{ __('All') }}</a>
                <a class="btn {{ $queue ? 'btn-primary' : 'btn-secondary' }}"
                   href="{{ route('admin.events.index', ['locale' => $locale, 'moderation' => 'queue']) }}">
                    {{ __('Waiting for review') }} <span class="badge bg-light text-dark">{{ $counts['queue'] }}</span>
                </a>
                <a class="btn {{ ($filters['moderation'] ?? '') === 'hidden' ? 'btn-primary' : 'btn-secondary' }}"
                   href="{{ route('admin.events.index', ['locale' => $locale, 'moderation' => 'hidden']) }}">
                    {{ __('Hidden') }} <span class="badge bg-light text-dark">{{ $counts['hidden'] }}</span>
                </a>
            </div>
        </div>

        <div class="card-body">
            @if($queue)
                <div class="alert alert-info py-2 px-3 small">{!! __('Review target: :hours from submission. Oldest first.', ['hours' => '<strong>'.e(trans_choice(':count hour|:count hours', $slaHours)).'</strong>']) !!}</div>
            @endif

            <form method="GET" class="row g-2 mb-3">
                @if($queue)<input type="hidden" name="moderation" value="queue">@endif
                <div class="col-md-3"><input type="text" class="form-control" name="search" placeholder="{{ __('Title or slug') }}" value="{{ $filters['search'] ?? '' }}"></div>
                <div class="col-md-2">
                    <select name="status" class="form-control">
                        <option value="">{{ __('Any status') }}</option>
                        @foreach($statuses as $s)
                            <option value="{{ $s->value }}" @selected(($filters['status'] ?? '') === $s->value)>{{ $statusLabels[$s->value] ?? ucfirst($s->value) }}</option>
                        @endforeach
                    </select>
                </div>
                @unless($queue)
                    <div class="col-md-2">
                        <select name="moderation" class="form-control">
                            <option value="">{{ __('Any review state') }}</option>
                            @foreach($moderationStates as $m)
                                <option value="{{ $m }}" @selected(($filters['moderation'] ?? '') === $m)>{{ \App\Support\Moderation::label($m) }}</option>
                            @endforeach
                        </select>
                    </div>
                @endunless
                <div class="col-md-2">
                    <select name="organizer" class="form-control">
                        <option value="">{{ __('Any organizer') }}</option>
                        @foreach($organizers as $o)
                            <option value="{{ $o->id }}" @selected(($filters['organizer'] ?? '') === $o->id)>{{ $o->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="category" class="form-control">
                        <option value="">{{ __('Any category') }}</option>
                        @foreach($categories as $c)
                            <option value="{{ $c->id }}" @selected(($filters['category'] ?? '') === $c->id)>{{ $c->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-1">
                    <select name="city" class="form-control">
                        <option value="">{{ __('City') }}</option>
                        @foreach($cities as $c)
                            <option value="{{ $c->id }}" @selected((string) ($filters['city'] ?? '') === (string) $c->id)>{{ $c->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="format" class="form-control">
                        <option value="">{{ __('Any format') }}</option>
                        @foreach($formats as $f)
                            <option value="{{ $f->value }}" @selected(($filters['format'] ?? '') === $f->value)>{{ $formatLabels[$f->value] ?? str_replace('_', ' ', $f->value) }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2"><input type="date" class="form-control" name="from" value="{{ $filters['from'] ?? '' }}" aria-label="{{ __('From') }}"></div>
                <div class="col-md-2"><input type="date" class="form-control" name="to" value="{{ $filters['to'] ?? '' }}" aria-label="{{ __('To') }}"></div>
                <div class="col-md-2"><button class="btn btn-secondary w-100">{{ __('Filter') }}</button></div>
            </form>

            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>{{ __('Event') }}</th>
                            <th>{{ __('When (local)') }}</th>
                            <th>{{ __('Organizer') }}</th>
                            <th>{{ __('Status') }}</th>
                            <th>{{ __('Review') }}</th>
                            @if($queue)
                                {{-- The publish-time risk score (EventRiskService): rules for scam
                                     wording, payment details and copied covers, plus the model's read. --}}
                                <th title="{{ __('Scored when the organizer published (0–100). Hover a score for why.') }}">{{ __('AI risk') }}</th>
                                <th class="text-end">{{ __('Reports') }}</th>
                            @endif
                            <th class="text-end">{{ __('Going') }}</th>
                            <x-row-actions-header />
                        </tr>
                    </thead>
                    <tbody>
                    @forelse($events as $event)
                        <tr>
                            <td>
                                <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $event->id]) }}"><strong>{{ $event->title }}</strong></a>
                                <div class="small text-muted">
                                    {{ $event->category?->name ?? __('No category') }} · {{ $formatLabels[$event->format->value] ?? str_replace('_', ' ', $event->format->value) }}
                                    @if($event->venue) · {{ $event->venue->city ?? $event->venue->name }} @endif
                                    @if($event->visibility->value !== 'public') · {{ $visibilityLabels[$event->visibility->value] ?? $event->visibility->value }} @endif
                                </div>
                            </td>
                            <td class="small text-nowrap">
                                {{ $event->starts_at->copy()->setTimezone($event->timezone)->format('D j M Y, H:i') }}
                                <div class="text-muted">{{ $event->timezone }}</div>
                            </td>
                            <td class="small">
                                {{ $event->organizer?->name }}
                                @if($event->organizer?->is_verified)<i class="mdi mdi-check-decagram text-primary" title="{{ __('Verified') }}"></i>@endif
                            </td>
                            <td>
                                <span class="badge bg-{{ $badge($event->status->value) }}">{{ $statusLabels[$event->status->value] ?? $event->status->value }}</span>
                                @if($event->hidden_at)<span class="badge bg-danger">{{ __('hidden') }}</span>@endif
                            </td>
                            <td class="small">
                                {{ \App\Support\Moderation::label($event->moderation_status) }}
                                @if($queue && $event->submitted_at)
                                    @php $sla = \App\Support\ModerationSla::status($event->submitted_at, $slaHours); @endphp
                                    <div><span class="badge {{ match($sla['state']) { 'breached' => 'bg-danger', 'due' => 'bg-warning text-dark', default => 'bg-secondary' } }}">{{ $sla['label'] }}</span></div>
                                @endif
                            </td>
                            @if($queue)
                                <td class="small">
                                    @if($event->ai_risk_score !== null)
                                        @php $risk = (int) $event->ai_risk_score; @endphp
                                        <span class="badge {{ $risk >= (int) config('eventgoo-ai.moderation.review_threshold', 60) ? 'bg-danger' : ($risk >= 25 ? 'bg-warning text-dark' : 'bg-secondary') }}" data-ai-risk="{{ $risk }}"
                                              title="{{ collect($event->ai_risk_reasons ?? [])->map(fn ($r) => ($r['label'] ?? '').(isset($r['detail']) ? ': '.$r['detail'] : ''))->implode(' · ') ?: __('No signals') }}">{{ $risk }}</span>
                                        @if(! empty($event->ai_risk_reasons))<div class="text-muted">{{ \Illuminate\Support\Str::limit(collect($event->ai_risk_reasons)->pluck('label')->implode(', '), 60) }}</div>@endif
                                    @else
                                        <span class="badge bg-secondary" data-ai-risk="unscored">{{ __('Not scored') }}</span>
                                    @endif
                                </td>
                                <td class="text-end">{{ number_format((int) ($event->open_reports ?? 0)) }}</td>
                            @endif
                            <td class="text-end">{{ number_format($event->going) }}</td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <x-row-action icon="pencil" :href="route('admin.events.edit', ['locale' => $locale, 'event' => $event->id])">{{ __('Open') }}</x-row-action>
                                    <x-row-action icon="account-multiple" :href="route('admin.events.registrations', ['locale' => $locale, 'event' => $event->id])">{{ __('Guests') }}</x-row-action>
                                    @if(in_array($event->moderation_status, \App\Support\Moderation::QUEUE, true))
                                        <x-row-actions-divider />
                                        <x-row-action-form icon="check" tone="success" method="POST"
                                                           :action="route('admin.events.approve', ['locale' => $locale, 'event' => $event->id])">{{ __('Approve') }}</x-row-action-form>
                                    @endif
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="{{ $queue ? 9 : 7 }}" class="text-muted">{{ $queue ? __('Nothing waiting for review.') : __('No events match.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>

            {{ $events->links('pagination::bootstrap-4') }}
        </div>
    </div>
@endsection
