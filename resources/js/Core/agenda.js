/*
 | Conference agenda: sessions grouped by day (in the event's zone) and by
 | track, a time grid, and "My agenda" bookmarks
 | (`POST|DELETE /events/{slug}/agenda/{session}/bookmark`). Signed out,
 | bookmarks are kept in this browser and the visitor is asked to sign in to
 | keep them.
 */
import { useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { createApi } from './lib/api';
import { openAuthDialog } from './lib/auth/authDialog';
import { t } from './i18n';
import { zonedParts } from './events';

const LOCAL_KEY = (slug) => `eg_agenda_${slug}`;

function readLocal(slug) {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY(slug)) || '[]');
    } catch {
        return [];
    }
}

export function useAgenda({ event, sessions }) {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;
    const api = useMemo(() => createApi(user?.token), [user?.token]);
    const tz = event?.timezone || 'UTC';

    const [marked, setMarked] = useState(() => {
        const server = (sessions ?? []).filter((s) => s.viewer?.bookmarked).map((s) => s.id);
        return new Set(user ? server : [...server, ...readLocal(event?.slug)]);
    });
    const [onlyMine, setOnlyMine] = useState(false);
    const [track, setTrack] = useState(null);

    const tracks = useMemo(() => {
        const map = new Map();
        for (const s of sessions ?? []) if (s.track) map.set(s.track.id, s.track);
        return [...map.values()];
    }, [sessions]);

    const days = useMemo(() => {
        const map = new Map();
        for (const s of sessions ?? []) {
            if (onlyMine && !marked.has(s.id)) continue;
            if (track && s.track?.id !== track) continue;
            const p = zonedParts(s.starts_at, tz);
            const end = s.ends_at ? zonedParts(s.ends_at, tz) : null;
            const key = p.ymd;
            if (!map.has(key)) map.set(key, { key, label: `${p.weekday} ${p.day} ${p.month}`, slots: new Map() });
            const slotKey = `${p.hour}:${p.minute}`;
            const day = map.get(key);
            if (!day.slots.has(slotKey)) day.slots.set(slotKey, { time: slotKey, sessions: [] });
            day.slots.get(slotKey).sessions.push({ ...s, time: slotKey, endTime: end ? `${end.hour}:${end.minute}` : null, bookmarked: marked.has(s.id) });
        }
        return [...map.values()].map((d) => ({ ...d, slots: [...d.slots.values()] }));
    }, [sessions, tz, marked, onlyMine, track]);

    const toggle = async (session) => {
        const on = !marked.has(session.id);
        const next = new Set(marked);
        if (on) next.add(session.id);
        else next.delete(session.id);
        setMarked(next);

        if (!user) {
            try {
                localStorage.setItem(LOCAL_KEY(event.slug), JSON.stringify([...next]));
            } catch {
                // Private mode: kept for this visit only.
            }
            if (on) toast(t('Saved in this browser. Sign in to keep your agenda everywhere.'), { id: 'agenda-local' });
            return;
        }

        try {
            const path = `/events/${event.slug}/agenda/${session.id}/bookmark`;
            if (on) await api.post(path, {});
            else await api.del(path);
        } catch {
            setMarked(marked);
            toast.error(t('Could not update your agenda.'));
        }
    };

    return {
        days,
        tracks,
        track,
        setTrack,
        onlyMine,
        setOnlyMine,
        mineCount: marked.size,
        toggle,
        signIn: () => openAuthDialog('login', t('Sign in to keep your agenda.')),
        timezone: tz,
    };
}
