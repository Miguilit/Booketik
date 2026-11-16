@extends('admin.admin_master')
@section('admin')
    @php($locale = app()->getLocale())
    @include('admin.partials.flash')

    <div class="row">
        <div class="col-lg-5 mb-4">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('New campaign') }}</h2></div>
                <div class="card-body">
                    <p class="text-muted small">{!! __('Every member in the segment gets it in their inbox. Push reaches only those who switched :promotions on (off by default), and waits for the end of their quiet hours.', ['promotions' => '<strong>'.e(__('promotions')).'</strong>']) !!}</p>
                    <form method="POST" action="{{ route('admin.send.notification', ['locale' => $locale]) }}">
                        @csrf
                        <div class="mb-3">
                            <label class="form-label" for="title">{{ __('Title') }}</label>
                            <input class="form-control" id="title" name="title" maxlength="255" required value="{{ old('title') }}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="message">{{ __('Message') }}</label>
                            <textarea class="form-control" id="message" name="message" rows="3" maxlength="2000" required>{{ old('message') }}</textarea>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label" for="image_url">{{ __('Image URL') }}</label>
                                <input class="form-control" id="image_url" name="image_url" type="url" value="{{ old('image_url') }}">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label" for="url">{{ __('Opens') }}</label>
                                <input class="form-control" id="url" name="url" placeholder="{{ __('/e/slug or :url/…', ['url' => url('/')]) }}" value="{{ old('url') }}">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="segment">{{ __('Segment') }}</label>
                            <select class="form-control" id="segment" name="segment">
                                @foreach(['all' => __('Everyone'), 'city' => __('A city'), 'interests' => __('Interests'), 'followers' => __('Followers of an organizer'), 'plus' => __('Plus members'), 'inactive' => __('Inactive (30 days)')] as $value => $label)
                                    <option value="{{ $value }}" @selected(old('segment') === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label" for="city">{{ __('City') }}</label>
                                <select class="form-control" id="city" name="city"><option value="">—</option>
                                    @foreach($cities as $city)<option value="{{ $city->slug }}">{{ $city->name }}</option>@endforeach
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label" for="organizer">{{ __('Organizer') }}</label>
                                <select class="form-control" id="organizer" name="organizer"><option value="">—</option>
                                    @foreach($organizers as $organizer)<option value="{{ $organizer->slug }}">{{ $organizer->name }}</option>@endforeach
                                </select>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="interests">{{ __('Interests') }}</label>
                            <select class="form-control" id="interests" name="interests[]" multiple size="4">
                                @foreach($categories as $category)<option value="{{ $category->slug }}">{{ $category->name }}</option>@endforeach
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="scheduled_at">{{ __('Send later (UTC)') }}</label>
                            <input class="form-control" id="scheduled_at" name="scheduled_at" type="datetime-local" value="{{ old('scheduled_at') }}">
                            <small class="text-muted">{{ __('Leave empty to send now.') }}</small>
                        </div>
                        <button class="btn btn-primary">{{ __('Send / schedule') }}</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-7">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Campaigns') }}</h2></div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead><tr><th>{{ __('Campaign') }}</th><th>{{ __('Segment') }}</th><th>{{ __('Status') }}</th><th class="text-end">{{ __('Matched') }}</th><th class="text-end">{{ __('Inbox') }}</th><th class="text-end">{{ __('Push eligible') }}</th><th class="text-end">{{ __('Delivered') }}</th><th class="text-end">{{ __('Failed') }}</th><th class="text-end">{{ __('Held') }}</th><th></th></tr></thead>
                            <tbody>
                            @forelse($campaigns as $campaign)
                                <tr>
                                    <td>{{ $campaign->title }}<div class="small text-muted">{{ \Illuminate\Support\Str::limit($campaign->body, 60) }}</div></td>
                                    <td class="small">{{ $campaign->segment['type'] ?? 'all' }}@if(! empty($campaign->segment['value'])): {{ implode(', ', (array) $campaign->segment['value']) }}@endif</td>
                                    <td class="small">{{ $campaign->status }}<div class="text-muted">{{ ($campaign->sent_at ?? $campaign->scheduled_at)?->format('Y-m-d H:i') }}</div></td>
                                    <td class="text-end">{{ number_format($campaign->recipient_count) }}</td>
                                    <td class="text-end">{{ number_format($campaign->inbox_count) }}</td>
                                    <td class="text-end">{{ number_format($campaign->push_eligible_count) }}</td>
                                    <td class="text-end">{{ number_format($campaign->push_delivered_count) }}</td>
                                    <td class="text-end">{{ number_format($campaign->push_failed_count) }}</td>
                                    <td class="text-end">{{ number_format($campaign->held_count) }}</td>
                                    <td class="text-end">
                                        <form method="POST" action="{{ route('admin.notification.delete', ['locale' => $locale, 'id' => $campaign->id]) }}">
                                            @csrf @method('DELETE')
                                            <button class="btn btn-sm btn-outline-secondary">{{ $campaign->status === 'scheduled' ? __('Cancel') : __('Remove') }}</button>
                                        </form>
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="10" class="text-muted">{{ __('No campaigns yet.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                    {{ $campaigns->links() }}
                </div>
            </div>
        </div>
    </div>
@endsection
