@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="cl-page-head">
        <div>
            <p class="cl-eyebrow">{{ __('Support') }}</p>
            <h1>{{ __('Requests') }}</h1>
            <p class="text-muted">{{ __('What people asked from the app and the site. Open one to read it with their orders beside it, and to draft a reply.') }}</p>
        </div>
        <div class="btn-group btn-group-sm" role="group" aria-label="{{ __('Show') }}">
            @foreach([null => __('All'), 'pending' => __('Pending'), 'unresolved' => __('Unresolved'), 'resolved' => __('Resolved')] as $key => $label)
                <a class="btn {{ $status === ($key ?: null) ? 'btn-primary' : 'btn-secondary' }}" href="{{ route('admin.support.index', array_filter(['locale' => $locale, 'status' => $key ?: null])) }}">{{ $label }}@if($key) <span class="small">{{ (int) ($counts[$key] ?? 0) }}</span>@endif</a>
            @endforeach
        </div>
    </div>

    <div class="card card-default">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead><tr><th>#</th><th>{{ __('From') }}</th><th>{{ __('Subject') }}</th><th>{{ __('Status') }}</th><th>{{ __('Received') }}</th><th>{{ __('Reply') }}</th><x-row-actions-header /></tr></thead>
                    <tbody>
                    @forelse($tickets as $ticket)
                        <tr>
                            <td class="cl-mono small">{{ $ticket->id }}</td>
                            <td class="small">{{ $ticket->name }}<div class="text-muted">{{ $ticket->email }}</div></td>
                            <td><a href="{{ route('admin.support.show', ['locale' => $locale, 'ticket' => $ticket->id]) }}">{{ \Illuminate\Support\Str::limit($ticket->subject, 80) }}</a></td>
                            <td><span class="badge {{ ['resolved' => 'bg-success', 'unresolved' => 'bg-warning text-dark'][$ticket->status] ?? 'bg-secondary' }}">{{ $ticket->status }}</span></td>
                            <td class="small text-nowrap">{{ $ticket->created_at?->format('Y-m-d H:i') }}</td>
                            <td class="small">{{ $ticket->replied_at ? __('Sent :date', ['date' => $ticket->replied_at->diffForHumans()]) : ($ticket->ai_drafted_at ? __('Draft waiting') : '—') }}</td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <x-row-action icon="eye" :href="route('admin.support.show', ['locale' => $locale, 'ticket' => $ticket->id])">{{ __('Open') }}</x-row-action>
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ __('No requests.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
            {{ $tickets->links('pagination::bootstrap-4') }}
        </div>
    </div>
@endsection
