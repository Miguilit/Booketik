{{--
    A destructive admin action, submitted as a form.

    These used to be plain links. A GET request carries no CSRF token, so any
    page an administrator visited while signed in — a forum post with an <img>
    pointing at the URL, a link in an email, the browser's own prefetch of a
    hovered link — was enough to delete a record. Going through a form means the
    request carries the session's token and no third party can trigger it.

    The confirm prompt is the second half: the token stops a forged request, the
    prompt stops a mis-click by the person who is genuinely signed in. Pass
    :confirm="false" for an action not worth interrupting.

    ── Why the <form> is pushed to the end of the page ───────────────────────

    Several of these buttons sit inside another form — the currency rows, for
    one, wrap their whole card in one. A form cannot be nested in
    a form; the browser drops the inner one and the button then submits the
    *outer* form, which would save an edit instead of deleting the record. So
    only the button is rendered here, wired to its form by id, and the form
    itself is pushed to a stack the layout renders just before </body>.

    @param string action  Where to submit (a route() URL).
    @param string method  DELETE (default) or POST.
    @param string confirm Prompt text, or false for no prompt.
    @param string class   Classes for the button.
--}}
@props([
    'action',
    'method' => 'DELETE',
    'confirm' => null,
    'class' => 'btn btn-sm btn-danger',
])

@php($formId = 'destructive-'.substr(md5($action.$method.$slot), 0, 12))

<button type="submit" form="{{ $formId }}"
        @if ($confirm !== false)
            onclick="return confirm(@js($confirm ?? __('dashboard.confirm_delete')))"
        @endif
        {{ $attributes->merge(['class' => $class]) }}>{{ $slot }}</button>

@push('destructive-forms')
    <form id="{{ $formId }}" method="POST" action="{{ $action }}">
        @csrf
        @method($method)
    </form>
@endpush
