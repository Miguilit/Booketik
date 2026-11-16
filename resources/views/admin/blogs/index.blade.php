@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp

    <div class="row">
        <div class="col-lg-8">
            <div class="card card-default">
                @include('admin.partials.flash')

                <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
                    <h2>{{ __('Blog posts') }}</h2>
                    <a href="{{ route('admin.blogs.create', ['locale' => $locale]) }}" class="btn btn-primary btn-sm">{{ __('New post') }}</a>
                </div>

                <div class="card-body">
                    <form method="GET" class="row g-2 mb-4">
                        <div class="col-md-9">
                            <input type="text" name="search" class="form-control" placeholder="{{ __('Title') }}"
                                   value="{{ $filters['search'] ?? '' }}">
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-secondary w-100">{{ __('Search') }}</button>
                        </div>
                    </form>

                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                            <tr>
                                <th>{{ __('Title') }}</th>
                                <th>{{ __('Category') }}</th>
                                <th>{{ __('Published') }}</th>
                                <x-row-actions-header />
                            </tr>
                            </thead>
                            <tbody>
                            @forelse($posts as $post)
                                <tr>
                                    <td>
                                        {{ $post->title }}
                                        @if($post->featured)
                                            <span class="badge bg-warning">{{ __('featured') }}</span>
                                        @endif
                                        <div><code class="text-muted">{{ $post->slug }}</code></div>
                                    </td>
                                    <td>{{ $post->category?->name ?? '—' }}</td>
                                    <td class="small">
                                        {{ $post->published_at?->format('Y-m-d')
                                            ?? '—' }}
                                        @if(! $post->published_at)
                                            <span class="badge bg-secondary">{{ __('draft') }}</span>
                                        @endif
                                    </td>
                                    <td class="row-actions-col">
                                        <x-row-actions>
                                            <x-row-action icon="pencil"
                                                          :href="route('admin.blogs.edit', ['locale' => $locale, 'id' => $post->id])">{{ __('Edit') }}</x-row-action>
                                            <x-row-actions-divider />
                                            <x-row-action-form icon="delete"
                                                               :action="route('admin.blogs.delete', ['locale' => $locale, 'id' => $post->id])"
                                                               :confirm="__('Delete :name?', ['name' => $post->title])">{{ __('Delete') }}</x-row-action-form>
                                        </x-row-actions>
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="4" class="text-muted">{{ __('No posts yet.') }}</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>

                    {{ $posts->links() }}
                </div>
            </div>
        </div>

        <div class="col-lg-4 cl-aside-sticky">
            <div class="card card-default">
                <div class="card-header">{{ __('Categories') }}</div>
                <div class="card-body">
                    <ul class="list-unstyled">
                        @forelse($categories as $category)
                            <li class="d-flex justify-content-between align-items-center mb-2">
                                <span>
                                    <span class="badge" style="background: {{ $category->color }}">&nbsp;</span>
                                    {{ $category->name }}
                                </span>
                                <x-row-actions>
                                    <x-row-action-form icon="delete"
                                                       :action="route('admin.blogs.categories.delete', ['locale' => $locale, 'id' => $category->id])"
                                                       :confirm="__('Delete :name? Its posts become uncategorised.', ['name' => $category->name])">{{ __('Delete category') }}</x-row-action-form>
                                </x-row-actions>
                            </li>
                        @empty
                            <li class="text-muted">{{ __('No categories yet.') }}</li>
                        @endforelse
                    </ul>

                    <form method="POST" action="{{ route('admin.blogs.categories.store', ['locale' => $locale]) }}">
                        @csrf
                        <div class="mb-3">
                            <label class="form-label" for="cat-name">{{ __('Name') }}</label>
                            <input type="text" class="form-control" id="cat-name" name="name" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="cat-color">{{ __('Colour') }}</label>
                            <input type="text" class="form-control" id="cat-color" name="color" value="#22c55e">
                        </div>
                        <button class="btn btn-primary btn-sm">{{ __('Add category') }}</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
