@extends('admin.admin_master')
@section('admin')
    <div class="py-12">
        <div class="container">

            @if(session('success'))
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <strong>{{ session('success') }}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"
                            aria-label="{{ __('dashboard.close') }}"></button>
                </div>
            @endif
            <div class="row">
                <div class="col-md-12">
                    <div class="card-body">
                        <form
                            action="{{ route('admin.content.pages.update', ['locale' => app()->getLocale(), 'id' => $page->id]) }}"
                            method="POST">
                            @csrf

                            @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save page')])
                            <h3>
                                {{ $page->name}}
                            </h3><br>

                            <div class="form-group">
                                <label for="name" class="form-label">{{ __('dashboard.page_name') }}</label>
                                <input type="text" name="name" class="form-control"
                                       id="name"
                                       placeholder="{{ __('dashboard.page_name_placeholder') }}"
                                       value="{{ $page->name }}">
                            </div>

                            <div class="form-group mb-3 d-flex gap-4 align-items-end">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="1" name="is_active"
                                           id="is_active" @checked($page->is_active)>
                                    <label class="form-check-label" for="is_active">{{ __('Published') }}</label>
                                </div>
                                <div>
                                    <label for="sort_order" class="form-label mb-0">{{ __('Order') }}</label>
                                    <input type="number" min="0" name="sort_order" class="form-control"
                                           id="sort_order" value="{{ $page->sort_order }}">
                                </div>
                                <small class="text-muted">{{ __('Drafts are hidden until published.') }}</small>
                            </div>

                            <div class="form-group">
                                <label for="slug" class="form-label">{{ __('dashboard.page_slug') }}</label>
                                <input type="text" name="slug" class="form-control"
                                       id="slug"
                                       placeholder="{{ __('dashboard.page_slug_placeholder') }}"
                                       value="{{ $page->slug }}">
                            </div>

                            <div class="form-group">
                                <label for="html_content" class="form-label">{{ __('dashboard.page_content') }}</label>
                                <!-- Hidden input to store the content for form submission -->
                                <input id="html_content" type="hidden"
                                       name="html_content" value="{{ $page->html_content }}">
                                <!-- Trix Editor -->
                                <trix-editor input="html_content" class="trix-content"></trix-editor>
                            </div>

                            <div class="pt-4 mt-4 border-top"></div>
                            <div class="form-footer pt-4 mt-4">
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
