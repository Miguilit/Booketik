{{--
    Flash messages, as toasts.

    This used to render an alert banner inside the page, which pushed
    everything below it down the moment a save came back and left a dead strip
    of colour behind until somebody dismissed it. A toast says the same thing
    over the page, times itself out, and moves nothing.

    Still rendered server-side: the message belongs to the response that
    carried it. It is printed as JSON and shown by panel-actions.js, so the
    text is escaped by Blade rather than by hand.

    `error` and `warning` stay different tones: an error means the action did
    not happen, a warning means it did but will not have the effect the
    operator expects.
--}}
@php
    $flashes = [];

    foreach (['success' => 'ok', 'error' => 'bad', 'warning' => 'warn', 'status' => null] as $key => $tone) {
        if (session()->has($key)) {
            $flashes[] = ['tone' => $tone, 'text' => (string) session($key)];
        }
    }

    foreach ($errors->all() as $error) {
        $flashes[] = ['tone' => 'bad', 'text' => $error];
    }
@endphp

@if($flashes)
    <script type="application/json" data-flash>@json($flashes)</script>
@endif
