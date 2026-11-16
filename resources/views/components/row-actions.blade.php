{{--
    The three-dot actions menu that ends every table row in the panel.

    Every list screen used to end in a row of loose `btn-sm` buttons, which
    meant the last column was a different width on every screen, a third action
    pushed the table into horizontal scroll, and "delete" sat one careless
    click away from "edit". One menu per row fixes all three: fixed-width
    column, unlimited actions, destructive ones separated and tinted.

    Usage:

        <x-row-actions>
            <x-row-action :href="route('admin.courses.edit', [...])" icon="pencil">Edit</x-row-action>
            <x-row-actions-divider />
            <x-row-action-form :action="route('admin.courses.destroy', [...])"
                               icon="delete" tone="danger"
                               confirm="Delete this course?">Delete</x-row-action-form>
        </x-row-actions>

    The menu is moved to <body> while open — see row-actions in
    panel-actions.js. Bootstrap's own dropdown is not used because every one
    of these lives inside a `.table-responsive`, whose `overflow:auto` clips an
    absolutely positioned menu to the scroll box.
--}}
@props(['label' => null])

@php $label = $label ?? __('dashboard.action'); @endphp

<div class="row-actions" data-row-actions>
    <button type="button"
            class="row-actions-toggle"
            data-row-actions-toggle
            aria-haspopup="true"
            aria-expanded="false"
            title="{{ $label }}">
        <i class="mdi mdi-dots-vertical" aria-hidden="true"></i>
        <span class="sr-only">{{ $label }}</span>
    </button>

    <div class="row-actions-menu" data-row-actions-menu role="menu" hidden>
        {{ $slot }}
    </div>
</div>
