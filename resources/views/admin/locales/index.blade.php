@extends('admin.admin_master')
@section('admin')
    @php
        $current = app()->getLocale();

        // Which locales actually have translation files. A locale row can be
        // active in the database with no `resources/lang/<code>` directory
        // behind it — the app then silently falls back to English, which is
        // invisible from this screen unless it is stated. Globbed once here
        // rather than stat-ing the disk per row.
        $translated = collect(glob(resource_path('lang').'/*', GLOB_ONLYDIR))
            ->map(fn (string $path) => basename($path))
            ->all();
    @endphp

    @include('admin.partials.flash')

    <div class="row">
        <div class="col-12">
            <div class="card card-default">

                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h2>{{ __('dashboard.locales') }}</h2>
                        <small class="text-muted">
                            {{ trans_choice(':count locale|:count locales', $locales->count()) }} ·
                            {{ __(':count active', ['count' => $locales->where('is_active', true)->count()]) }}
                        </small>
                    </div>
                    <button type="button" class="btn btn-sm btn-primary" data-drawer="#locale-new">{{ __('dashboard.add_locale') }}</button>
                </div>

                <div class="card-body">
                    <div class="table-responsive">
                        <table id="basic-data-table" class="table nowrap mb-0" style="width:100%">
                            <thead>
                            <tr>
                                <th scope="col">{{ __('dashboard.image') }}</th>
                                <th scope="col">{{ __('dashboard.name') }}</th>
                                <th scope="col">{{ __('dashboard.code') }}</th>
                                <th scope="col">{{ __('dashboard.active') }}</th>
                                <th scope="col">{{ __('Translations') }}</th>
                                <x-row-actions-header />
                            </tr>
                            </thead>
                            <tbody>
                            {{-- Loop variable deliberately not named $locale: that would
                                 shadow the URL-segment locale used in every route() call
                                 below and silently build links to the wrong language. --}}
                            @forelse($locales as $item)
                                <tr class="{{ $item->is_active ? '' : 'cl-row-muted' }}">
                                    <td>
                                        @if($item->flag_image)
                                            <img src="{{ asset($item->flag_image) }}" alt=""
                                                 class="cl-flag">
                                        @else
                                            <span class="cl-flag cl-flag-empty">{{ Str::upper($item->code) }}</span>
                                        @endif
                                    </td>
                                    <td>
                                        <a href="#" data-drawer="#locale-{{ $item->id }}">{{ $item->name }}</a>
                                        @if($item->code === $current)
                                            <span class="cl-chip">{{ __('viewing') }}</span>
                                        @endif
                                    </td>
                                    <td><code>{{ $item->code }}</code></td>
                                    <td>
                                        @if($item->is_active)
                                            <span class="badge bg-success">{{ __('dashboard.active') }}</span>
                                        @else
                                            <span class="badge bg-secondary">{{ __('Off') }}</span>
                                        @endif
                                    </td>
                                    <td>
                                        @if(in_array($item->code, $translated, true))
                                            <span class="text-subtle">resources/lang/{{ $item->code }}</span> {{-- i18n-ignore --}}
                                        @else
                                            <span class="text-warning" title="{{ __('No resources/lang/:code directory', ['code' => $item->code]) }}">
                                                {{ __('Missing (uses English)') }}
                                            </span>
                                        @endif
                                    </td>
                                    <td class="row-actions-col">
                                        <x-row-actions>
                                            <a href="#" class="row-actions-item" role="menuitem" data-drawer="#locale-{{ $item->id }}">
                                                <i class="mdi mdi-pencil" aria-hidden="true"></i>
                                                <span>{{ __('dashboard.edit') }}</span>
                                            </a>
                                            <x-row-actions-divider />
                                            <x-row-action-form icon="delete"
                                                               :action="route('admin.locales.delete', ['id' => $item->id, 'locale' => $current])"
                                                               :confirm="$item->code === $current
                                                                   ? __('Delete :name (current language)?', ['name' => $item->name])
                                                                   : __('dashboard.confirm_delete')">{{ __('dashboard.delete') }}</x-row-action-form>
                                        </x-row-actions>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="text-muted">{{ __('No locales yet.') }}</td>
                                </tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </div>

    @foreach($locales as $item)
        <x-drawer :id="'locale-'.$item->id" :title="$item->name" :subtitle="__('dashboard.update_locale')">
            <form id="locale-form-{{ $item->id }}" method="POST" enctype="multipart/form-data"
                  action="{{ route('admin.locales.update', ['locale' => $current, 'id' => $item->id]) }}">
                @csrf
                <div class="form-group mb-3">
                    <label for="locale-name-{{ $item->id }}" class="form-label">{{ __('dashboard.locale_name') }}</label>
                    <input type="text" name="name" class="form-control" id="locale-name-{{ $item->id }}" value="{{ $item->name }}" required>
                </div>
                <div class="form-group mb-3">
                    <label for="locale-code-{{ $item->id }}" class="form-label">{{ __('dashboard.locale_code') }}</label>
                    <input type="text" name="code" class="form-control" id="locale-code-{{ $item->id }}" value="{{ $item->code }}" required>
                    <small class="text-muted">{{ __('Needs a matching translation folder.') }}</small>
                </div>
                <div class="form-group mb-3">
                    <label for="locale-flag-{{ $item->id }}" class="form-label">{{ __('dashboard.flag_image') }}</label>
                    <div class="d-flex align-items-center gap-3">
                        @if($item->flag_image)
                            <img src="{{ asset($item->flag_image) }}" alt="" class="cl-flag">
                        @else
                            <span class="cl-flag cl-flag-empty">{{ Str::upper($item->code) }}</span>
                        @endif
                        <input type="file" name="flag_image" class="form-control" id="locale-flag-{{ $item->id }}" accept="image/*">
                    </div>
                    <small class="text-muted">{{ __('Leave empty to keep the current flag.') }}</small>
                </div>
                {{-- No hidden "0": the controller checks $request->has('is_active'). --}}
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" name="is_active" value="1"
                           id="locale-active-{{ $item->id }}" @checked($item->is_active)>
                    <label class="form-check-label" for="locale-active-{{ $item->id }}">{{ __('dashboard.active') }}</label>
                </div>
            </form>
            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('dashboard.cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="locale-form-{{ $item->id }}">{{ __('Save') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach

    <x-drawer id="locale-new" :title="__('dashboard.add_locale')" :autoopen="$errors->any()">
        <form id="locale-new-form" action="{{ route('admin.locales.store', ['locale' => $current]) }}"
              method="POST" enctype="multipart/form-data">
            @csrf
            <div class="form-group mb-3">
                <label for="locale_name" class="form-label">{{ __('dashboard.locale_name') }}</label>
                <input type="text" name="name" class="form-control" id="locale_name" value="{{ old('name') }}" placeholder="Français" required> {{-- i18n-ignore --}}
                @error('name')<span class="text-danger">{{ $message }}</span>@enderror
            </div>
            <div class="form-group mb-3">
                <label for="locale_code" class="form-label">{{ __('dashboard.locale_code') }}</label>
                <input type="text" name="code" class="form-control" id="locale_code" value="{{ old('code') }}" placeholder="fr" required>
                <small class="text-muted">{{ __('Needs a matching translation folder.') }}</small>
                @error('code')<span class="text-danger">{{ $message }}</span>@enderror
            </div>
            <div class="form-group mb-3">
                <label for="flag_image" class="form-label">{{ __('dashboard.flag_image') }}</label>
                <input type="file" name="flag_image" class="form-control" id="flag_image" accept="image/*" required>
                @error('flag_image')<span class="text-danger">{{ $message }}</span>@enderror
            </div>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" name="is_active" value="1" id="is_active" checked>
                <label class="form-check-label" for="is_active">{{ __('dashboard.active') }}</label>
            </div>
        </form>
        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('dashboard.cancel') }}</button>
            <button class="btn btn-sm btn-primary" form="locale-new-form">{{ __('dashboard.add_locale') }}</button>
        </x-slot>
    </x-drawer>
@endsection
