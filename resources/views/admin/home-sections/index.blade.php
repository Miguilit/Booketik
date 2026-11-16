@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="row">
        <div class="col-12">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2>{{ __('Home sections') }}</h2>
                    <button type="button" class="btn btn-sm btn-primary" data-drawer="#shelf-new">{{ __('Add rail') }}</button>
                </div>
                <div class="card-body">
                    {{-- The curated rails only. "Near you", "This weekend" and
                         "Trending" are computed per viewer and are not edited here. --}}
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                            <tr>
                                <th class="text-end">#</th>
                                <th>{{ __('Rail') }}</th>
                                <th>{{ __('Layout') }}</th>
                                <th>{{ __('City') }}</th>
                                <th>{{ __('Locale') }}</th>
                                <th class="text-end">{{ __('Items') }}</th>
                                <x-row-actions-header />
                            </tr>
                            </thead>
                            <tbody>
                            @forelse($sections as $section)
                                <tr>
                                    <td class="text-end small text-muted">{{ $section->sort_order }}</td>
                                    <td>
                                        <a href="{{ route('admin.home-sections.edit', ['locale' => $locale, 'section' => $section->id]) }}">{{ $section->title }}</a>
                                        @unless($section->is_active)<span class="badge bg-secondary">{{ __('Off') }}</span>@endunless
                                        <div class="small text-muted"><code>{{ $section->slug }}</code></div>
                                    </td>
                                    <td class="small">{{ $section->layout }}</td>
                                    <td class="small">{{ $section->city?->name ?? __('Every city') }}</td>
                                    <td class="small">{{ $section->locale }}</td>
                                    <td class="text-end">{{ $section->items_count }}</td>
                                    <td class="row-actions-col">
                                        <x-row-actions>
                                            <x-row-action icon="pencil"
                                                          :href="route('admin.home-sections.edit', ['locale' => $locale, 'section' => $section->id])">{{ __('Edit') }}</x-row-action>
                                            @if(auth()->user()?->isAdmin())
                                                <x-row-actions-divider />
                                                <x-row-action-form icon="delete"
                                                                   :action="route('admin.home-sections.delete', ['locale' => $locale, 'section' => $section->id])"
                                                                   :confirm="__('Delete this rail?')">{{ __('Delete rail') }}</x-row-action-form>
                                            @endif
                                        </x-row-actions>
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="7" class="text-muted">{{ __('No curated rails yet.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <x-drawer id="shelf-new" :title="__('Add rail')">
        <form id="shelf-new-form" method="POST" action="{{ route('admin.home-sections.store', ['locale' => $locale]) }}">
            @csrf
            @include('admin.home-sections._fields', ['section' => null, 'prefix' => 'new', 'nextOrder' => $sections->count()])
        </form>
        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
            <button class="btn btn-sm btn-primary" form="shelf-new-form">{{ __('Add rail') }}</button>
        </x-slot>
    </x-drawer>
@endsection
