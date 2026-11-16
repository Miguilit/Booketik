/*
 | Events — the headless half of every event card and event page.
 |
 | Dates are always shown in the EVENT's own time zone with a label ("19:00
 | CET"), and when the viewer's zone differs their own time is offered too.
 | Prices are the server's fees-included Money. The CTA is the
 | server's (`event.cta`, EventService::cta()) — this only maps it to what a
 | button does. No markup and no classes here: themes draw.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { createApi } from './lib/api';
import { openAuthDialog } from './lib/auth/authDialog';
import { pageLang, t } from './i18n';

const DAY = 86400000;

const lang = pageLang;

/** Parts of an instant in a zone: `{ year, month, day, weekday, hour, minute }` (numbers / short names). */
export function zonedParts(iso, timeZone, locale = lang()) {
    const date = new Date(iso);
    const fmt = new Intl.DateTimeFormat(locale, {
        timeZone, year: 'numeric', month: 'short', day: 'numeric', weekday: 'short',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
    const numeric = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    return { ...parts, ymd: numeric };
}

/*
 | Zone names come from the engine's CLDR data, which differs between Node
 | (the SSR server) and browsers — Lisbon is "GMT" in one and "WET" in the
 | other. A label that differs throws the server's HTML away on hydration,
 | so the SSR server records every name it printed (ssr.jsx puts them in the
 | page head as `window.__EG_ZONES`) and the browser reuses them. Keyed by
 | zone and UTC offset, since the name changes with daylight saving.
 */
const zoneNames = new Map();
let zonesSeeded = false;

function zoneKey(iso, timeZone) {
    try {
        const d = new Date(iso);
        const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
            .formatToParts(d).map((x) => [x.type, x.value]));
        const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
        return `${timeZone}|${Math.round((local - Math.floor(d.getTime() / 60000) * 60000) / 60000)}`;
    } catch {
        return `${timeZone}|?`;
    }
}

/** SSR: forget the names recorded for the previous page. */
export function resetZoneNames() {
    zoneNames.clear();
}

/** SSR: the names this render printed, for the page head. */
export function zoneNamesSnapshot() {
    return Object.fromEntries(zoneNames);
}

/** "CET", "GMT+1" — the zone's short name at that instant. */
export function zoneAbbr(iso, timeZone) {
    if (!zonesSeeded && typeof window !== 'undefined') {
        zonesSeeded = true;
        for (const [k, v] of Object.entries(window.__EG_ZONES ?? {})) zoneNames.set(k, v);
    }
    const key = zoneKey(iso, timeZone);
    if (zoneNames.has(key)) return zoneNames.get(key);

    // en-US names American zones (EDT), en-GB European ones (CEST); either
    // falls back to an offset ("GMT+2"), which is still a label.
    const name = (locale) => {
        try {
            return new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
                .formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')?.value ?? null;
        } catch {
            return null;
        }
    };
    const us = name('en-US');
    const gb = us && !/^(GMT|UTC)[+-]/.test(us) ? null : name('en-GB');
    const label = (us && !/^(GMT|UTC)[+-]/.test(us)) ? us : (gb && !/^(GMT|UTC)[+-]/.test(gb)) ? gb : (us ?? timeZone);
    zoneNames.set(key, label);
    return label;
}

/*
 | Server-rendered pages hydrate against the server's HTML, so the first
 | client render must print what the server printed: the same clock (the
 | SSR render time, `window.__EG_NOW`) and no viewer-zone line (the server
 | cannot know the visitor's zone). Both catch up right after hydration —
 | useNow sets the real time in its first effect.
 */
let renderClock = null; // SSR: this render's time
let hydrating = typeof window !== 'undefined' && typeof window.__EG_NOW === 'number';

/** The browser entry, once the server's HTML is hydrated (app.jsx). */
export function markHydrated() {
    hydrating = false;
}

/** SSR: the instant this page is rendered at (ssr.jsx), shared with the browser. */
export function setRenderClock(ms) {
    renderClock = ms;
}

function firstNow() {
    if (typeof window === 'undefined') return renderClock ?? Date.now();
    return hydrating ? window.__EG_NOW : Date.now();
}

/** The visitor's zone, or null while it cannot be known (on the server, during hydration). */
export function viewerZone() {
    if (typeof window === 'undefined' || hydrating) return null;
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
}

function ymdToDays(ymd) {
    const [y, m, d] = ymd.split('-').map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / DAY);
}

/** "today", "tomorrow", "in 3 days", "in 2 weeks", "yesterday" — calendar days in the event's zone. */
export function relativeDay(iso, timeZone, now = Date.now()) {
    const diff = ymdToDays(zonedParts(iso, timeZone).ymd) - ymdToDays(zonedParts(new Date(now).toISOString(), timeZone).ymd);
    if (diff === 0) return t('today');
    if (diff === 1) return t('tomorrow');
    if (diff === -1) return t('yesterday');
    if (diff > 1 && diff < 14) return t('in :count days', { count: diff });
    if (diff >= 14 && diff < 60) return t('in :count weeks', { count: Math.round(diff / 7) });
    if (diff < -1) return t(':count days ago', { count: -diff });
    return null;
}

/**
 * Everything a theme prints about when an event is.
 *
 * @returns {{ weekday, day, month, year, date, time, endTime, zone, zoneName, relative, live, past, soon,
 *   viewerTime: string|null, long, short, dateline: {weekday, day, month} }}
 */
export function eventWhen(event, now = Date.now()) {
    if (!event?.starts_at) return null;
    const tz = event.timezone || 'UTC';
    const start = zonedParts(event.starts_at, tz);
    const end = event.ends_at ? zonedParts(event.ends_at, tz) : null;
    const startMs = Date.parse(event.starts_at);
    const endMs = event.ends_at ? Date.parse(event.ends_at) : startMs + 3 * 3600000;
    const live = now >= startMs && now < endMs;
    const past = now >= endMs;
    const viewer = viewerZone();
    let viewerTime = null;

    if (viewer && viewer !== tz) {
        const mine = zonedParts(event.starts_at, viewer);
        if (`${mine.hour}:${mine.minute}` !== `${start.hour}:${start.minute}` || mine.ymd !== start.ymd) {
            viewerTime = t(':time :day your time', { time: `${mine.hour}:${mine.minute}`, day: mine.ymd !== start.ymd ? `${mine.weekday} ${mine.day} ${mine.month}` : '' }).replace(/\s+/g, ' ').trim();
        }
    }

    const long = new Intl.DateTimeFormat(lang(), { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.starts_at));

    return {
        weekday: start.weekday,
        day: start.day,
        month: start.month,
        year: start.year,
        date: `${start.weekday} ${start.day} ${start.month}`,
        time: `${start.hour}:${start.minute}`,
        endTime: end ? `${end.hour}:${end.minute}` : null,
        multiDay: Boolean(end && end.ymd !== start.ymd),
        endDate: end ? `${end.weekday} ${end.day} ${end.month}` : null,
        zone: zoneAbbr(event.starts_at, tz),
        zoneName: tz,
        relative: live ? t('happening now') : past ? null : relativeDay(event.starts_at, tz, now),
        live,
        past,
        soon: !past && startMs - now < 48 * 3600000,
        viewerTime,
        long,
        short: `${start.day} ${start.month}`,
        dateline: { weekday: start.weekday, day: start.day, month: start.month },
        startsAt: startMs,
    };
}

/** A tick every `ms` while mounted — for countdowns and "happening now". */
export function useNow(ms = 30000) {
    const [now, setNow] = useState(firstNow);
    useEffect(() => {
        hydrating = false;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
}

/** "01:42:07" / "4 min 05 s" until an instant, or null once passed. */
export function countdown(untilIso, now = Date.now()) {
    if (!untilIso) return null;
    const left = Date.parse(untilIso) - now;
    if (left <= 0) return null;
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    const s = Math.floor((left % 60000) / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return { ms: left, label: h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`, hours: h, minutes: m, seconds: s };
}

/** "Free", "From €19.39", "€24.00" — the server's fees-included Money. */
export function priceLabel(price) {
    if (!price) return null;
    if (price.is_free) return t('Free');
    if (!price.min) return null;
    if (price.max && price.max.amount !== price.min.amount) return t('From :price', { price: price.min.formatted });
    return price.min.formatted;
}

export function priceNote(price) {
    if (!price || price.is_free) return null;
    return price.fees_included ? t('incl. fees') : t('plus fees');
}

/** Provider prices share the native v1 money shape, but unknown must never imply free. */
export function displayPrice(event) {
    return priceLabel(event?.price) ?? (event?.external ? t('Price not provided') : null);
}

/** Provider flags do not guarantee real-time inventory. Only 'sold_out' is definite. */
export function externalAvailabilityLabel(event) {
    if (!event?.external) return null;
    return event.availability === 'sold_out'
        ? t('Sold out')
        : t('Availability to confirm with the organizer');
}

/** Scarcity and state as a short tag: `{ label, tone: 'warn'|'danger'|'muted'|'info' }` or null. */
export function availabilityTag(availability) {
    switch (availability) {
        case 'few_left': return { label: t('Few left'), tone: 'warn' };
        case 'sold_out': return { label: t('Sold out'), tone: 'danger' };
        case 'waitlist': return { label: t('Waitlist'), tone: 'info' };
        case 'ended': return { label: t('Ended'), tone: 'muted' };
        case 'cancelled': return { label: t('Cancelled'), tone: 'danger' };
        default: return null;
    }
}

export function formatLabel(format) {
    return { in_person: t('In person'), online: t('Online'), hybrid: t('Hybrid') }[format] ?? null;
}

export function kindLabel(kind) {
    return { community: t('Community'), ticketed: t('Ticketed'), conference: t('Conference') }[kind] ?? null;
}

/** "Klunkerkranich, Berlin" — or "Online". */
export function venueLine(event) {
    if (event?.format === 'online') return t('Online');
    const v = event?.venue;
    if (!v) return null;
    return [v.name, v.city].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(', ');
}

export function addressLines(venue) {
    if (!venue) return [];
    const region = venue.region && venue.region !== venue.city ? venue.region : null;
    return [venue.address_line1, venue.address_line2, [venue.postal_code, venue.city].filter(Boolean).join(' '), region]
        .filter(Boolean);
}

export function useRoutePrefix() {
    const locale = usePage().props.locale ?? 'en';
    return useCallback((path = '') => `/${locale}${path}`, [locale]);
}

export const eventPath = (slug) => `/e/${encodeURIComponent(slug)}`;
export const organizerPath = (slug) => `/o/${encodeURIComponent(slug)}`;
export const categoryPath = (slug) => `/c/${encodeURIComponent(slug)}`;

/**
 * The one button: `event.cta.action` mapped to what pressing it does.
 *
 * `kind`: 'link' (go to `href`), 'action' (call `run`), 'disabled'.
 * `tone`: 'cta' (the primary call), 'quiet' (a state, not a call), 'signal' (a confirmation).
 */
export function ctaFor(event, url, now = Date.now()) {
    // A verified external listing has one outbound action, never Booketik checkout.
    if (event?.external) {
        const raw = event.external.official_url;
        let safeUrl = null;
        try {
            const parsed = new URL(raw);
            if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) safeUrl = parsed.href;
        } catch { /* An invalid URL must not become an actionable CTA. */ }
        return safeUrl
            ? { action: 'official', kind: 'external', href: safeUrl, label: t('Visit official event website'), tone: 'cta', note: t('Tickets and registration are managed by the organizer, not Booketik.') }
            : { action: 'none', kind: 'disabled', label: t('Official link unavailable'), tone: 'quiet' };
    }
    const action = event?.cta?.action ?? 'none';
    const label = event?.cta?.label ?? '';
    const slug = event?.slug;
    const checkout = url(`${eventPath(slug)}/checkout`);
    const claimUntil = event?.viewer?.waitlist_claim_expires_at ?? null;

    switch (action) {
        case 'buy':
            return { action, kind: 'link', href: checkout, label: label || t('Get tickets'), tone: 'cta' };
        case 'rsvp':
            return { action, kind: 'link', href: checkout, label: label || t('RSVP'), tone: 'cta' };
        case 'request':
            return { action, kind: 'link', href: checkout, label: label || t('Request to join'), tone: 'cta' };
        case 'waitlist':
            return { action, kind: 'link', href: checkout, label: label || t('Join the waitlist'), tone: 'cta' };
        case 'claim':
            return { action, kind: 'link', href: checkout, label: label || t('Claim your spot'), tone: 'cta', countdown: countdown(claimUntil, now) };
        case 'pending':
            return { action, kind: 'disabled', label: label || t('Request pending'), tone: 'quiet', note: t('The organizer will let you know.') };
        case 'view_ticket': {
            const code = event?.viewer?.ticket_codes?.[0];
            return { action, kind: 'link', href: code ? url(`/t/${code}`) : url('/tickets'), label: label || t('View ticket'), tone: 'signal' };
        }
        case 'join_online': {
            const join = event?.online?.join_url;
            const reveals = event?.online?.reveals_at;
            if (join) return { action, kind: 'external', href: join, label: label || t('Join online'), tone: 'signal' };
            return { action, kind: 'disabled', label: label || t('Join link soon'), tone: 'quiet', countdown: countdown(reveals, now), note: t('The link appears here before it starts.') };
        }
        default:
            return { action: 'none', kind: 'disabled', label: label || (event?.availability === 'ended' ? t('This event has ended') : t('Not available')), tone: 'quiet' };
    }
}

/** Add-to-calendar: the server's .ics, Google and Outlook links. */
export function calendarLinks(event) {
    if (!event?.starts_at) return null;
    const fmt = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = event.ends_at ?? new Date(Date.parse(event.starts_at) + 3 * 3600000).toISOString();
    const where = event.format === 'online' ? event.share_url : [event.venue?.name, event.venue?.address_line1, event.venue?.city].filter(Boolean).join(', ');
    const details = `${event.summary ?? ''}\n\n${event.share_url ?? ''}`.trim();
    const google = `https://calendar.google.com/calendar/render?${new URLSearchParams({
        action: 'TEMPLATE', text: event.title, dates: `${fmt(event.starts_at)}/${fmt(end)}`, details, location: where ?? '', ctz: event.timezone ?? 'UTC',
    })}`;
    const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({
        path: '/calendar/action/compose', rru: 'addevent', subject: event.title, startdt: event.starts_at, enddt: end, body: details, location: where ?? '',
    })}`;
    return { ics: event.calendar_url ?? null, google, outlook };
}

/** The description's rich-text blocks, tidied: `[{ kind, spans, items, ordered }]`. */
export function contentBlocks(blocks) {
    return (Array.isArray(blocks) ? blocks : []).filter((b) => b && (b.spans?.length || b.items?.length || b.src || b.url));
}

/** "Lineup: A, B and C" paragraphs → `['A', 'B', 'C']`, so a theme can draw a lineup. */
export function lineupFrom(blocks) {
    for (const block of contentBlocks(blocks)) {
        const text = (block.spans ?? []).map((s) => s.t).join('');
        const match = text.match(/^\s*Lineup:\s*(.+)$/i);
        if (match) return match[1].split(/,|·|\band\b/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
}

/** The page's accent as CSS variables (light/dark already contrast-guarded by the server). */
export function accentStyle(accent, dark) {
    if (!accent) return undefined;
    return {
        '--ev-accent': dark ? accent.rgb_dark : accent.rgb_light,
        '--ev-on-accent': dark ? accent.rgb_on_dark : accent.rgb_on_light,
    };
}

/**
 * The viewer's actions on an event: save, follow its organizer, share, ask.
 * Signed-out presses open the sign-in dialog with a reason.
 */
export function useEventActions(event) {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;
    const api = useMemo(() => createApi(user?.token), [user?.token]);
    const [saved, setSaved] = useState(Boolean(event?.viewer?.saved));
    const [following, setFollowing] = useState(Boolean(event?.viewer?.following_organizer));
    const [busy, setBusy] = useState(null);

    useEffect(() => setSaved(Boolean(event?.viewer?.saved)), [event?.viewer?.saved]);

    const guard = (intent, fn) => async () => {
        if (!user) {
            openAuthDialog('login', intent);
            return;
        }
        await fn();
    };

    const toggleSave = guard(t('Sign in to save events.'), async () => {
        setBusy('save');
        const next = !saved;
        setSaved(next);
        try {
            if (next) await api.post(`/events/${event.slug}/save`, {});
            else await api.del(`/events/${event.slug}/save`);
            toast.success(next ? t('Saved') : t('Removed from saved'));
        } catch {
            setSaved(!next);
            toast.error(t('Something went wrong. Try again.'));
        } finally {
            setBusy(null);
        }
    });

    const toggleFollow = guard(t('Sign in to follow organizers.'), async () => {
        setBusy('follow');
        const next = !following;
        setFollowing(next);
        try {
            if (next) await api.post(`/organizers/${event.organizer.slug}/follow`, {});
            else await api.del(`/organizers/${event.organizer.slug}/follow`);
        } catch {
            setFollowing(!next);
            toast.error(t('Something went wrong. Try again.'));
        } finally {
            setBusy(null);
        }
    });

    const share = async () => {
        const url = event?.viewer?.referral_url || event?.share_url;
        if (navigator.share) {
            try {
                await navigator.share({ title: event.title, url });
                return;
            } catch {
                // Cancelled: fall through to copy.
            }
        }
        try {
            await navigator.clipboard?.writeText(url);
            toast.success(t('Link copied'));
        } catch {
            toast.error(t('Could not copy the link'));
        }
    };

    return { user, saved, following, busy, toggleSave, toggleFollow, share };
}

/** "Ask about this event" — answered only from the event's own sections (`POST /events/{slug}/ask`). */
export function useAskEvent(event) {
    const { auth } = usePage().props;
    const api = useMemo(() => createApi(auth?.user?.token), [auth?.user?.token]);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState(null);
    const [busy, setBusy] = useState(false);

    const ask = async (e) => {
        e?.preventDefault?.();
        if (question.trim().length < 3 || busy) return;
        setBusy(true);
        try {
            setAnswer(await api.post(`/events/${event.slug}/ask`, { question: question.trim() }));
        } catch (error) {
            setAnswer({ answered: false, answer: null, error: error?.message ?? t('Could not ask right now.') });
        } finally {
            setBusy(false);
        }
    };

    return { question, setQuestion, answer, busy, ask };
}

/** Follow / unfollow / join an organizer hub. */
export function useFollowOrganizer(organizer) {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;
    const api = useMemo(() => createApi(user?.token), [user?.token]);
    const [state, setState] = useState({
        following: Boolean(organizer?.viewer?.following),
        member: Boolean(organizer?.viewer?.member),
    });
    const [busy, setBusy] = useState(false);

    const run = async (fn) => {
        if (!user) {
            openAuthDialog('login', t('Sign in to follow :name.', { name: organizer.name }));
            return;
        }
        setBusy(true);
        try {
            const next = await fn();
            setState({ following: Boolean(next.following), member: Boolean(next.member) });
        } catch {
            toast.error(t('Something went wrong. Try again.'));
        } finally {
            setBusy(false);
        }
    };

    return {
        ...state,
        busy,
        follow: () => run(() => api.post(`/organizers/${organizer.slug}/follow`, {})),
        unfollow: () => run(() => api.del(`/organizers/${organizer.slug}/follow`)),
        join: () => run(() => api.post(`/organizers/${organizer.slug}/join`, {})),
        toggle: () => run(() => (state.following ? api.del(`/organizers/${organizer.slug}/follow`) : api.post(`/organizers/${organizer.slug}/follow`, {}))),
    };
}

/** A paged list the API continues with `meta.next_cursor` (organizer events, discover). */
export function useCursorList(initialItems, initialCursor, path) {
    const { auth } = usePage().props;
    const api = useMemo(() => createApi(auth?.user?.token), [auth?.user?.token]);
    const [items, setItems] = useState(initialItems ?? []);
    const [cursor, setCursor] = useState(initialCursor ?? null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setItems(initialItems ?? []);
        setCursor(initialCursor ?? null);
    }, [initialItems, initialCursor]);

    const more = async () => {
        if (!cursor || loading) return;
        setLoading(true);
        try {
            const sep = path.includes('?') ? '&' : '?';
            const { data, meta } = await api.list(`${path}${sep}cursor=${encodeURIComponent(cursor)}`);
            setItems((prev) => [...prev, ...(data ?? [])]);
            setCursor(meta?.next_cursor ?? null);
        } catch {
            toast.error(t('Could not load more.'));
        } finally {
            setLoading(false);
        }
    };

    return { items, hasMore: Boolean(cursor), loading, more };
}

/** Change the home city (remembered by the server in a cookie). */
export function useCityPicker(cities, city) {
    const url = useRoutePrefix();
    return {
        cities: cities ?? [],
        current: city,
        choose: (slug) => router.get(url('/'), { city: slug }, { preserveScroll: false }),
    };
}

/** Split events into Fri / Sat / Sun by their own local weekday (the `weekend` layout). */
export function weekendDays(events) {
    const days = { Fri: [], Sat: [], Sun: [] };
    for (const e of events ?? []) {
        const wd = new Intl.DateTimeFormat('en-US', { timeZone: e.timezone || 'UTC', weekday: 'short' }).format(new Date(e.starts_at));
        if (days[wd]) days[wd].push(e);
    }
    return [
        { key: 'Fri', label: t('Friday'), events: days.Fri },
        { key: 'Sat', label: t('Saturday'), events: days.Sat },
        { key: 'Sun', label: t('Sunday'), events: days.Sun },
    ];
}
