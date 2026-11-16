import { useSyncExternalStore } from 'react';

/**
 * Light / dark — the site-wide *mode*, shared by every theme.
 *
 * "Theme" is the storefront design (Civic, Marquee, Almanac); "mode" is light or
 * dark inside whichever theme is showing. The mode lives in the browser only
 * (`localStorage.site_mode`), so it survives a theme switch — which is a full
 * page load — and needs no server round trip to change.
 *
 * The inline script in app.blade.php applies the stored mode before first
 * paint; this module owns every change after that. Both read the same key
 * and the same fallback — `<html data-default-mode>`, the active theme's
 * preference — so they can never disagree about what "unset" means.
 *
 * Stored values: `light`, `dark` or `system` (follow the OS, live).
 */

const KEY = 'site_mode';
const MODES = ['light', 'dark', 'system'];

const listeners = new Set();
let media = null;

const root = () => document.documentElement;

function systemDark() {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** The chosen mode: an explicit pick, else the theme's default, else system. */
export function currentMode() {
    try {
        const stored = localStorage.getItem(KEY);
        if (MODES.includes(stored)) return stored;
    } catch {
        // Storage blocked — fall through to the theme's default.
    }

    const fallback = root().dataset.defaultMode;
    return MODES.includes(fallback) ? fallback : 'system';
}

/** Whether the page is rendering dark right now. */
export function isDark() {
    return root().classList.contains('dark');
}

function apply(mode) {
    const dark = mode === 'dark' || (mode === 'system' && systemDark());
    root().classList.toggle('dark', dark);
    root().style.colorScheme = dark ? 'dark' : 'light';
}

function emit() {
    listeners.forEach((listener) => listener());
    // Non-React consumers (Stripe's appearance, the cookie banner) listen here.
    window.dispatchEvent(new CustomEvent('site-mode-change', { detail: { dark: isDark() } }));
}

/**
 * Change the mode. Cross-fades through the View Transitions API where the
 * browser has it and the visitor has not asked for reduced motion; otherwise
 * the swap is instant, which is the correct fallback rather than a lesser one.
 */
export function setMode(mode) {
    if (!MODES.includes(mode)) return;

    try {
        localStorage.setItem(KEY, mode);
    } catch {
        // Not persisted, but still applied for this page view.
    }

    const run = () => {
        apply(mode);
        emit();
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !reduce) {
        document.startViewTransition(run);
    } else {
        run();
    }
}

/** Flip between light and dark, leaving `system` behind as an explicit pick. */
export function toggleMode() {
    setMode(isDark() ? 'light' : 'dark');
}

function subscribe(listener) {
    listeners.add(listener);

    // While the mode is `system`, follow the OS as it changes (sunset
    // schedules, a user flipping it in settings) without a reload.
    if (!media && window.matchMedia) {
        media = window.matchMedia('(prefers-color-scheme: dark)');
        media.addEventListener?.('change', () => {
            if (currentMode() === 'system') {
                apply('system');
                emit();
            }
        });
    }

    return () => listeners.delete(listener);
}

// A primitive snapshot, so useSyncExternalStore sees a stable value.
const snapshot = () => `${currentMode()}|${isDark() ? 'dark' : 'light'}`;
const serverSnapshot = () => 'system|light';

/** `{ mode, dark, setMode, toggleMode }` — re-renders on every change. */
export function useMode() {
    const [mode, resolved] = useSyncExternalStore(subscribe, snapshot, serverSnapshot).split('|');
    return { mode, dark: resolved === 'dark', setMode, toggleMode };
}
