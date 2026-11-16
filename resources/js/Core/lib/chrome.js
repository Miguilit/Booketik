import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { createApi } from './api';
import { useLocale, useRoute, useSiteBrand, useViewer } from './useSite';
import { locale, t } from '@/Core/i18n';

/**
 * Site chrome — the header, its menus, the footer and the app banner — as
 * headless state. Every theme draws its own header and footer on top of these.
 */

/**
 * Close a popover on a mouse-down outside `ref` (and, with `escape`, on the
 * Escape key). Only listens while `open`.
 */
export function useDismiss(open, close, ref, { escape = false } = {}) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const onClick = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                close();
            }
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('mousedown', onClick);
        if (escape) document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onClick);
            if (escape) document.removeEventListener('keydown', onKeyDown);
        };
        // `close` is a fresh closure each render; the listener only needs the
        // latest `open` and the ref.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
}

/* ── Notifications ─────────────────────────────────────────────────────── */

/** The locale's own short relative time ("5 min ago", "vor 3 Std.", "منذ يومين"). */
function relative(amount, unit) {
    try {
        return new Intl.RelativeTimeFormat(locale(), { numeric: 'always', style: 'short' }).format(-amount, unit);
    } catch {
        return `${amount}${unit[0]}`;
    }
}

/** "just now", then "5 min ago", "3 hr ago", "2 days ago" — in the visitor's language. */
export function timeAgo(value) {
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) {
        return t('just now');
    }

    if (mins < 60) {
        return relative(mins, 'minute');
    }

    const hrs = Math.floor(mins / 60);

    if (hrs < 24) {
        return relative(hrs, 'hour');
    }

    return relative(Math.floor(hrs / 24), 'day');
}

/**
 * The header's notifications bell: loads the latest ten on mount, and opening
 * the dropdown marks everything read. Attach `ref` to the bell's wrapper so a
 * click outside closes it.
 */
export function useNotifications() {
    const viewer = useViewer();
    const api = useMemo(() => createApi(viewer?.token), [viewer?.token]);

    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        let cancelled = false;

        api
            .get('/notifications?limit=10')
            .then((state) => {
                if (!cancelled) {
                    setItems(state.items ?? []);
                    setUnread(state.unread ?? 0);
                    setLoaded(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLoaded(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [api]);

    useDismiss(open, () => setOpen(false), ref);

    const toggle = () => {
        const next = !open;
        setOpen(next);

        if (next && unread > 0) {
            // Optimistically clear the badge, then persist. A failed write
            // means the badge comes back on the next page load, which is a
            // better outcome than a spinner on a dropdown.
            setUnread(0);
            setItems((prev) => prev.map((item) => ({ ...item, read: true })));
            api.post('/notifications/read', {}).catch(() => {});
        }
    };

    return {
        open,
        setOpen,
        toggle,
        items,
        unread,
        /** The badge text: the count, capped at "9+". */
        unreadLabel: unread > 9 ? '9+' : String(unread),
        loaded,
        ref,
    };
}

/* ── Language ──────────────────────────────────────────────────────────── */

/**
 * The language switcher.
 *
 * Unlike the Next.js original — which flips i18next client-side — the locale
 * here is the **first path segment**, so switching is a navigation to the same
 * page under a different prefix. That keeps the URL honest and makes a shared
 * link carry its language.
 *
 * The list comes from `Locale::panel()` (shared as `locales`), which is what
 * `resources/lang/` actually has strings for — not the wider list the mobile
 * apps offer. See the README's "two language lists" note.
 *
 * `enabled` is false when there is only one language — render nothing then.
 */
export function useLanguageSelector() {
    const locale = useLocale();
    const page = usePage();
    const locales = page.props.locales ?? [];
    const currentUrl = page.url;

    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useDismiss(open, () => setOpen(false), ref);

    const current = locales.find((item) => item.code === locale) ?? locales[0];

    const change = (code) => {
        setOpen(false);
        // Swap only the locale segment; everything after it is the same page.
        // A full load, not an Inertia visit: the new language's dictionary,
        // <html lang> and dir (right-to-left for Arabic) are set by the server
        // and at boot, and a client-side visit would keep the old ones.
        window.location.assign(currentUrl.replace(/^\/[^/?]+/, `/${code}`));
    };

    return {
        enabled: locales.length > 1,
        locales,
        locale,
        current,
        isCurrent: (code) => code === locale,
        open,
        setOpen,
        toggle: () => setOpen((value) => !value),
        change,
        ref,
    };
}

/* ── Account menu ──────────────────────────────────────────────────────── */

/**
 * The signed-in account menu.
 *
 * Sign-out is a POST through Inertia, not a link. A GET that ends a session can
 * be fired by a prefetch or an image tag.
 */
export function useUserMenu(user) {
    const url = useRoute();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const displayName = user?.name || user?.email?.split('@')[0] || t('Account');

    useDismiss(open, () => setOpen(false), ref, { escape: true });

    const signOut = () => {
        setOpen(false);
        router.post(url('/sign-out'));
    };

    return {
        open,
        setOpen,
        toggle: () => setOpen((value) => !value),
        close: () => setOpen(false),
        ref,
        displayName,
        /** The avatar letter. */
        initial: displayName.charAt(0).toUpperCase(),
        isAdmin: Boolean(user?.isAdmin),
        signOut,
    };
}

/* ── Open-in-app banner ────────────────────────────────────────────────── */

const DISMISS_KEY = 'eventgoo.appBanner.dismissed';

/**
 * The route segment of a `/{locale}/{segment}/…` path.
 *
 * The locale is matched by shape rather than against a list, exactly as the
 * app's own parser does — the site's locale set is the server's business and
 * can grow without this needing to know.
 */
function pageSegment(pathname) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;

    const isLocale = /^[a-z]{2,5}(-[A-Za-z]{2,4})?$/.test(parts[0]);
    return (isLocale ? parts[1] : parts[0]) ?? null;
}

/**
 * Where the Open button goes.
 *
 * The path is read from `window.location` — the one case where that is
 * correct, because the banner opens *the page you are on* rather than sending
 * a link somewhere else. The query string is dropped: the app routes on the
 * path alone.
 */
function openHref(banner, platform) {
    const path = window.location.pathname;
    const suffix = '';

    if (platform === 'ios') return banner.iosStoreUrl;

    const store = withReferrer(banner.androidStoreUrl, path + suffix);

    // Without a package name there is no intent to build, so the button
    // becomes a plain store link rather than a dead one.
    if (!banner.androidPackage) return store;

    return (
        `intent://${banner.host}${path}${suffix}#Intent` +
        ';scheme=https' +
        `;package=${banner.androidPackage}` +
        `;S.browser_fallback_url=${encodeURIComponent(store)}` +
        ';end'
    );
}

/**
 * Attach the Play Install Referrer payload.
 *
 * This is the whole of deferred deep linking on Android: Play hands the string
 * back to the app on first launch, so an install that started on an event page
 * can open on that event. `utm_content` carries the path because it is a
 * standard field — the campaign numbers keep working and the app already has a
 * parser for a path.
 *
 * Only added to the *Play* URL. An operator pointing at their own APK gets
 * their URL untouched, because appending Google's parameter to it would be
 * noise at best.
 */
function withReferrer(storeUrl, path) {
    if (!storeUrl || !storeUrl.includes('play.google.com')) return storeUrl;

    const referrer = new URLSearchParams({
        utm_source: 'web',
        utm_medium: 'app_banner',
        utm_campaign: 'open_in_app',
        utm_content: path,
    }).toString();

    const separator = storeUrl.includes('?') ? '&' : '?';
    return `${storeUrl}${separator}referrer=${encodeURIComponent(referrer)}`;
}

/**
 * The mobile "open this page in the app" strip.
 *
 * ## It only appears on pages the app can open
 *
 * `paths` comes from the server, and it is the same list published in
 * `assetlinks.json` and the Apple association file. Offering "open in app" on
 * the account page would open the app on nothing, which reads as the app being
 * broken rather than as the banner being wrong.
 *
 * ## Android and iOS get different links, for a specific reason
 *
 * Chrome does not hand a navigation to another app when the link is on the
 * page's own domain — so the banner is the one place a plain canonical URL is
 * guaranteed *not* to trigger App Links. `intent://` is Android's actual
 * mechanism for this and carries its own fallback, so one tap is right whether
 * or not the app is installed.
 *
 * iOS has the same same-domain rule and no `intent://` equivalent. The common
 * workaround — bounce through a custom scheme and race a timeout against the
 * App Store — shows every visitor *without* the app an error dialog, which is
 * most of the people who see a banner. So iOS gets a plain App Store link.
 *
 * Returns `{ visible, banner, platform, href, dismiss }`; render nothing unless
 * `visible`. `href` is only computed while visible (it reads `window`).
 */
export function useAppBanner() {
    const { appBanner } = usePage().props;

    /*
     * Starts hidden and is turned on by the effect below, never the other way
     * around. Everything this decides on — the user agent, the viewport,
     * localStorage — exists only in the browser, so deciding during render
     * would either flash the banner on desktop or throw on a server render.
     */
    const [visible, setVisible] = useState(false);
    const [platform, setPlatform] = useState(null);

    useEffect(() => {
        if (!appBanner) return;

        const ua = navigator.userAgent || '';
        const isAndroid = /Android/i.test(ua);
        // iPadOS reports itself as a Mac; the touch-point count is what still
        // separates the two.
        const isIos =
            /iPad|iPhone|iPod/.test(ua) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        const target = isAndroid ? 'android' : isIos ? 'ios' : null;
        if (!target) return;

        // Nothing to send this platform to.
        const store = target === 'android' ? appBanner.androidStoreUrl : appBanner.iosStoreUrl;
        if (!store) return;

        const segment = pageSegment(window.location.pathname);
        if (!segment || !appBanner.paths?.includes(segment)) return;

        try {
            if (window.localStorage.getItem(DISMISS_KEY)) return;
        } catch {
            // Private browsing, or storage blocked. Showing the banner is the
            // right way to be wrong here — a dismissal that cannot be recorded
            // is a banner that comes back, not one that never appears.
        }

        setPlatform(target);
        setVisible(true);
    }, [appBanner]);

    const dismiss = () => {
        setVisible(false);
        try {
            window.localStorage.setItem(DISMISS_KEY, '1');
        } catch {
            // Dismissed for this page load either way.
        }
    };

    const shown = Boolean(visible && appBanner);

    return {
        visible: shown,
        banner: appBanner ?? null,
        platform,
        href: shown ? openHref(appBanner, platform) : null,
        dismiss,
    };
}

/* ── Footer ────────────────────────────────────────────────────────────── */

/** The social networks the footer has an icon for, in display order. */
export const FOOTER_SOCIAL_KEYS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];

/**
 * The footer's data.
 *
 * Copy and links come from `webSettings`, which the panel edits — so the
 * operator changes the footer in one place and both the marketing pages and
 * the public site follow.
 *
 * Returns `{ webSettings, year, companyName, quickLinks, resources,
 * footerPages, socialLinks, socialHref(key) }`; the link lists are
 * `[{ name, url }]`, `footerPages` is `[{ slug, title, url }]`.
 */
export function useFooter() {
    const url = useRoute();
    const { webSettings } = usePage().props;
    const { name: companyName } = useSiteBrand();

    const year = new Date().getFullYear();

    const quickLinks = [
        { name: t('Events'), url: url('') },
        { name: t('Discover'), url: url('/discover') },
        { name: t('Search'), url: url('/search') },
        // Without this entry the blog has no link anywhere on the site, and
        // the admin can publish posts nobody can reach.
        { name: t('Blog'), url: url('/blog') },
    ];

    const resources = [
        { name: t('My tickets'), url: url('/tickets') },
        { name: t('My Account'), url: url('/account') },
        { name: t('Plus'), url: url('/plus') },
    ];

    const footerPages = (webSettings?.footerPages ?? []).map((page) => ({
        ...page,
        url: url(`/pages/${page.slug}`),
    }));
    const socialLinks = webSettings?.footerSocialLinks ?? [];

    /** The operator's link for one network (matched on its title), or '#'. */
    const socialHref = (key) => {
        const match = socialLinks.find((link) => link.title?.toLowerCase() === key);
        return match?.link || '#';
    };

    return {
        webSettings,
        year,
        companyName,
        quickLinks,
        resources,
        footerPages,
        socialLinks,
        socialHref,
    };
}

/** The footer's newsletter sign-up form. */
export function useNewsletter() {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const subscribe = async (event) => {
        event?.preventDefault?.();

        if (!email.trim()) {
            toast.error(t('Please enter your email'));
            return;
        }

        setSubmitting(true);

        try {
            await axios.post('/api/subscribe', { email: email.trim() });
            // Double opt-in: nothing is subscribed until the mailed link is opened.
            toast.success(t('Check your inbox and confirm your subscription.'));
            setEmail('');
        } catch (error) {
            toast.error(error?.response?.data?.message ?? t('Could not subscribe.'));
        } finally {
            setSubmitting(false);
        }
    };

    return { email, setEmail, submitting, subscribe };
}

/* ── Header ────────────────────────────────────────────────────────────── */

/** True once the window has scrolled past `threshold` px (rAF-throttled). */
export function useScrolled(threshold = 6) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (ticking) {
                return;
            }

            requestAnimationFrame(() => {
                setIsScrolled(window.scrollY > threshold);
                ticking = false;
            });
            ticking = true;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [threshold]);

    return isScrolled;
}

/**
 * The header's state: the mobile drawer (closed on every navigation), the
 * scrolled flag and active-route matching.
 *
 * `isActive('')` matches the home page exactly; any other path matches by
 * prefix.
 */
export function useNavBar() {
    const url = useRoute();
    const { url: currentUrl } = usePage();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isScrolled = useScrolled(6);

    // The drawer must not survive a navigation — leaving it open covers the
    // page you just asked for.
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [currentUrl]);

    const isActive = (path) => {
        const target = url(path);
        return path === '' ? currentUrl === target || currentUrl === `${target}/` : currentUrl.startsWith(target);
    };

    return { mobileMenuOpen, setMobileMenuOpen, isScrolled, isActive };
}
