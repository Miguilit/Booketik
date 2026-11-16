/*
 | Discover: filter chips, list / map / calendar, cursor paging — the state,
 | not the look. Filters live in the URL (shareable, back-button safe) and a
 | change is an Inertia partial reload of `events` + `nextCursor`; "load
 | more", the map's viewport pins and the calendar month talk to `/api/v1`
 | directly with the same filter names (EventIndexRequest).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { createApi } from './lib/api';
import { pageLang, t } from './i18n';
import { zonedParts } from './events';

export const DATE_CHIPS = () => [
    { value: 'today', label: t('Today') },
    { value: 'tonight', label: t('Tonight') },
    { value: 'weekend', label: t('This weekend') },
];

export const PRICE_CHIPS = () => [
    { value: 'free', label: t('Free') },
    { value: 'paid', label: t('Paid') },
];

export const FORMAT_CHIPS = () => [
    { value: 'in_person', label: t('In person') },
    { value: 'online', label: t('Online') },
    { value: 'hybrid', label: t('Hybrid') },
];

const FILTER_KEYS = ['q', 'date', 'from', 'to', 'category', 'price', 'format', 'city', 'sort', 'friends_going'];

export function filterQuery(filters, extra = {}) {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
        const value = filters?.[key];
        if (key === 'city' && value === 'all') continue;
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    }
    for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    return params.toString();
}

/**
 * @param props  the page's `{ filters, view, events, nextCursor, category }`
 * @returns {{ filters, view, setView, events, hasMore, loadMore, loading, set(key, value), toggle(key, value), clear(),
 *   active: number, range: {from, to}, setRange(from, to) }}
 */
export function useDiscover({ filters: initial, view: initialView, events: initialEvents, nextCursor, category }) {
    const { auth, locale } = usePage().props;
    const api = useMemo(() => createApi(auth?.user?.token), [auth?.user?.token]);
    const filters = useMemo(() => ({ ...(initial ?? {}) }), [initial]);
    const [view, setViewState] = useState(initialView ?? 'list');
    const [events, setEvents] = useState(initialEvents ?? []);
    const [cursor, setCursor] = useState(nextCursor ?? null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setEvents(initialEvents ?? []);
        setCursor(nextCursor ?? null);
    }, [initialEvents, nextCursor]);

    const base = category ? `/${locale}/c/${category.slug}` : `/${locale}/discover`;

    const visit = useCallback((next, nextView = view) => {
        const clean = { ...next };
        if (category) delete clean.category;
        const query = Object.fromEntries(Object.entries(clean).filter(([, v]) => v !== undefined && v !== null && v !== ''));
        if (nextView !== 'list') query.view = nextView;
        setLoading(true);
        router.get(base, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['events', 'nextCursor', 'filters', 'view'],
            onFinish: () => setLoading(false),
        });
    }, [base, category, view]);

    const set = (key, value) => {
        const next = { ...filters, [key]: value };
        if (key === 'date' && value !== 'range') {
            delete next.from;
            delete next.to;
        }
        visit(next);
    };

    const toggle = (key, value) => set(key, filters[key] === value ? null : value);

    const setRange = (from, to) => visit({ ...filters, date: from && to ? 'range' : null, from, to });

    const clear = () => visit(filters.city ? { city: filters.city } : {});

    const setView = (next) => {
        setViewState(next);
        const url = new URL(window.location.href);
        if (next === 'list') url.searchParams.delete('view');
        else url.searchParams.set('view', next);
        window.history.replaceState(window.history.state, '', url);
    };

    const loadMore = async () => {
        if (!cursor || loading) return;
        setLoading(true);
        try {
            const { data, meta } = await api.list(`/events?${filterQuery({ ...filters, category: filters.category ?? category?.slug }, { cursor, limit: 24 })}`);
            setEvents((prev) => [...prev, ...(data ?? [])]);
            setCursor(meta?.next_cursor ?? null);
        } finally {
            setLoading(false);
        }
    };

    const active = ['date', 'price', 'format', 'friends_going', 'q'].filter((k) => filters[k]).length + (filters.category && !category ? 1 : 0);

    return { filters, view, setView, events, hasMore: Boolean(cursor), loadMore, loading, set, toggle, setRange, clear, active };
}

/** Pins for the visible map area: `GET /events/map?bbox=…` with the page's filters. */
export function useMapPins(filters) {
    const { auth } = usePage().props;
    const api = useMemo(() => createApi(auth?.user?.token), [auth?.user?.token]);
    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(false);
    const timer = useRef(null);
    const last = useRef('');

    const load = useCallback((bbox) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            const query = filterQuery({ ...filters, sort: undefined }, { bbox });
            if (query === last.current) return;
            last.current = query;
            setLoading(true);
            try {
                const { data } = await api.list(`/events/map?${query}`);
                setPins(data ?? []);
            } catch {
                setPins([]);
            } finally {
                setLoading(false);
            }
        }, 250);
    }, [api, filters]);

    useEffect(() => () => clearTimeout(timer.current), []);

    return { pins, loading, load };
}

function ymd(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * A month grid for the calendar view: `{ label, weeks: [[{ ymd, day, inMonth, today, events }]], prev(), next(), loading }`.
 * Events land on the day they start in their own time zone.
 */
export function useCalendarMonth(filters, category) {
    const { auth } = usePage().props;
    const api = useMemo(() => createApi(auth?.user?.token), [auth?.user?.token]);
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const from = ymd(month);
        const to = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0));
        setLoading(true);
        const { date, from: _f, to: _t, ...rest } = filters ?? {};
        api.list(`/events?${filterQuery({ ...rest, category: rest.category ?? category?.slug }, { date: 'range', from, to, limit: 100 })}`)
            .then(({ data }) => !cancelled && setEvents(data ?? []))
            .catch(() => !cancelled && setEvents([]))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [api, month, filters, category]);

    const weeks = useMemo(() => {
        const byDay = {};
        for (const e of events) {
            const key = zonedParts(e.starts_at, e.timezone || 'UTC').ymd;
            (byDay[key] ??= []).push(e);
        }
        const first = new Date(month);
        const offset = (first.getDay() + 6) % 7; // Monday first
        const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
        const today = ymd(new Date());
        const rows = [];
        for (let w = 0; w < 6; w++) {
            const row = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
                const key = ymd(date);
                row.push({ ymd: key, day: date.getDate(), inMonth: date.getMonth() === month.getMonth(), today: key === today, events: byDay[key] ?? [] });
            }
            if (w >= 4 && !row.some((c) => c.inMonth)) break;
            rows.push(row);
        }
        return rows;
    }, [events, month]);

    const label = new Intl.DateTimeFormat(pageLang(), { month: 'long', year: 'numeric' }).format(month);
    const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(pageLang(), { weekday: 'short' }).format(new Date(2024, 0, 1 + i)));

    return {
        label,
        weekdays,
        weeks,
        loading,
        count: events.length,
        prev: () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)),
        next: () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)),
        thisMonth: () => setMonth(() => {
            const d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), 1);
        }),
    };
}

/**
 * AI search (`GET /search/ai?q=`): the parsed query comes back as filters,
 * shown as editable chips. Editing a chip re-queries `/events` directly with
 * the edited filters (the contract says the results must match).
 */
export function useAiSearch({ q: initialQ, city, categories }) {
    const { auth, locale } = usePage().props;
    const api = useMemo(() => createApi(auth?.user?.token), [auth?.user?.token]);
    const [q, setQ] = useState(initialQ ?? '');
    const [filters, setFilters] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [results, setResults] = useState([]);
    const [state, setState] = useState(initialQ ? 'loading' : 'idle');
    const [error, setError] = useState(null);

    const run = useCallback(async (text) => {
        const query = (text ?? '').trim();
        if (query.length < 2) return;
        setState('loading');
        setError(null);
        const url = new URL(window.location.href);
        url.searchParams.set('q', query);
        window.history.replaceState(window.history.state, '', url);
        try {
            const data = await api.get(`/search/ai?${new URLSearchParams({ q: query, ...(city ? { city } : {}) })}`);
            setFilters(data.filters ?? {});
            setExplanation(data.explanation ?? null);
            setResults(data.results ?? []);
            setState('done');
        } catch (e) {
            // AI off or out of allowance: fall back to a plain keyword search.
            try {
                const { data } = await api.list(`/events?${filterQuery({ q: query, city })}`);
                setFilters({ q: query });
                setExplanation(null);
                setResults(data ?? []);
                setState('done');
                if (e?.code && e.code !== 'AI_DISABLED') setError(e.message);
            } catch (inner) {
                setState('error');
                setError(inner?.message ?? t('Search is unavailable right now.'));
            }
        }
    }, [api, city]);

    useEffect(() => {
        if (initialQ) run(initialQ);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const requery = useCallback(async (next) => {
        setFilters(next);
        setState('loading');
        const flat = {
            q: next.q, date: next.date, from: next.from, to: next.to, category: next.category, price: next.price,
            format: next.format, friends_going: next.friends_going ? 1 : undefined, city,
            max_price: next.max_price?.amount,
        };
        try {
            const { data } = await api.list(`/events?${filterQuery(flat, { max_price: flat.max_price })}`);
            setResults(data ?? []);
            setState('done');
        } catch {
            setState('error');
        }
    }, [api, city]);

    const chips = useMemo(() => {
        if (!filters) return [];
        const out = [];
        const catName = (slug) => (categories ?? []).find((c) => c.slug === slug)?.name ?? slug;
        if (filters.q) out.push({ key: 'q', label: `“${filters.q}”` });
        if (filters.date) out.push({ key: 'date', label: filters.date === 'range' ? `${filters.from} → ${filters.to}` : (DATE_CHIPS().find((c) => c.value === filters.date)?.label ?? filters.date) });
        if (filters.category) out.push({ key: 'category', label: catName(filters.category) });
        if (filters.price) out.push({ key: 'price', label: filters.price === 'free' ? t('Free') : t('Paid') });
        if (filters.max_price) out.push({ key: 'max_price', label: t('Under :price', { price: filters.max_price.formatted }) });
        if (filters.format) out.push({ key: 'format', label: FORMAT_CHIPS().find((c) => c.value === filters.format)?.label ?? filters.format });
        if (filters.near_me) out.push({ key: 'near_me', label: filters.radius_km ? t('Within :km km', { km: filters.radius_km }) : t('Near me') });
        if (filters.friends_going) out.push({ key: 'friends_going', label: t('Friends going') });
        return out;
    }, [filters, categories]);

    return {
        q, setQ, run, state, error, explanation, results, chips, filters,
        removeChip: (key) => requery({ ...filters, [key]: null, ...(key === 'date' ? { from: null, to: null } : {}) }),
        editChip: (key, value) => requery({ ...filters, [key]: value }),
        discoverHref: filters ? `/${locale}/discover?${filterQuery({ ...filters, max_price: undefined })}` : `/${locale}/discover`,
    };
}
