import { useSyncExternalStore } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * Open/closed state for the theme switcher.
 *
 * A module-level store rather than React state: the dialog (mounted once in
 * app.jsx), the bookmark ribbon and every theme's header "Themes" item share
 * no common ancestor, and each must open the same dialog.
 */
let open = false;
const listeners = new Set();

function emit() {
    listeners.forEach((listener) => listener());
}

export function openThemeSwitcher() {
    if (open) return;
    open = true;
    emit();
}

export function closeThemeSwitcher() {
    if (!open) return;
    open = false;
    emit();
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useSwitcherOpen() {
    return useSyncExternalStore(subscribe, () => open, () => false);
}

/**
 * What a theme's header needs: whether to show the "Themes" item (demo mode
 * or local only — the server decides), the current theme, and the opener.
 */
export function useThemeSwitcher() {
    const siteTheme = usePage().props.siteTheme ?? {};

    return {
        enabled: Boolean(siteTheme.switcher),
        current: siteTheme.key ?? 'classic',
        name: siteTheme.name ?? 'Classic',
        open: openThemeSwitcher,
    };
}
