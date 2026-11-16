/*
 | Conference tools for guests, shared by every theme (no markup here):
 |
 |   useNetworkingProfile   the opt-in profile matchmaking reads (`/me/networking`)
 |   usePeopleToMeet        people to meet at an event, and meeting requests both ways
 |   useItinerary           "Plan my day": a proposed itinerary, previewed, then applied
 |                          to My agenda (`POST /events/{slug}/itinerary`)
 |   useAvailability        the times a speaker can make, as the event's wall-clock
 |   useCallForSpeakers     submitting a talk to an open call, with availability
 |
 | All of them talk to `/api/v1` with the session's bearer token — the same
 | endpoints and rules as the app.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { createApi } from './lib/api';
import { openAuthDialog } from './lib/auth/authDialog';
import { t } from './i18n';
import { zonedParts } from './events';

function useSessionApi() {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;
    const api = useMemo(() => createApi(user?.token), [user?.token]);
    return { api, user };
}

/** Field errors from an API refusal: `{ field: 'message' }`. */
function fieldErrors(error) {
    const out = {};
    for (const [k, v] of Object.entries(error?.fields ?? {})) out[k] = Array.isArray(v) ? v[0] : String(v);
    return out;
}

/** "Talk · 30 min" labels for the submission formats. */
export function formatCopy(key) {
    return {
        talk: t('Talk'),
        workshop: t('Workshop'),
        panel: t('Panel'),
        lightning: t('Lightning talk'),
    }[key] ?? key;
}

export function minutesLabel(minutes) {
    return t(':n min', { n: minutes });
}

/** A submission's state, for the applicant. */
export function submissionStatusLabel(status) {
    return {
        submitted: t('Under review'),
        accepted: t('Accepted'),
        rejected: t('Not this time'),
        withdrawn: t('Withdrawn'),
    }[status] ?? status;
}

// ── Networking profile ──────────────────────────────────────────────

const MAX_INTERESTS = 12;

export function useNetworkingProfile(initial) {
    const { api } = useSessionApi();
    const [profile, setProfile] = useState(() => ({ opt_in: false, headline: '', company: '', interests: [], looking_for: '', ...(initial ?? {}) }));
    const [saved, setSaved] = useState(initial ?? null);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const set = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

    const addInterest = (text = draft) => {
        const parts = String(text).split(',').map((s) => s.trim()).filter((s) => s.length >= 2).map((s) => s.slice(0, 40));
        if (!parts.length) return;
        setProfile((p) => {
            const have = new Set(p.interests.map((i) => i.toLowerCase()));
            const next = [...p.interests];
            for (const part of parts) if (!have.has(part.toLowerCase()) && next.length < MAX_INTERESTS) next.push(part);
            return { ...p, interests: next };
        });
        setDraft('');
    };

    const removeInterest = (value) => setProfile((p) => ({ ...p, interests: p.interests.filter((i) => i !== value) }));

    const save = async (patch = {}) => {
        const body = { ...profile, ...patch };
        setSaving(true);
        setErrors({});
        try {
            const next = await api.put('/me/networking', {
                opt_in: Boolean(body.opt_in),
                headline: body.headline || null,
                company: body.company || null,
                interests: body.interests,
                looking_for: body.looking_for || null,
            });
            setProfile((p) => ({ ...p, ...next }));
            setSaved(next);
            toast.success(next.opt_in ? t('Networking profile saved') : t('Networking is off'));
            return next;
        } catch (error) {
            setErrors(fieldErrors(error));
            toast.error(error?.message || t('Could not save. Try again.'));
            return null;
        } finally {
            setSaving(false);
        }
    };

    const dirty = JSON.stringify(saved ?? {}) !== JSON.stringify({ ...(saved ?? {}), ...profile });

    return {
        profile, set, draft, setDraft, addInterest, removeInterest, save, saving, errors, dirty,
        maxInterests: MAX_INTERESTS,
        /** Switch on (or off) and save straight away. */
        toggle: (on) => {
            set('opt_in', on);
            return save({ opt_in: on });
        },
    };
}

// ── People to meet and meetings ─────────────────────────────────────

export function meetingStatusLabel(meeting) {
    if (meeting.status === 'accepted') return t('Meeting accepted');
    if (meeting.status === 'declined') return meeting.direction === 'outgoing' ? t('Not this time') : t('Declined');
    return meeting.direction === 'outgoing' ? t('Request sent') : t('Wants to meet you');
}

export function usePeopleToMeet({ event, meetings: initialMeetings = [], profile, isGuest }) {
    const { api, user } = useSessionApi();
    const [people, setPeople] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [meetings, setMeetings] = useState(initialMeetings);
    const [busy, setBusy] = useState(null);
    const [composing, setComposing] = useState(null); // person id
    const [message, setMessage] = useState('');
    const canLoad = Boolean(user && profile?.opt_in && isGuest);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setPeople(await api.get(`/events/${event.slug}/people-to-meet`));
        } catch (e) {
            setError({ code: e?.code, message: e?.message || t('Could not load people to meet.') });
            setPeople([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canLoad) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canLoad, event.slug]);

    const upsert = (meeting) => {
        setMeetings((list) => [meeting, ...list.filter((m) => m.id !== meeting.id)]);
        setPeople((list) => list?.map((row) => (row.user.id === meeting.person.id ? { ...row, meeting: { id: meeting.id, status: meeting.status, direction: meeting.direction } } : row)) ?? list);
    };

    const request = async (person) => {
        setBusy(`req-${person.id}`);
        try {
            const meeting = await api.post(`/events/${event.slug}/meetings`, { user_id: person.id, message: message.trim() || null });
            upsert(meeting);
            setComposing(null);
            setMessage('');
            toast.success(t('Request sent to :name', { name: person.name }));
        } catch (e) {
            toast.error(e?.message || t('Could not send the request.'));
        } finally {
            setBusy(null);
        }
    };

    const respond = async (meeting, accept) => {
        setBusy(`resp-${meeting.id}`);
        try {
            const next = await api.post(`/meetings/${meeting.id}/${accept ? 'accept' : 'decline'}`, {});
            upsert(next);
            toast.success(accept ? t('Meeting accepted') : t('Request declined'));
        } catch (e) {
            toast.error(e?.message || t('Could not answer the request.'));
        } finally {
            setBusy(null);
        }
    };

    const incoming = meetings.filter((m) => m.direction === 'incoming' && m.status === 'pending');
    const accepted = meetings.filter((m) => m.status === 'accepted');
    const outgoing = meetings.filter((m) => m.direction === 'outgoing' && m.status === 'pending');

    return {
        people, error, loading, reload: load, canLoad,
        meetings, incoming, accepted, outgoing,
        request, respond, busy,
        composing, compose: (id) => { setComposing(id); setMessage(''); }, cancelCompose: () => setComposing(null),
        message, setMessage,
    };
}

// ── Plan my day ─────────────────────────────────────────────────────

export function useItinerary(event, { interests = [] } = {}) {
    const { api, user } = useSessionApi();
    const [topics, setTopics] = useState(() => [...interests].slice(0, 12));
    const [draft, setDraft] = useState('');
    const [plan, setPlan] = useState(null);
    const [dropped, setDropped] = useState(() => new Set());
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const [applied, setApplied] = useState(false);
    const tz = event?.timezone || 'UTC';

    const addTopic = (text = draft) => {
        const value = String(text).trim().slice(0, 40);
        if (value.length < 2) return;
        setTopics((list) => (list.some((x) => x.toLowerCase() === value.toLowerCase()) || list.length >= 12 ? list : [...list, value]));
        setDraft('');
    };
    const removeTopic = (value) => setTopics((list) => list.filter((x) => x !== value));

    const propose = async () => {
        if (!user) {
            openAuthDialog('login', t('Sign in to plan your day.'));
            return;
        }
        setBusy('propose');
        setError(null);
        setApplied(false);
        try {
            const next = await api.post(`/events/${event.slug}/itinerary`, { interests: topics });
            setPlan(next);
            setDropped(new Set());
        } catch (e) {
            setError(e?.message || t('Could not plan your day.'));
        } finally {
            setBusy(null);
        }
    };

    const days = useMemo(() => {
        const map = new Map();
        for (const item of plan?.items ?? []) {
            const p = zonedParts(item.session.starts_at, tz);
            const end = item.session.ends_at ? zonedParts(item.session.ends_at, tz) : null;
            if (!map.has(p.ymd)) map.set(p.ymd, { key: p.ymd, label: `${p.weekday} ${p.day} ${p.month}`, items: [] });
            map.get(p.ymd).items.push({
                ...item,
                time: `${p.hour}:${p.minute}`,
                endTime: end ? `${end.hour}:${end.minute}` : null,
                kept: !dropped.has(item.session.id),
            });
        }
        return [...map.values()];
    }, [plan, tz, dropped]);

    const kept = (plan?.items ?? []).filter((i) => !dropped.has(i.session.id));

    const toggle = (sessionId) => setDropped((set) => {
        const next = new Set(set);
        if (next.has(sessionId)) next.delete(sessionId);
        else next.add(sessionId);
        return next;
    });

    const apply = async () => {
        if (!kept.length) return;
        setBusy('apply');
        try {
            await api.post(`/events/${event.slug}/itinerary`, { apply: true, session_ids: kept.map((i) => i.session.id) });
            setApplied(true);
            toast.success(t('Added to My agenda'));
            // The agenda's bookmarks come from the server; read them again.
            router.reload({ only: ['sessions'] });
        } catch (e) {
            toast.error(e?.message || t('Could not update your agenda.'));
        } finally {
            setBusy(null);
        }
    };

    return {
        signedIn: Boolean(user),
        topics, addTopic, removeTopic, draft, setDraft,
        plan, days, kept, toggle, propose, apply, busy, error, applied,
        reset: () => { setPlan(null); setApplied(false); setError(null); },
        totalMinutes: kept.reduce((sum, i) => sum + Math.max(0, (Date.parse(i.session.ends_at) - Date.parse(i.session.starts_at)) / 60000), 0),
        skipped: plan?.skipped ?? [],
    };
}

/** "2 h 30 min", "45 min". */
export function durationLabel(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h && m) return t(':h h :m min', { h, m });
    if (h) return t(':h h', { h });
    return t(':n min', { n: m });
}

// ── Speaker availability ────────────────────────────────────────────

let rowSeq = 0;
const row = (r = {}) => ({ key: `av-${++rowSeq}`, date: r.date ?? '', from: r.from ?? '09:00', until: r.until ?? '17:00' });

/**
 * Availability windows as rows of `{ date, from, until }` in the event's zone.
 * `days` is the event's days (`[{ date, label }]`, from the server); no rows
 * means "any time during the event".
 */
export function useAvailability(initial = [], days = []) {
    const [rows, setRows] = useState(() => (initial ?? []).map(row));
    const firstFree = () => days.find((d) => !rows.some((r) => r.date === d.date))?.date ?? days[0]?.date ?? '';

    const invalid = rows.filter((r) => r.date && r.from && r.until && r.until <= r.from).map((r) => r.key);

    return {
        rows,
        days,
        anyTime: rows.length === 0,
        add: () => setRows((list) => [...list, row({ date: firstFree() })]),
        remove: (key) => setRows((list) => list.filter((r) => r.key !== key)),
        update: (key, field, value) => setRows((list) => list.map((r) => (r.key === key ? { ...r, [field]: value } : r))),
        clear: () => setRows([]),
        reset: (next = []) => setRows((next ?? []).map(row)),
        invalid,
        valid: invalid.length === 0,
        /** What the API takes. */
        payload: () => rows.filter((r) => r.date && r.from && r.until).map(({ date, from, until }) => ({ date, from, until })),
        dayLabel: (date) => days.find((d) => d.date === date)?.label ?? date,
    };
}

// ── Call for speakers ───────────────────────────────────────────────

export function useCallForSpeakers({ event, call: initialCall }) {
    const { api, user } = useSessionApi();
    const [call, setCall] = useState(initialCall);
    const [form, setForm] = useState(() => ({ title: '', abstract: '', format: 'talk', name: user?.name ?? '', email: user?.email ?? '' }));
    const availability = useAvailability([], initialCall?.days ?? []);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState({});
    const [sent, setSent] = useState(false);
    const titleRef = useRef(null);

    const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

    const submit = async (e) => {
        e?.preventDefault?.();
        if (!user) {
            openAuthDialog('login', t('Sign in to submit a talk.'));
            return;
        }
        if (!availability.valid) {
            setErrors({ availability: t('Each time must end after it starts.') });
            return;
        }
        setBusy(true);
        setErrors({});
        try {
            const next = await api.post(`/events/${event.slug}/call-for-speakers`, { ...form, availability: availability.payload() });
            setCall(next);
            setSent(true);
            setForm((f) => ({ ...f, title: '', abstract: '' }));
            availability.clear();
            toast.success(t('Talk submitted. The team will let you know.'));
        } catch (error) {
            const fields = fieldErrors(error);
            setErrors(Object.keys(fields).length ? fields : { form: error?.message || t('Could not submit. Try again.') });
        } finally {
            setBusy(false);
        }
    };

    const mine = call?.mine ?? [];

    return {
        call, form, set, availability, submit, busy, errors, sent, titleRef,
        signedIn: Boolean(user),
        signIn: () => openAuthDialog('login', t('Sign in to submit a talk.')),
        mine,
        atLimit: mine.length >= (call?.limit ?? 3),
        formats: call?.formats ?? [],
        another: () => setSent(false),
    };
}
