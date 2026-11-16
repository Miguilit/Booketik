{{--
    A link inside <x-row-actions>. Use for anything that navigates: edit, view,
    download, open a detail screen.

    Anything that *changes* something must not be a link — use
    <x-row-action-form>, which posts with a CSRF token and a verb.
--}}
@props([
    'href',
    'icon' => null,
    'tone' => null,
    'target' => null,
])

<a href="{{ $href }}"
   @if($target) target="{{ $target }}" rel="noopener" @endif
   role="menuitem"
   {{ $attributes->class(['row-actions-item', 'is-'.$tone => $tone !== null]) }}>
    @if($icon)
        <i class="mdi mdi-{{ $icon }}" aria-hidden="true"></i>
    @endif
    <span>{{ $slot }}</span>
</a>
