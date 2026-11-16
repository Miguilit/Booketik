@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp

    <div class="card card-default">
        <div class="card-header card-header-border-bottom"><h2>{{ __('Edit FAQ') }}</h2></div>
        <div class="card-body">
            @include('admin.partials.flash')

            <form method="POST" action="{{ route('admin.faqs.update', ['locale' => $locale, 'id' => $faq->id]) }}">
                @csrf

                @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save FAQ')])
                <div class="mb-3">
                    <label class="form-label" for="question">{{ __('Question') }}</label>
                    <input type="text" class="form-control" id="question" name="question"
                           value="{{ old('question', $faq->question) }}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label" for="answer">{{ __('Answer') }}</label>
                    <textarea class="form-control" id="answer" name="answer" rows="8" required>{{ old('answer', $faq->answer) }}</textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label" for="category">{{ __('Category') }}</label>
                        <input type="text" class="form-control" id="category" name="category"
                               value="{{ old('category', $faq->category) }}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label" for="sort_order">{{ __('Sort order') }}</label>
                        <input type="number" min="0" class="form-control" id="sort_order" name="sort_order"
                               value="{{ old('sort_order', $faq->sort_order) }}">
                    </div>
                </div>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" name="is_active" value="1" id="is_active"
                           @checked(old('is_active', $faq->is_active))>
                    <label class="form-check-label" for="is_active">{{ __('Active') }}</label>
                </div>
                <a class="btn btn-secondary" href="{{ route('admin.faqs.index', ['locale' => $locale]) }}">{{ __('Back') }}</a>
            </form>
        </div>
    </div>
@endsection
