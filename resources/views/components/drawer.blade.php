@props(['id', 'title' => '', 'subtitle' => null, 'wide' => false, 'autoopen' => false, 'stack' => false])

{{--
    A right-hand edit panel. Trigger it from anywhere with
    `data-drawer="#its-id"`; the behaviour is delegated in panel-actions.js.

    The slot is the whole panel body; pass the footer (Save, Cancel) in the
    `footer` slot so it stays pinned while the body scrolls.
--}}
<div id="{{ $id }}"
     class="cl-drawer {{ $wide ? 'cl-drawer--wide' : '' }}"
     role="dialog"
     aria-modal="true"
     aria-hidden="true"
     aria-label="{{ $title }}"
     @if($autoopen) data-drawer-autoopen @endif
     @if($stack) data-drawer-stack @endif>
    <div class="cl-drawer__head">
        <div>
            <h3 class="cl-drawer__title">{{ $title }}</h3>
            @if($subtitle)
                <p class="cl-drawer__sub">{{ $subtitle }}</p>
            @endif
        </div>
        <button type="button" class="cl-drawer__close" data-drawer-close aria-label="Close">&times;</button>
    </div>

    <div class="cl-drawer__body">
        {{ $slot }}
    </div>

    @isset($footer)
        <div class="cl-drawer__foot">{{ $footer }}</div>
    @endisset
</div>
