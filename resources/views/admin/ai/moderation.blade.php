@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="cl-page-head">
        <div>
            <p class="cl-eyebrow">{{ __('Eventgoo AI · trust and safety') }}</p>
            <h1>{{ __('Moderation log') }}</h1>
            <p class="text-muted">{{ __('Every review decision on events and on attendee reports, newest first.') }}</p>
        </div>
        <div class="btn-group btn-group-sm" role="group" aria-label="{{ __('Show') }}">
            @foreach(['all' => __('Everything'), 'events' => __('Event reviews'), 'reports' => __('Reports')] as $key => $label)
                <a class="btn {{ $kind === $key ? 'btn-primary' : 'btn-secondary' }}" href="{{ route('admin.ai.moderation', ['locale' => $locale, 'kind' => $key]) }}">{{ $label }}</a>
            @endforeach
        </div>
    </div>

    @include('admin.ai._nav')

    <div class="card card-default">
        <div class="card-header"><h2>{{ __('AI moderation') }}</h2></div>
        <div class="card-body">
            @if($aiRuns->isEmpty())
                <div class="cl-empty"><i class="mdi mdi-shield-outline" aria-hidden="true"></i><strong>{{ __('No AI moderation has run yet') }}</strong>{{ __('Each event is scored when its organizer publishes it — rules for scam wording, payment details, off-platform payment and copied covers, plus the model\'s read and image safety when AI is configured. Scores appear here and in the review queue\'s "AI risk" column.') }}</div>
            @else
                <div class="table-responsive"><table class="table table-sm align-middle">
                    <thead><tr><th>{{ __('When') }}</th><th>{{ __('Check') }}</th><th>{{ __('Event') }}</th><th class="text-end">{{ __('Score') }}</th><th>{{ __('Why') }}</th><th>{{ __('Outcome') }}</th></tr></thead>
                    <tbody>
                    @foreach($aiRuns as $run)
                        @php
                            $out = (array) ($run->output ?? []);
                            $score = $out['score'] ?? null;
                            $reasons = collect($out['reasons'] ?? []);
                        @endphp
                        <tr>
                            <td class="small text-nowrap">{{ $run->created_at?->format('Y-m-d H:i') }}</td>
                            <td class="small">{{ ['event_risk' => __('Risk score'), 'moderation' => __('Model read'), 'fraud' => __('Fraud')][$run->feature] ?? $run->feature }}@if($run->type === 'local')<div class="text-muted">{{ __('rules') }}</div>@endif</td>
                            <td class="small">
                                @if($run->subject_id && $run->subject_type === (new \App\Models\Event)->getMorphClass())
                                    <a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $run->subject_id]) }}">{{ \Illuminate\Support\Str::after((string) $run->title, ' · ') ?: __('Event') }}</a>
                                @else — @endif
                            </td>
                            <td class="text-end">@if($score !== null)<span class="badge {{ $score >= (int) config('eventgoo-ai.moderation.review_threshold', 60) ? 'bg-danger' : ($score >= 25 ? 'bg-warning text-dark' : 'bg-secondary') }}" data-ai-risk="{{ $score }}">{{ $score }}</span>@endif</td>
                            <td class="small">{{ $reasons->pluck('label')->implode('; ') ?: ($run->status === 'failed' ? __('The model call failed; rules only') : '—') }}</td>
                            <td class="small">{{ ($out['held'] ?? false) ? __('Sent to the review queue') : ($run->status === 'failed' ? __('Failed') : __('Left live')) }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table></div>
            @endif
        </div>
    </div>

    <div class="card card-default">
        <div class="card-header"><h2>{{ __('Decisions') }} <span class="text-muted small ms-2">{{ $entries->count() }}</span></h2></div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead><tr><th>{{ __('When') }}</th><th>{{ __('What') }}</th><th>{{ __('Subject') }}</th><th>{{ __('Decision') }}</th><th>{{ __('By') }}</th><th>{{ __('Note') }}</th></tr></thead>
                    <tbody>
                    @forelse($entries as $entry)
                        <tr>
                            <td class="small text-nowrap">{{ $entry['at']?->format('Y-m-d H:i') }}</td>
                            <td><span class="badge bg-{{ $entry['kind'] === 'event' ? 'info' : 'warning' }}">{{ $entry['kind'] === 'event' ? __('Event review') : __('Report') }}</span></td>
                            <td class="small">
                                @if($entry['subject_id'])<a href="{{ route('admin.events.edit', ['locale' => $locale, 'event' => $entry['subject_id']]) }}">{{ $entry['subject'] }}</a>@else {{ $entry['subject'] }} @endif
                                @if($entry['detail'])<div class="text-muted">{{ $entry['detail'] }}</div>@endif
                            </td>
                            <td class="small">{{ $entry['decision'] }}</td>
                            <td class="small">{{ $entry['by'] ?? __('System') }}</td>
                            <td class="small text-muted">{{ \Illuminate\Support\Str::limit((string) $entry['note'], 120) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="6" class="text-muted">{{ __('No decisions yet.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection
