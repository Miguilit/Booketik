/*
 | Notification preferences — the `/me/preferences` contract shared with the
 | app: per-category switches, push/email masters, quiet hours and muted
 | organizers. Every change is a `PATCH` that merges key by key, sent as it
 | happens (toggles) or after a short pause (times).
 */
import { useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { createApi } from './lib/api';
import { t } from './i18n';

export function categoryCopy(key) {
    return {
        tickets: [t('Tickets and orders'), t('Order confirmations, transfers and refunds.')],
        reminders: [t('Reminders'), t('The day before, and when it is about to start.')],
        waitlist: [t('Waitlist'), t('When a spot opens and your claim is about to expire.')],
        approvals: [t('Approvals'), t('When an organizer accepts or declines your request.')],
        announcements: [t('Announcements'), t('Messages from organizers, and changes to your events.')],
        following: [t('Following'), t('New events from organizers you follow.')],
        social: [t('Friends'), t('When friends are going, and invitations.')],
        organizer: [t('Organizer'), t('Approval requests, sales and payouts for your team.')],
        account: [t('Account'), t('Security, verification and your plan.')],
        promotions: [t('Promotions'), t('Occasional picks and offers. Off unless you want them.')],
    }[key] ?? [key, ''];
}

export function useNotificationPreferences(initial) {
    const { auth } = usePage().props;
    const api = useMemo(() => createApi(auth?.user?.token), [auth?.user?.token]);
    const [prefs, setPrefs] = useState(initial);
    const [saving, setSaving] = useState(false);
    const timer = useRef(null);

    const send = async (patch, previous) => {
        setSaving(true);
        try {
            const next = await api.patch('/me/preferences', patch);
            setPrefs(next);
        } catch {
            setPrefs(previous);
            toast.error(t('Could not save. Try again.'));
        } finally {
            setSaving(false);
        }
    };

    const merge = (base, patch) => {
        const out = { ...base };
        for (const [k, v] of Object.entries(patch)) {
            out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(base?.[k] ?? {}, v) : v;
        }
        return out;
    };

    const update = (notifications, { debounce = false } = {}) => {
        const previous = prefs;
        setPrefs((p) => merge(p, { notifications }));
        clearTimeout(timer.current);
        if (debounce) timer.current = setTimeout(() => send({ notifications }, previous), 600);
        else send({ notifications }, previous);
    };

    const n = prefs?.notifications ?? {};

    return {
        prefs,
        saving,
        push: Boolean(n.push),
        email: Boolean(n.email),
        categories: n.categories ?? {},
        quiet: n.quiet_hours ?? { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
        muted: n.muted_organizers ?? [],
        setPush: (v) => update({ push: v }),
        setEmail: (v) => update({ email: v }),
        setCategory: (key, v) => update({ categories: { [key]: v } }),
        setQuiet: (patch) => update({ quiet_hours: patch }, { debounce: 'start' in patch || 'end' in patch }),
        unmute: (slug) => {
            const previous = prefs;
            const rest = (n.muted_organizers ?? []).filter((o) => o.slug !== slug);
            setPrefs((p) => merge(p, { notifications: { muted_organizers: rest } }));
            send({ notifications: { muted_organizers: rest.map((o) => o.slug) } }, previous);
        },
    };
}
