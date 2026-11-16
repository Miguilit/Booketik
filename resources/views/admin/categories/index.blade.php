@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        // Drawer forms post their own id as `_drawer`, so a failed save reopens
        // the right drawer with the operator's typing in it.
        $failed = old('_drawer');
    @endphp

    @include('admin.partials.flash')

    {{-- One category per event, from this short list. The slug is in every
         filter link and the mobile category chips, so it is set once and then
         left alone; renaming changes only the label people see. --}}

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <h2 class="mb-0">{{ __('Categories') }} <span class="text-muted small ms-2">{{ __(':count total', ['count' => $categories->count()]) }}</span></h2>
            <button type="button" class="btn btn-sm btn-primary" data-drawer="#new-category">{{ __('New category') }}</button>
        </div>

        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>{{ __('Name') }}</th>
                            <th>{{ __('Slug') }}</th>
                            <th>{{ __('Icon') }}</th>
                            <th class="text-end">{{ __('Events') }}</th>
                            <th class="text-end">{{ __('Order') }}</th>
                            <th>{{ __('Shown') }}</th>
                            <x-row-actions-header />
                        </tr>
                    </thead>
                    <tbody>
                    @forelse($categories as $category)
                        <tr class="{{ $category->is_active ? '' : 'text-muted' }}">
                            <td>
                                @if($category->color_hex)
                                    <span class="d-inline-block rounded-circle me-1 align-middle" style="width:10px;height:10px;background:{{ $category->color_hex }}"></span>
                                @endif
                                <strong>{{ $category->name }}</strong>
                                @if($category->description)
                                    <div class="small text-muted">{{ Str::limit($category->description, 90) }}</div>
                                @endif
                            </td>
                            <td class="small"><code>{{ $category->slug }}</code></td>
                            <td class="small">{{ $category->icon ?: '—' }}</td>
                            <td class="text-end">{{ number_format($category->events_count) }}</td>
                            <td class="text-end">{{ $category->sort_order }}</td>
                            <td>
                                <span class="badge bg-{{ $category->is_active ? 'success' : 'secondary' }}">{{ $category->is_active ? __('Yes') : __('No') }}</span>
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#category-{{ $category->id }}">
                                        <i class="mdi mdi-pencil" aria-hidden="true"></i>
                                        <span>{{ __('Edit') }}</span>
                                    </a>
                                    <x-row-action icon="calendar" :href="route('admin.events.index', ['locale' => $locale, 'category' => $category->id])">{{ __('Events') }}</x-row-action>
                                    @if(auth()->user()?->isAdmin())
                                        <x-row-actions-divider />
                                        <x-row-action-form icon="delete" tone="danger"
                                                           :action="route('admin.categories.delete', ['locale' => $locale, 'category' => $category->id])"
                                                           :confirm="__('Delete this category? One with events is hidden instead.')">{{ __('Delete') }}</x-row-action-form>
                                    @endif
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ __('No categories yet.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    @foreach($categories->concat([null]) as $category)
        @php
            $drawerId = $category ? 'category-'.$category->id : 'new-category';
            $refill = $failed === $drawerId;
            $value = fn (string $field, $default = null) => $refill ? old($field) : ($category?->{$field} ?? $default);
        @endphp
        <x-drawer :id="$drawerId" :title="$category?->name ?? __('New category')" :subtitle="$category?->slug" :autoopen="$refill">
            <form id="{{ $drawerId }}-form" method="POST"
                  action="{{ $category ? route('admin.categories.update', ['locale' => $locale, 'category' => $category->id]) : route('admin.categories.store', ['locale' => $locale]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="{{ $drawerId }}">

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Category') }}</div>
                    <div class="row g-2">
                        <div class="col-12 mb-3">
                            <label class="form-label small" for="{{ $drawerId }}-name">{{ __('Name') }}</label>
                            <input type="text" class="form-control" id="{{ $drawerId }}-name" name="name" value="{{ $value('name') }}" required>
                        </div>
                        <div class="col-8 mb-3">
                            <label class="form-label small" for="{{ $drawerId }}-slug">{{ __('Slug') }}</label>
                            @if($category)
                                <input type="text" class="form-control" id="{{ $drawerId }}-slug" value="{{ $category->slug }}" disabled>
                            @else
                                <input type="text" class="form-control" id="{{ $drawerId }}-slug" name="slug" value="{{ $value('slug') }}" placeholder="{{ __('From the name') }}">
                            @endif
                        </div>
                        <div class="col-4 mb-3">
                            <label class="form-label small" for="{{ $drawerId }}-order">{{ __('Order') }}</label>
                            <input type="number" min="0" class="form-control" id="{{ $drawerId }}-order" name="sort_order" value="{{ $value('sort_order', 0) }}">
                        </div>
                        <div class="col-6 mb-3">
                            <label class="form-label small" for="{{ $drawerId }}-icon">{{ __('Icon name') }}</label>
                            <input type="text" class="form-control" id="{{ $drawerId }}-icon" name="icon" value="{{ $value('icon') }}" placeholder="music_note">
                        </div>
                        <div class="col-6 mb-3">
                            <label class="form-label small" for="{{ $drawerId }}-color">{{ __('Colour') }}</label>
                            <input type="text" class="form-control" id="{{ $drawerId }}-color" name="color_hex" value="{{ $value('color_hex') }}" placeholder="#C2532B">
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label small" for="{{ $drawerId }}-desc">{{ __('Description') }}</label>
                            <input type="text" class="form-control" id="{{ $drawerId }}-desc" name="description" value="{{ $value('description') }}">
                        </div>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" value="1" name="is_active"
                               id="{{ $drawerId }}-active" @checked($refill ? old('is_active') : ($category?->is_active ?? true))>
                        <label class="form-check-label small" for="{{ $drawerId }}-active">{{ __('Shown in the apps and on the site') }}</label>
                    </div>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="{{ $drawerId }}-form">{{ $category ? __('Save category') : __('Add category') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach
@endsection
