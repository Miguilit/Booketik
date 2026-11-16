import { useCallback } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * Page-context hooks shared by the shell and by every component inside it.
 *
 * These live in their own module, not in `Layout.jsx`, because `NavBar` and
 * `Footer` need them *and* `Layout` renders those two. Keeping the hooks here
 * breaks that cycle instead of relying on module-evaluation order.
 */
export function useLocale() {
    return usePage().props.locale ?? 'en';
}

/**
 * Locale-prefixed URL builder — every site route lives under `/{locale}`.
 *
 * Memoised on the locale, and that is not a micro-optimisation: this function
 * is used inside `useEffect` dependency arrays. Returning a fresh closure each
 * render made any such effect re-run on every render, so an effect that fetched
 * and then set state re-triggered itself — an unbounded request loop that trips
 * the route's rate limiter within a second and surfaces as a 429.
 */
export function useRoute() {
    const locale = useLocale();

    return useCallback((path = '') => `/${locale}${path}`, [locale]);
}

export function useViewer() {
    const { auth } = usePage().props;
    return auth?.user ?? null;
}

/**
 * The site's brand: `{ name, logoUrl, faviconUrl, showMark, showName }`.
 *
 * Set by the operator under Admin → Appearance → Branding (App\Support\SiteBrand
 * on the server). `name` falls back to APP_NAME, then to the document's
 * `data-site-name`.
 *
 * The header's brand follows the "Header shows" setting (`logoDisplay`):
 *   logo_text  the logo, then the name
 *   logo       the logo alone
 *   text       the name alone
 * A wordmark renders `logoUrl` (the uploaded logo) when set, else its own
 * designed mark when `showMark` (e.g. /app-icon.png), and the name when
 * `showName`. A theme with no mark of its own shows the name when there is
 * no logo either, so its header is never blank.
 */
export function useSiteBrand() {
    const { siteBrand, webSettings } = usePage().props;
    const brand = siteBrand ?? {};
    const name = brand.name
        || webSettings?.site_name
        || (typeof document !== 'undefined' ? document.documentElement.dataset.siteName : '')
        || '';
    const display = brand.logoDisplay ?? 'logo_text';
    const uploaded = brand.logoUrl ?? null;

    return {
        name,
        logoUrl: display === 'text' ? null : uploaded,
        faviconUrl: brand.faviconUrl ?? null,
        showMark: display !== 'text',
        showName: display !== 'logo',
    };
}
