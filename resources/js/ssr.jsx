/*
 | The Inertia SSR entry: `vite build --ssr` → bootstrap/ssr/ssr.js, served by
 | `php artisan inertia:start-ssr` (README: "Server-side rendering"). Laravel
 | posts each page object here and prints the HTML inside @inertia, so the
 | first paint needs no JavaScript; app.jsx then hydrates it.
 |
 | Everything the browser entry reads off <html> comes from the page's props
 | here (siteTheme, siteBrand, locale), and pages.jsx resolves the same
 | component for both. Modules must not touch window/document at import time
 | (they are imported in Node) — browser-only work belongs in effects.
 */
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';
import ThemeSwitcher from './Switcher/ThemeSwitcher';
import { dictionaryFor, setDictionary } from './Core/i18n';
import { setMoneyLocale } from './Core/lib/money';
import { resetZoneNames, setRenderClock, zoneNamesSnapshot } from './Core/events';
import { appTree, DEFAULT_THEME, loadRoots, pageResolver, pageTitle } from './pages';

createServer(async (page) => {
    const theme = page.props?.siteTheme?.key || DEFAULT_THEME;
    const locale = String(page.props?.locale || 'en');
    const [{ AuthRoot, PaymentsRoot }, dictionary] = await Promise.all([loadRoots(theme), dictionaryFor(locale)]);

    let zones = {};
    const renderedAt = Date.now();
    const rendered = await createInertiaApp({
        page,
        // The render is synchronous: the zone names recorded during it are
        // this page's alone (see zoneAbbr in Core/events.js).
        render: (element) => {
            resetZoneNames();
            setRenderClock(renderedAt);
            const html = ReactDOMServer.renderToString(element);
            zones = zoneNamesSnapshot();
            return html;
        },
        title: pageTitle(page.props?.siteBrand?.name || ''),
        resolve: pageResolver(theme),
        setup: ({ App, props }) => {
            // One process renders every language: install this page's
            // dictionary now — the render that follows is synchronous.
            setDictionary(dictionary, locale.toLowerCase().split('-')[0]);
            setMoneyLocale(locale);
            return appTree({ App, props, AuthRoot, PaymentsRoot, ThemeSwitcher });
        },
    });

    const json = JSON.stringify(zones).replace(/</g, '\\u003c');
    return { ...rendered, head: [...(rendered.head ?? []), `<script>window.__EG_ZONES=${json};window.__EG_NOW=${renderedAt}</script>`] };
}, {
    // Loopback only (Inertia's default is every interface): Laravel is the
    // one client. INERTIA_SSR_URL must match.
    host: process.env.INERTIA_SSR_HOST || '127.0.0.1',
    port: Number(process.env.INERTIA_SSR_PORT || 13714),
});
