import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createApi } from '@/Core/lib/api';
import { useViewer } from '@/Core/lib/useSite';
import { t } from '@/Core/i18n';

/*
 | Headless account page (Pages/Site/Account): tabs, notification prefs,
 | inbox. The Security card has its own hooks in Site/logic/auth
 | (useAccountSecurity, usePasswordChange, useConnectedAccounts).
 |
 | Writes go to /api/v1 with the session's bearer token, like every other
 | mutation on the site — one set of rules for web and mobile.
 */

export const ACCOUNT_TABS = ['profile', 'inbox', 'billing', 'settings'];

export function useAccountPage({ profile, notifications }) {
    const user = useViewer();
    const api = useMemo(() => createApi(user?.token), [user?.token]);

    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') return 'profile';
        const asked = new URLSearchParams(window.location.search).get('tab');
        return ACCOUNT_TABS.includes(asked) ? asked : 'profile';
    });
    const [prefs, setPrefs] = useState({ notifyNewEvents: profile.notifyNewEvents });
    const [inbox, setInbox] = useState(notifications);
    const [saving, setSaving] = useState(false);

    const unread = inbox.filter((item) => !item.read).length;

    const save = async (patch) => {
        const previous = prefs;

        setPrefs((current) => ({ ...current, ...patch }));
        setSaving(true);

        try {
            await api.patch('/user/profile', patch);
        } catch (error) {
            setPrefs(previous);
            toast.error(error.message ?? t('Could not save that.'));
        } finally {
            setSaving(false);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read', {});
            setInbox((items) => items.map((item) => ({ ...item, read: true })));
        } catch (error) {
            toast.error(error.message ?? t('Could not update the inbox.'));
        }
    };

    return { activeTab, setActiveTab, prefs, save, saving, inbox, unread, markAllRead };
}

/* ── Pure helpers ─────────────────────────────────────────────────────────── */

export function formatAccountDate(value) {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function profileInitial(profile) {
    return (profile.name ?? profile.email ?? '?').charAt(0).toUpperCase();
}
