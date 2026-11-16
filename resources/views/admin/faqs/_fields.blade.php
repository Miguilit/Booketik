@php $new = ! $faq->exists; @endphp
<div class="mb-3">
    <label class="form-label" for="{{ $prefix }}-question">{{ __('Question') }}</label>
    <input type="text" class="form-control" id="{{ $prefix }}-question" name="question"
           value="{{ $new ? old('question') : $faq->question }}" required>
</div>
<div class="mb-3">
    <label class="form-label" for="{{ $prefix }}-answer">{{ __('Answer') }}</label>
    <textarea class="form-control" id="{{ $prefix }}-answer" name="answer" rows="8" required>{{ $new ? old('answer') : $faq->answer }}</textarea>
</div>
<div class="row">
    <div class="col-6 mb-3">
        <label class="form-label" for="{{ $prefix }}-category">{{ __('Category') }}</label>
        <input type="text" class="form-control" id="{{ $prefix }}-category" name="category"
               value="{{ $new ? old('category') : $faq->category }}">
    </div>
    <div class="col-6 mb-3">
        <label class="form-label" for="{{ $prefix }}-sort">{{ __('Sort order') }}</label>
        <input type="number" min="0" class="form-control" id="{{ $prefix }}-sort" name="sort_order"
               value="{{ $new ? old('sort_order', 0) : $faq->sort_order }}">
    </div>
</div>
<div class="form-check mb-3">
    <input class="form-check-input" type="checkbox" name="is_active" value="1" id="{{ $prefix }}-active"
           @checked($new ? old('is_active', true) : $faq->is_active)>
    <label class="form-check-label" for="{{ $prefix }}-active">{{ __('Active') }}</label>
</div>
