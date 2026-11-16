@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="row">
        <div class="col-lg-7">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2>{{ $section->title }}</h2>
                    <a href="{{ route('admin.home-sections.index', ['locale' => $locale]) }}" class="btn btn-sm btn-secondary">{{ __('All rails') }}</a>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                            <tr><th class="text-end">#</th><th>{{ $organizerRail ? __('Organizer') : __('Event') }}</th><th>{{ __('Window') }}</th><x-row-actions-header /></tr>
                            </thead>
                            <tbody>
                            @forelse($items as $item)
                                @php $target = $item->content_type === 'organizer' ? $item->organizer : $item->event; @endphp
                                <tr>
                                    <td class="text-end small text-muted">{{ $item->sort_order }}</td>
                                    <td>
                                        {{ $item->title_override ?: ($target?->title ?? $target?->name ?? '(missing)') }}
                                        @unless($target)<span class="badge bg-danger">{{ __('Gone') }}</span>@endunless
                                    </td>
                                    <td class="small text-muted">
                                        @if($item->starts_at || $item->ends_at)
                                            {{ $item->starts_at?->format('Y-m-d') ?? 'now' }} &rarr;
                                            {{ $item->ends_at?->format('Y-m-d') ?? 'forever' }}
                                        @else
                                            always
                                        @endif
                                    </td>
                                    <td class="row-actions-col">
                                        <x-row-actions>
                                            <x-row-action-form icon="close"
                                                               :action="route('admin.home-sections.items.delete', ['locale' => $locale, 'section' => $section->id, 'item' => $item->id])"
                                                               :confirm="__('Remove from this rail?')">{{ __('Remove') }}</x-row-action-form>
                                        </x-row-actions>
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="4" class="text-muted">{{ __('Nothing on this rail yet.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>

                    <hr>
                    <h5>{{ $organizerRail ? __('Add an organizer') : __('Add an event') }}</h5>
                    <form method="POST" action="{{ route('admin.home-sections.items.store', ['locale' => $locale, 'section' => $section->id]) }}"
                          class="row g-2 align-items-end">
                        @csrf
                        <div class="col-md-5">
                            <label class="form-label small" for="content_id">{{ $organizerRail ? __('Organizer') : __('Event') }}</label>
                            <select class="form-control form-control-sm" id="content_id" name="content_id" required>
                                @foreach($choices as $id => $label)
                                    <option value="{{ $id }}">{{ $label }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small" for="item_sort">{{ __('Order') }}</label>
                            <input type="number" min="0" class="form-control form-control-sm" id="item_sort" name="sort_order"
                                   value="{{ $items->count() + 1 }}">
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small" for="starts_at">{{ __('Starts') }}</label>
                            <input type="datetime-local" class="form-control form-control-sm" id="starts_at" name="starts_at">
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label small" for="ends_at">{{ __('Ends') }}</label>
                            <input type="datetime-local" class="form-control form-control-sm" id="ends_at" name="ends_at">
                        </div>
                        <div class="col-6 col-md-1"><button class="btn btn-sm btn-primary w-100">{{ __('Add') }}</button></div>
                        <div class="col-12">
                            <small class="text-muted">{{ __('Leave dates empty to keep it permanently. Only upcoming, publicly listed events can be pinned.') }}</small>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-5">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom"><h2>{{ __('Rail settings') }}</h2></div>
                <div class="card-body">
                    <form method="POST" action="{{ route('admin.home-sections.update', ['locale' => $locale, 'section' => $section->id]) }}">
                        @csrf
                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save rail')])
                        @include('admin.home-sections._fields', ['section' => $section, 'prefix' => 'edit'])
                    </form>

                    @if(auth()->user()?->isAdmin())
                        <x-admin.destructive-form :action="route('admin.home-sections.delete', ['locale' => $locale, 'section' => $section->id])"
                            :confirm="__('Delete this rail?')"
                            class="btn btn-danger w-100 mt-2">{{ __('Delete rail') }}</x-admin.destructive-form>
                    @endif
                </div>
            </div>
        </div>
    </div>
@endsection
