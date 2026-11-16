@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();

        // Every drawer form posts its own id as `_drawer`. It comes back as old
        // input when validation fails, which is how the right drawer reopens
        // with the operator's typing still in it instead of the saved values.
        $failed = old('_drawer');
    @endphp

    @include('admin.partials.flash')

    {{-- Renaming a tag changes what members see everywhere it appears, but never
         its address. To move events between filters, merge. --}}

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <h2 class="mb-0">{{ __('Tags') }} <span class="text-muted small ms-2">{{ __(':count total', ['count' => $tags->total()]) }}</span></h2>
            <button type="button" class="btn btn-sm btn-primary" data-drawer="#new-tag">{{ __('New tag') }}</button>
        </div>

        <div class="card-body">
            <form method="GET" class="row g-2 mb-3">
                <div class="col-md-7">
                    <input type="text" class="form-control" name="search" placeholder="{{ __('Name or slug') }}"
                           value="{{ $filters['search'] ?? '' }}">
                </div>
                <div class="col-md-3">
                    <div class="form-check mt-2">
                        <input class="form-check-input" type="checkbox" value="1" name="unused"
                               id="unused" @checked(($filters['unused'] ?? '') === '1')>
                        <label class="form-check-label" for="unused">{{ __('Unused only') }}</label>
                    </div>
                </div>
                <div class="col-6 col-md-2"><button class="btn btn-secondary w-100">{{ __('Filter') }}</button></div>
            </form>

            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>{{ __('Name') }}</th>
                            <th>{{ __('Slug') }}</th>
                            <th class="text-end">{{ __('Events') }}</th>
                            <th class="text-end">{{ __('Order') }}</th>
                            <th>{{ __('Offered') }}</th>
                            <x-row-actions-header />
                        </tr>
                    </thead>
                    <tbody>
                    @forelse($tags as $tag)
                        <tr class="{{ $tag->is_active ? '' : 'text-muted' }}">
                            <td>
                                <strong>{{ $tag->name }}</strong>
                                @if($tag->description)
                                    <div class="small text-muted">{{ Str::limit($tag->description, 90) }}</div>
                                @endif
                            </td>
                            <td class="small"><code>{{ $tag->slug }}</code></td>
                            <td class="text-end">{{ number_format((int) $tag->usage_count) }}</td>
                            <td class="text-end">{{ (int) $tag->sort_order }}</td>
                            <td>
                                <span class="badge bg-{{ $tag->is_active ? 'success' : 'secondary' }}">
                                    {{ $tag->is_active ? __('Yes') : __('No') }}
                                </span>
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#tag-{{ $tag->id }}">
                                        <i class="mdi mdi-pencil" aria-hidden="true"></i>
                                        <span>{{ __('Edit') }}</span>
                                    </a>
                                    <x-row-action icon="open-in-new" :href="url('/'.$locale.'/tag/'.$tag->slug)" target="_blank">{{ __('View page') }}</x-row-action>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#merge-tag-{{ $tag->id }}">
                                        <i class="mdi mdi-call-merge" aria-hidden="true"></i>
                                        <span>{{ __('Merge into…') }}</span>
                                    </a>
                                    <x-row-actions-divider />
                                    <x-row-action-form icon="delete" tone="danger"
                                                       :action="route('admin.tags.delete', ['locale' => $locale, 'tag' => $tag->id])"
                                                       :confirm="__('Delete this tag?')">{{ __('Delete') }}</x-row-action-form>
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="6" class="text-muted">{{ __('No tags match.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>

            {{ $tags->links('pagination::bootstrap-4') }}
        </div>
    </div>

    @foreach($tags as $tag)
        @php
            $drawerId = 'tag-'.$tag->id;
            $refill = $failed === $drawerId;
        @endphp
        <x-drawer :id="$drawerId" :title="$tag->name" :subtitle="$tag->slug.' · '.trans_choice(':count event|:count events', (int) $tag->usage_count)" :autoopen="$refill">
            <form id="tag-form-{{ $tag->id }}" method="POST"
                  action="{{ route('admin.tags.update', ['locale' => $locale, 'tag' => $tag->id]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="{{ $drawerId }}">

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Tag') }}</div>
                    <div class="row g-2">
                        <div class="col-12 mb-3">
                            <label class="form-label small" for="t-name-{{ $tag->id }}">{{ __('Name') }}</label>
                            <input type="text" class="form-control" id="t-name-{{ $tag->id }}" name="name"
                                   value="{{ $refill ? old('name') : $tag->name }}" required>
                        </div>
                        <div class="col-8 mb-3">
                            <label class="form-label small">{{ __('Slug') }}</label>
                            {{-- Read-only on purpose. The slug is in shared links and
                                 search indexes; a rename must not break them. To change
                                 which filter events sit under, merge. --}}
                            <input type="text" class="form-control" value="{{ $tag->slug }}" disabled>
                        </div>
                        <div class="col-4 mb-3">
                            <label class="form-label small" for="t-order-{{ $tag->id }}">{{ __('Order') }}</label>
                            <input type="number" min="0" class="form-control" id="t-order-{{ $tag->id }}" name="sort_order"
                                   value="{{ $refill ? old('sort_order') : $tag->sort_order }}">
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label small" for="t-desc-{{ $tag->id }}">{{ __('Description') }}</label>
                            <textarea class="form-control" id="t-desc-{{ $tag->id }}" name="description" rows="3"
                                      placeholder="{{ __('Shown on the tag page') }}">{{ $refill ? old('description') : $tag->description }}</textarea>
                        </div>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" value="1" name="is_active"
                               id="t-active-{{ $tag->id }}" @checked($refill ? old('is_active') : $tag->is_active)>
                        <label class="form-check-label small" for="t-active-{{ $tag->id }}">{{ __('Offer as a filter') }}</label>
                    </div>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="tag-form-{{ $tag->id }}">{{ __('Save tag') }}</button>
            </x-slot>
        </x-drawer>

        @php
            $mergeId = 'merge-tag-'.$tag->id;
            $mergeFailed = $failed === $mergeId;
        @endphp
        <x-drawer :id="$mergeId" :title="__('Merge :name', ['name' => $tag->name])" :autoopen="$mergeFailed">
            <form id="merge-tag-form-{{ $tag->id }}" method="POST"
                  action="{{ route('admin.tags.merge', ['locale' => $locale, 'tag' => $tag->id]) }}"
                  data-confirm="{{ __('Merge :name into the selected tag?', ['name' => $tag->name]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="{{ $mergeId }}">

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Target') }}</div>
                    <label class="form-label small" for="merge-target-{{ $tag->id }}">{{ __('Merge :name into', ['name' => $tag->name]) }}</label>
                    <select class="form-control" id="merge-target-{{ $tag->id }}" name="target_id" required>
                        <option value="">{{ __('Choose a tag…') }}</option>
                        @foreach($all as $other)
                            @continue($other->id === $tag->id)
                            <option value="{{ $other->id }}" @selected($mergeFailed && (string) old('target_id') === (string) $other->id)>{{ $other->name }} ({{ $other->usage_count }})</option>
                        @endforeach
                    </select>
                    <p class="text-muted small mt-2 mb-0">{{ trans_choice(':count event moves.|:count events move.', (int) $tag->usage_count) }} {{ __(':name is then removed.', ['name' => $tag->name]) }}</p>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-danger" form="merge-tag-form-{{ $tag->id }}">{{ __('Merge') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach

    @php $newFailed = $failed === 'new-tag'; @endphp
    <x-drawer id="new-tag" title="{{ __('New tag') }}" :autoopen="$newFailed">
        <form id="new-tag-form" method="POST" action="{{ route('admin.tags.store', ['locale' => $locale]) }}">
            @csrf
            <input type="hidden" name="_drawer" value="new-tag">

            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Tag') }}</div>
                <div class="mb-3">
                    <label class="form-label small" for="nt-name">{{ __('Name') }}</label>
                    <input type="text" class="form-control" id="nt-name" name="name"
                           value="{{ $newFailed ? old('name') : '' }}" required>
                    <span class="text-muted small">{{ __('Slug is generated from the name.') }}</span>
                </div>
                <div class="mb-3">
                    <label class="form-label small" for="nt-description">{{ __('Description') }}</label>
                    <textarea class="form-control" id="nt-description" name="description" rows="3">{{ $newFailed ? old('description') : '' }}</textarea>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" value="1" name="is_active" id="nt-active"
                           @checked($newFailed ? old('is_active') : true)>
                    <label class="form-check-label small" for="nt-active">{{ __('Offer as a filter') }}</label>
                </div>
            </div>
        </form>

        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
            <button class="btn btn-sm btn-primary" form="new-tag-form">{{ __('Add tag') }}</button>
        </x-slot>
    </x-drawer>
@endsection
