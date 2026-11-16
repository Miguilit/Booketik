/*
 | Shared by the event editor's tabs: the PATCH-the-event helper, a time
 | label in the event's own zone, and a small form section.
 */
import { useCallback } from 'react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { cn } from '../../ui';

export const RELOAD = ['event', 'data', 'frame'];

/** `{ save(changes, opts), busy, errors, run, api }` for this event. */
export function useEventSave(event) {
    const { api } = useDashboard();
    const action = useAction();
    const save = useCallback(
        (changes, { success, key = 'save' } = {}) => action.run(() => api.org.patch(`/events/${event.id}`, changes), { key, success, reload: RELOAD }),
        [action, api, event.id],
    );
    return { ...action, save, api };
}

/** "Fri 7 Nov, 19:00 CET" in the event's zone. */
export function zonedLabel(iso, timeZone) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat(undefined, {
            timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

/** Plain text (an AI draft) → editor HTML paragraphs. */
export function textToHtml(text) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return String(text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
        .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

export function Section({ title, description, children, className, aside }) {
    return (
        <section className={cn('grid gap-5 border-b border-line py-7 first:pt-0 last:border-0 lg:grid-cols-[240px_minmax(0,1fr)]', className)}>
            <div>
                <h3 className="font-display text-[19px] font-bold text-ink">{title}</h3>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                {aside}
            </div>
            <div className="min-w-0 space-y-4">{children}</div>
        </section>
    );
}
