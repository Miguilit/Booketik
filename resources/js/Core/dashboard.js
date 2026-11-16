/*
 | The organizer dashboard — headless: the frame, the API client
 | scoped to one organizer, action state with toasts, times in an event's own
 | zone, money in minor units, the keyboard triage and the AI draft hooks.
 | No markup; the Civic theme draws it (Themes/civic/Pages/Dashboard/*).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { createApi } from './api';
import { openVerifyEmailDialog } from './auth';
import { currencyExponent } from './lib/format';
import { locale, t } from './i18n';

/* ── Frame ──────────────────────────────────────────────────────────────── */

/**
 * `/{locale}/organizer/dashboard[/{slug}][sub]` — the dashboard's address in
 * the page's language (the old `/dashboard/…` answers with a 301 to it).
 */
export function dashboardHref(slug = null, sub = '') {
    return `/${locale() || 'en'}/organizer/dashboard${slug ? `/${slug}` : ''}${sub}`;
}

/** `{ frame, org, role, can, path(sub), api }` for the page's organizer. */
export function useDashboard() {
    const { frame, auth } = usePage().props;
    const slug = frame?.org?.slug;
    const token = auth?.user?.token;
    const api = useMemo(() => orgApi(token, slug), [token, slug]);
    const path = useCallback((sub = '') => dashboardHref(slug, sub), [slug]);

    return { frame, org: frame?.org, role: frame?.role, can: frame?.can ?? {}, path, api, user: auth?.user ?? null };
}

/** The `/api/v1` client with `org(path)` scoped to `/org/{slug}`. */
export function orgApi(token, slug) {
    const base = createApi(token);
    const scoped = (p) => `/org/${slug}${p}`;

    return {
        ...base,
        org: {
            get: (p) => base.get(scoped(p)),
            list: (p) => base.list(scoped(p)),
            post: (p, body) => base.post(scoped(p), body),
            patch: (p, body) => base.patch(scoped(p), body),
            put: (p, body) => base.put(scoped(p), body),
            del: (p) => base.del(scoped(p)),
        },
    };
}

/** A friendly line for an API error `{ code, message, fields }`. */
export function errorMessage(error) {
    if (!error) return t('Something went wrong.');
    if (error.code === 'EMAIL_NOT_VERIFIED') return t('Confirm your email address first.');
    if (error.code === 'AI_CREDITS_EXHAUSTED') return t('Your AI credits for this month are used up.');
    if (error.code === 'RATE_LIMITED') return error.message || t('Too many at once — try again in a little while.');
    if (error.code === 'NETWORK_ERROR') return t('No connection. Try again.');
    if (error.code === 'SERVER_ERROR') return error.status === 504 || error.status === 408 ? t('That took too long. Try again in a moment.') : t('Something went wrong on our side. Try again in a moment.');
    return error.message || t('Something went wrong.');
}

/**
 * Run API calls with a busy flag, field errors, a toast and an optional
 * Inertia reload of some props afterwards. `run(fn, { success, reload })`
 * resolves to the call's data, or `null` when it failed (already toasted).
 */
export function useAction() {
    const [busy, setBusy] = useState(null);
    const [errors, setErrors] = useState({});

    const run = useCallback(async (fn, { key = 'default', success, reload, quiet = false } = {}) => {
        setBusy(key);
        setErrors({});
        try {
            const data = await fn();
            if (success) toast.success(typeof success === 'function' ? success(data) : success);
            if (reload) router.reload({ only: Array.isArray(reload) ? reload : undefined, preserveScroll: true });
            return data ?? {};
        } catch (error) {
            if (error?.fields) setErrors(Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
            if (error?.code === 'EMAIL_NOT_VERIFIED') openVerifyEmailDialog();
            if (!quiet) toast.error(errorMessage(error));
            return null;
        } finally {
            setBusy(null);
        }
    }, []);

    return { run, busy, errors, setErrors };
}

/* ── Times in the event's zone ──────────────────────────────────────────── */

function offsetMinutes(utcMs, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(utcMs)).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return Math.round((asUtc - utcMs) / 60000);
}

/** ISO instant → `YYYY-MM-DDTHH:mm` wall time in `timeZone`, for `<input type="datetime-local">`. */
export function toZonedInput(iso, timeZone = 'UTC') {
    if (!iso) return '';
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) return '';
    const local = new Date(ms + offsetMinutes(ms, timeZone) * 60000);
    return local.toISOString().slice(0, 16);
}

/** `YYYY-MM-DDTHH:mm` wall time in `timeZone` → ISO instant (UTC, `Z`). Handles DST by re-checking the offset. */
export function fromZonedInput(value, timeZone = 'UTC') {
    if (!value) return null;
    const [date, time = '00:00'] = value.split('T');
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    let ms = guess - offsetMinutes(guess, timeZone) * 60000;
    ms = guess - offsetMinutes(ms, timeZone) * 60000;
    return new Date(ms).toISOString().replace('.000Z', 'Z');
}

/** Every IANA zone the browser knows, the event's own first. */
export function timeZones(current) {
    let zones = [];
    try {
        zones = Intl.supportedValuesOf('timeZone');
    } catch {
        zones = ['UTC', 'Europe/Berlin', 'Europe/Lisbon', 'Europe/London', 'America/New_York'];
    }
    return current && !zones.includes(current) ? [current, ...zones] : zones;
}

/* ── Money ──────────────────────────────────────────────────────────────── */

/** Minor units → the decimal string an organizer types ("19.50"). */
export function minorToInput(minor, currency = 'EUR') {
    if (minor === null || minor === undefined || minor === '') return '';
    const exp = currencyExponent(currency);
    return (Number(minor) / 10 ** exp).toFixed(exp);
}

/** "19.5" → 1950 (minor units), null when blank or not a number. */
export function inputToMinor(value, currency = 'EUR') {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const n = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 10 ** currencyExponent(currency));
}

/* ── Keyboard triage ────────────────────────────────────────────────────── */

/**
 * j / k move through `items`, a approves, d declines, Enter/o opens the
 * detail. Ignored while typing in a field or with a modifier held. The
 * cursor stays in range as items leave the list after a decision.
 */
export function useKeyboardTriage(items, { onApprove, onDecline, onOpen, enabled = true } = {}) {
    const [index, setIndex] = useState(0);
    const ref = useRef({ items, index, onApprove, onDecline, onOpen });
    ref.current = { items, index, onApprove, onDecline, onOpen };

    useEffect(() => {
        if (index > Math.max(0, items.length - 1)) setIndex(Math.max(0, items.length - 1));
    }, [items.length, index]);

    useEffect(() => {
        if (!enabled) return undefined;
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const tag = (e.target?.tagName || '').toLowerCase();
            if (['input', 'textarea', 'select'].includes(tag) || e.target?.isContentEditable) return;
            const { items: list, index: i } = ref.current;
            const current = list[i];
            switch (e.key) {
                case 'j': setIndex(Math.min(list.length - 1, i + 1)); break;
                case 'k': setIndex(Math.max(0, i - 1)); break;
                case 'a': if (current) ref.current.onApprove?.(current); break;
                case 'd': if (current) ref.current.onDecline?.(current); break;
                case 'Enter': case 'o': if (current) ref.current.onOpen?.(current); break;
                default: return;
            }
            e.preventDefault();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [enabled]);

    return { index, setIndex, current: items[index] ?? null };
}

/* ── AI: paste-to-event ─────────────────────────────────────────────────── */

export const LOW_CONFIDENCE = 0.6;

/** Read a File as `{ base64, mime }` (no data: prefix). */
export function readImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: String(reader.result).split(',')[1] ?? '', mime: file.type || 'image/jpeg' });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * The wizard's AI step: send pasted text, a flyer image or a URL to
 * `/ai/event-draft`; answer `{ draft, confidence, credits }`. `doubtful`
 * lists the fields under {@see LOW_CONFIDENCE} until `confirm(field)` (an
 * edit) clears them — the wizard highlights them until then.
 */
export function useEventDraft(api, orgSlug) {
    const [result, setResult] = useState(null);
    const [confirmed, setConfirmed] = useState({});
    const { run, busy } = useAction();

    const draft = useCallback(async ({ text, file, url }) => {
        const body = { org: orgSlug };
        if (file) {
            const image = await readImage(file);
            Object.assign(body, { image: image.base64, image_mime: image.mime }, text ? { text } : {});
        } else if (url) {
            body.url = url;
        } else {
            body.text = text;
        }
        const data = await run(() => api.post('/ai/event-draft', body), { key: 'draft' });
        if (data) {
            setResult(data);
            setConfirmed({});
        }
        return data;
    }, [api, orgSlug, run]);

    const doubtful = useMemo(() => Object.entries(result?.confidence ?? {})
        .filter(([field, score]) => score < LOW_CONFIDENCE && !confirmed[field]).map(([field]) => field), [result, confirmed]);

    const confirm = useCallback((field) => setConfirmed((c) => (c[field] ? c : { ...c, [field]: true })), []);

    return { draft, result, busy: busy === 'draft', doubtful, isDoubtful: (f) => doubtful.includes(f), confirm, reset: () => setResult(null) };
}

/* ── Venue search (Nominatim through the server) ────────────────────────── */

/** Search on demand — never per keystroke (the OSM usage policy forbids autocomplete). */
export function useGeocode(api) {
    const [results, setResults] = useState(null);
    const [busy, setBusy] = useState(false);

    const search = useCallback(async (q, country) => {
        if (!q || q.trim().length < 3) return;
        setBusy(true);
        try {
            const params = new URLSearchParams({ q: q.trim(), ...(country ? { country } : {}) });
            const { data } = await api.list(`/geo/search?${params}`);
            setResults(data);
        } catch (error) {
            toast.error(errorMessage(error));
            setResults([]);
        } finally {
            setBusy(false);
        }
    }, [api]);

    return { search, results, busy, clear: () => setResults(null) };
}

/* ── Polling ────────────────────────────────────────────────────────────── */

/** Call `fn` every `ms` while the tab is visible (live check-in counts). */
export function usePoll(fn, ms = 10000, enabled = true) {
    const saved = useRef(fn);
    saved.current = fn;
    useEffect(() => {
        if (!enabled) return undefined;
        const id = window.setInterval(() => {
            if (document.visibilityState === 'visible') saved.current();
        }, ms);
        return () => window.clearInterval(id);
    }, [ms, enabled]);
}

/** Copy to the clipboard with a toast. */
export async function copyText(text, done = t('Copied')) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(done);
    } catch {
        toast.error(t('Could not copy — select and copy it instead.'));
    }
}

/** Role labels. */
export function roleLabel(role) {
    return { owner: t('Owner'), admin: t('Admin'), editor: t('Editor'), checkin_staff: t('Check-in staff') }[role] ?? role;
}

/** Percent from a 0..1 ratio, or an em dash. */
export function pct(ratio, digits = 0) {
    return ratio === null || ratio === undefined ? '—' : `${(ratio * 100).toFixed(digits)}%`;
}
