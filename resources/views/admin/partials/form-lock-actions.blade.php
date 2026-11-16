{{--
    The read-only-until-Edit bar at the top of a detail form.

    Include it as the first child of the <form>. form-lock.js finds the form
    through `data-lock-bar` (a partial cannot put an attribute on its parent),
    locks every field on load and swaps Edit for Cancel + Save. Without the
    script the bar is a plain Save button and the form is fully editable —
    the lock fails open.

    $saveLabel defaults to "Save"; $sticky=false for small forms.
--}}
@php
    $saveLabel = $saveLabel ?? __('Save');
    $sticky = $sticky ?? true;
@endphp

<div class="form-lock-bar {{ $sticky ? 'form-lock-bar--sticky' : 'form-lock-bar--inline' }}" data-lock-bar>
    <span class="form-lock-badge form-lock-badge--locked"><i class="mdi mdi-lock-outline" aria-hidden="true"></i> {{ __('Read-only') }}</span>
    <span class="form-lock-badge form-lock-badge--editing"><i class="mdi mdi-pencil" aria-hidden="true"></i> {{ __('Editing') }}</span>
    <div class="form-lock-bar__actions">
        <button type="button" class="btn btn-secondary" data-lock-edit>{{ __('Edit') }}</button>
        <button type="button" class="btn btn-secondary" data-lock-cancel>{{ __('Cancel') }}</button>
        <button type="submit" class="btn btn-primary" data-lock-save>{{ $saveLabel }}</button>
    </div>
</div>
