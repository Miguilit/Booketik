{{-- Shared by create and edit. `$post` is null when creating. --}}
@php $post = $post ?? null; @endphp

@csrf

{{-- A new post has nothing to protect and every field needs filling, so create
     renders unlocked with the button at the foot; an existing one starts
     read-only behind the bar. --}}
@if($post)
    @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save changes')])
@endif

<div class="row">
    <div class="col-md-8 mb-3">
        <label class="form-label" for="title">{{ __('Title') }}</label>
        <input type="text" class="form-control" id="title" name="title" required value="{{ old('title', $post?->title) }}">
    </div>
    <div class="col-md-4 mb-3">
        <label class="form-label" for="slug">{{ __('Slug') }}</label>
        <input type="text" class="form-control" id="slug" name="slug" value="{{ old('slug', $post?->slug) }}"
               placeholder="{{ __('Generated from the title') }}">
    </div>
</div>

<div class="mb-3">
    <label class="form-label" for="excerpt">{{ __('Excerpt') }}</label>
    <textarea class="form-control" id="excerpt" name="excerpt" rows="2">{{ old('excerpt', $post?->excerpt) }}</textarea>
</div>

<div class="mb-3">
    <label class="form-label" for="content">{{ __('Content') }}</label>
    <textarea class="form-control" id="content" name="content" rows="14">{{ old('content', $post?->content) }}</textarea>
</div>

<div class="row">
    <div class="col-md-3 mb-3">
        <label class="form-label" for="author">{{ __('Author') }}</label>
        <input type="text" class="form-control" id="author" name="author" value="{{ old('author', $post?->author) }}">
    </div>
    <div class="col-md-3 mb-3">
        <label class="form-label" for="blog_category_id">{{ __('Category') }}</label>
        <select class="form-control" id="blog_category_id" name="blog_category_id">
            <option value="">{{ __('Uncategorised') }}</option>
            @foreach($categories as $category)
                <option value="{{ $category->id }}"
                        @selected((int) old('blog_category_id', $post?->blog_category_id) === $category->id)>
                    {{ $category->name }}
                </option>
            @endforeach
        </select>
    </div>
    <div class="col-6 col-md-2 mb-3">
        <label class="form-label" for="read_time">{{ __('Read time') }}</label>
        <input type="text" class="form-control" id="read_time" name="read_time"
               value="{{ old('read_time', $post?->read_time) }}" placeholder="{{ __('5 min') }}">
    </div>
    <div class="col-md-4 mb-3">
        <label class="form-label" for="published_at">{{ __('Publish at') }}</label>
        <input type="datetime-local" class="form-control" id="published_at" name="published_at"
               value="{{ old('published_at', $post?->published_at?->format('Y-m-d\TH:i')) }}">
        <small class="text-muted">{{ __('Leave empty to keep it a draft.') }}</small>
    </div>
</div>

<div class="mb-3">
    <label class="form-label" for="image">{{ __('Header image URL') }}</label>
    <input type="text" class="form-control" id="image" name="image" value="{{ old('image', $post?->image) }}">
</div>

<div class="row">
    <div class="col-md-6 mb-3">
        <label class="form-label" for="seo_title">{{ __('SEO title') }}</label>
        <input type="text" class="form-control" id="seo_title" name="seo_title" value="{{ old('seo_title', $post?->seo_title) }}">
    </div>
    <div class="col-md-6 mb-3">
        <label class="form-label" for="seo_description">{{ __('SEO description') }}</label>
        <input type="text" class="form-control" id="seo_description" name="seo_description"
               value="{{ old('seo_description', $post?->seo_description) }}">
    </div>
</div>

<div class="form-check mb-4">
    <input class="form-check-input" type="checkbox" name="featured" value="1" id="featured"
           @checked(old('featured', $post?->featured))>
    <label class="form-check-label" for="featured">{{ __('Featured') }}</label>
</div>

@unless($post)
    <button type="submit" class="btn btn-primary">{{ __('Create post') }}</button>
@endunless
