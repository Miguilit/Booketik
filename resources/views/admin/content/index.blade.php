@extends('admin.admin_master')
@section('admin')
    @php($locale = app()->getLocale())

    @include('admin.partials.flash')

    <div class="row">
        <div class="col-12">
            <div class="card card-default">

                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h2>{{ __('dashboard.pages') }}</h2>
                        <small class="text-muted">
                            {{ trans_choice(':count page|:count pages', $pages->count()) }}
                        </small>
                    </div>
                    {{-- Solutions is a versioned page type, not an ordinary HTML footer page. --}}
                    @if(config('booketik_solutions.admin_enabled') === true && \Illuminate\Support\Facades\Route::has('admin.solutions.edit'))
                        <a href="{{ route('admin.solutions.edit', ['locale' => $locale]) }}" class="btn btn-sm btn-outline-success">Solutions · Éditeur visuel</a>
                    @endif
                    <button type="button" class="btn btn-sm btn-primary" data-drawer="#page-new">{{ __('dashboard.add_page') }}</button>
                </div>

                <div class="card-body">
                    <div class="table-responsive">
                        <table id="basic-data-table" class="table nowrap mb-0" style="width:100%">
                            <thead>
                            <tr>
                                <th scope="col">{{ __('dashboard.name') }}</th>
                                <th scope="col">{{ __('dashboard.slug') }}</th>
                                <th scope="col">{{ __('Status') }}</th>
                                <x-row-actions-header />
                            </tr>
                            </thead>
                            <tbody>
                            @forelse($pages as $page)
                                <tr>
                                    <td>{{ $page->name }}</td>
                                    <td><code>/{{ ltrim($page->slug, '/') }}</code></td>
                                    <td>
                                        @if($page->is_active)
                                            <span class="badge bg-success">{{ __('Published') }}</span>
                                        @else
                                            <span class="badge bg-secondary">{{ __('Draft') }}</span>
                                        @endif
                                        @if(blank($page->html_content))
                                            <span class="badge bg-warning text-dark">{{ __('Empty') }}</span>
                                        @endif
                                    </td>
                                    <td class="row-actions-col">
                                        <x-row-actions>
                                            <x-row-action icon="pencil"
                                                          :href="route('admin.content.pages.edit', ['locale' => $locale, 'id' => $page->id])">{{ __('dashboard.edit') }}</x-row-action>
                                            <x-row-actions-divider />
                                            <x-row-action-form icon="delete"
                                                               :action="route('admin.content.pages.delete', ['locale' => $locale, 'id' => $page->id])"
                                                               :confirm="__('dashboard.confirm_delete')">{{ __('dashboard.delete') }}</x-row-action-form>
                                        </x-row-actions>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="text-muted">{{ __('No pages yet.') }}</td>
                                </tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <x-drawer id="page-new" wide :title="__('dashboard.add_page')" :autoopen="$errors->any()">
        <form id="page-new-form" action="{{ route('admin.content.pages.store', ['locale' => $locale]) }}" method="POST">
            @csrf
            <div class="form-group mb-3">
                <label for="page_name" class="form-label">{{ __('dashboard.page_name') }}</label>
                <input type="text" name="name" class="form-control" id="page_name"
                       value="{{ old('name') }}" required>
                @error('name')
                <span class="text-danger">{{ $message }}</span>
                @enderror
            </div>

            <div class="form-group mb-3">
                <label for="page_slug" class="form-label">{{ __('dashboard.page_slug') }}</label>
                <input type="text" name="slug" class="form-control" id="page_slug"
                       value="{{ old('slug') }}" placeholder="privacy-policy" required>
                @error('slug')
                <span class="text-danger">{{ $message }}</span>
                @enderror
            </div>

            <div class="form-group mb-3">
                <label for="page_body" class="form-label">{{ __('Body') }}</label>
                <textarea name="html_content" class="form-control" id="page_body" rows="8"
                          placeholder="<p>…</p>">{{ old('html_content') }}</textarea>
                <small class="text-muted">{{ __('HTML. Can be left empty for now.') }}</small>
            </div>

            <div class="row">
                <div class="col-6 mb-3">
                    <label for="page_sort" class="form-label">{{ __('Order') }}</label>
                    <input type="number" min="0" name="sort_order" class="form-control" id="page_sort"
                           value="{{ old('sort_order', 0) }}">
                </div>
                <div class="col-6 mb-3 d-flex align-items-end">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="1" name="is_active"
                               id="page_active" @checked(old('is_active', true))>
                        <label class="form-check-label" for="page_active">{{ __('Published') }}</label>
                    </div>
                </div>
            </div>

        </form>
        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
            <button class="btn btn-sm btn-primary" form="page-new-form">{{ __('dashboard.add_page') }}</button>
        </x-slot>
    </x-drawer>
@endsection
