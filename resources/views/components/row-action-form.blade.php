{{--
    An action inside <x-row-actions> that changes something: delete, approve,
    toggle, restore.

    It renders a real form so the request carries a CSRF token and the verb the
    route expects. The panel used to delete over GET (`/faqs/{id}/delete` as an
    `<a>`), which meant a link preloader, a crawler following an authenticated
    session, or a mistyped URL could destroy a row — and no confirm dialog
    stops any of those, because none of them clicks.

    `confirm` is read by the delegated handler in panel-actions.js rather than
    an inline `onclick`, so a Content-Security-Policy without 'unsafe-inline'
    does not silently remove the guard.

    @param string $action  Route URL.
    @param string $method  HTTP verb the route expects. DELETE by default.
    @param string|null $confirm  Text for the confirm dialog. Omit for non-destructive actions.
    @param array $fields  Extra hidden inputs, e.g. ['status' => 'approved'].
    @param string|null $async  Posts in the background and reports in a toast
                               instead of reloading. The value names the kind
                               of action, which is what the script uses to
                               decide what to do with the answer.
    @param string|null $asyncLabel  What the toast says while it waits.
--}}
@props([
    'action',
    'method' => 'DELETE',
    'confirm' => null,
    'icon' => null,
    'tone' => 'danger',
    'fields' => [],
    'async' => null,
    'asyncLabel' => null,
])

<form method="POST"
      action="{{ $action }}"
      class="row-actions-form"
      @if($confirm) data-confirm="{{ $confirm }}" @endif
      @if($async) data-async="{{ $async }}" @endif
      @if($asyncLabel) data-async-label="{{ $asyncLabel }}" @endif>
    @csrf
    @if(strtoupper($method) !== 'POST')
        @method($method)
    @endif

    @foreach($fields as $name => $value)
        <input type="hidden" name="{{ $name }}" value="{{ $value }}">
    @endforeach

    <button type="submit"
            role="menuitem"
            {{ $attributes->class(['row-actions-item', 'is-'.$tone => filled($tone)]) }}>
        @if($icon)
            <i class="mdi mdi-{{ $icon }}" aria-hidden="true"></i>
        @endif
        <span>{{ $slot }}</span>
    </button>
</form>
