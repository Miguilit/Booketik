import './bootstrap';
// No CSS import: the root view links one theme's theme.css itself
// (ThemeRegistry::cssEntry), so only one stylesheet is ever on the page.

import { createRoot, hydrateRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { useEffect } from 'react';
import ThemeSwitcher from './Switcher/ThemeSwitcher';
import { loadDictionary } from './Core/i18n';
import { markHydrated } from './Core/events';
import { appTree, DEFAULT_THEME, loadRoots, pageResolver, pageTitle } from './pages';

/*
 | The site's name for the tab title, stamped on <html> by the server
 | (App\Support\SiteBrand: Admin → Appearance → Branding, else APP_NAME).
 */
const root = document.documentElement;
const SITE_NAME = root.dataset.siteName || '';

/*
 | The storefront theme this document booted in, stamped on <html> by the
 | server. Read once: changing theme is always a full page load (the switch
 | endpoint answers with Inertia::location, and a theme mismatch changes the
 | Inertia asset version), so it cannot change under a running app.
 */
const THEME = root.dataset.siteTheme || DEFAULT_THEME;

/*
 | Google Analytics is the gtag snippet in app.blade.php, printed only when
 | GOOGLE_ANALYTICS_ID is set; nothing in the bundle loads it.
 */
function withHydration(App) {
    return function AppWithHydration(props) {
        // Effects run after hydration: from here on, renders use the real
        // clock and the visitor's zone (Core/events.js).
        useEffect(markHydrated, []);
        return <App {...props} />;
    };
}

// The visitor's language is loaded before the first render (Core/i18n.js), so no
// page ever flashes English first — and the hydrated text matches the server's.
Promise.all([loadRoots(THEME), loadDictionary(root.lang)]).then(([{ AuthRoot, PaymentsRoot }]) =>
    createInertiaApp({
        title: pageTitle(SITE_NAME),
        resolve: pageResolver(THEME),
        setup({ el, App, props }) {
            const tree = appTree({ App, props, AuthRoot, PaymentsRoot, ThemeSwitcher, wrap: withHydration });

            // Server-rendered (Inertia SSR): take over the markup. Otherwise
            // (the SSR process is down, or the page was not rendered): render it.
            if (el.hasChildNodes()) {
                hydrateRoot(el, tree);
            } else {
                createRoot(el).render(tree);
            }
        },
        progress: {
            // A bridge token, so the bar reads on both light and dark pages.
            color: 'rgb(var(--t-accent))',
        },
    }),
);
