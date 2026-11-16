import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarClock, Eye, Send, XCircle } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { eventWhen } from '@/Core/events';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { ConfirmDialog, StatusPill, ZonedDateTime } from '@/Themes/civic/components/dashboard/kit';
import { Button, cn, Field, Input, Notice } from '@/Themes/civic/components/ui';
import Basics from '@/Themes/civic/components/dashboard/tabs/Basics';
import Tickets from '@/Themes/civic/components/dashboard/tabs/Tickets';
import Registration from '@/Themes/civic/components/dashboard/tabs/Registration';
import Agenda from '@/Themes/civic/components/dashboard/tabs/Agenda';
import Look from '@/Themes/civic/components/dashboard/tabs/Look';
import Promote from '@/Themes/civic/components/dashboard/tabs/Promote';
import Guests from '@/Themes/civic/components/dashboard/tabs/Guests';
import Checkin from '@/Themes/civic/components/dashboard/tabs/Checkin';
import Announce from '@/Themes/civic/components/dashboard/tabs/Announce';
import Insights from '@/Themes/civic/components/dashboard/tabs/Insights';

const PANELS = { basics: Basics, tickets: Tickets, registration: Registration, agenda: Agenda, look: Look, promote: Promote, guests: Guests, checkin: Checkin, announce: Announce, insights: Insights };

function tabLabel(tab) {
    return {
        basics: t('Basics'), tickets: t('Tickets'), registration: t('Registration'), agenda: t('Agenda'), look: t('Page look'),
        promote: t('Promote'), guests: t('Guests'), checkin: t('Check-in'), announce: t('Announce'), insights: t('Insights'),
    }[tab] ?? tab;
}

/** One event in the dashboard: its header, lifecycle actions and the tab panels. */
export default function Event({ event, tab, tabs, data }) {
    const { api, path, can } = useDashboard();
    const { run, busy } = useAction();
    const [dialog, setDialog] = useState(null);
    const [reason, setReason] = useState('');
    const [newStart, setNewStart] = useState(null);
    const when = eventWhen(event);
    const Panel = PANELS[tab];
    const cancelled = event.status === 'cancelled';
    const counts = event.counts ?? {};

    const publish = () => run(() => api.org.post(`/events/${event.id}/publish`), { key: 'publish', success: t('Published — it is live.'), reload: ['event', 'frame'] });
    const cancel = () => run(() => api.org.post(`/events/${event.id}/cancel`, { reason, confirm: true }), {
        key: 'cancel', success: t('Cancelled. Guests are being told and paid orders refunded.'), reload: ['event', 'data', 'frame'],
    }).then((ok) => ok && setDialog(null));
    const postpone = () => run(() => api.org.post(`/events/${event.id}/postpone`, newStart ? { starts_at: newStart } : {}), {
        key: 'postpone', success: newStart ? t('Moved. Guests are being told the new date.') : t('Postponed. Guests are being told.'), reload: ['event', 'data'],
    }).then((ok) => ok && setDialog(null));

    return (
        <>
            <Head title={`${tabLabel(tab)} · ${event.title}`} />
            <Link href={path('/events')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{t('All events')}
            </Link>

            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusPill status={event.status === 'published' ? event.state : event.status} />
                        {event.moderation_status && event.moderation_status !== 'approved' && <StatusPill status="pending" label={t('In review')} />}
                        <span className="font-mono text-xs text-muted">{when.long} · {when.time} {when.zone}</span>
                    </div>
                    <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[36px]">{event.title}</h1>
                    <p className="mt-1 font-mono text-sm text-muted">
                        {t(':going going', { going: counts.going ?? 0 })} · {t(':n sold', { n: counts.sold ?? 0 })}
                        {counts.pending ? ` · ${t(':n to approve', { n: counts.pending })}` : ''}
                        {counts.waitlisted ? ` · ${t(':n waiting', { n: counts.waitlisted })}` : ''}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" icon={Eye} href={event.public_url} external>{t('View page')}</Button>
                    {can.edit && !cancelled && event.status !== 'published' && (
                        <Button variant="cta" size="sm" icon={Send} loading={busy === 'publish'} onClick={publish}>{t('Publish')}</Button>
                    )}
                    {can.edit && !cancelled && (
                        <Button variant="ghost" size="sm" icon={CalendarClock} onClick={() => setDialog('postpone')}>{t('Postpone')}</Button>
                    )}
                    {can.sales && !cancelled && (
                        <Button variant="danger" size="sm" icon={XCircle} onClick={() => setDialog('cancel')}>{t('Cancel event')}</Button>
                    )}
                </div>
            </div>

            {cancelled && <Notice tone="danger" className="mb-5">{t('Cancelled')}{event.cancel_reason ? ` — ${event.cancel_reason}` : ''}. {t('Paid orders are refunded automatically.')}</Notice>}

            <div role="tablist" aria-label={t('Event sections')} className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
                {tabs.map((key) => (
                    <Link
                        key={key}
                        href={path(`/events/${event.id}/${key}`)}
                        role="tab"
                        aria-selected={key === tab}
                        preserveScroll
                        className={cn('-mb-px shrink-0 border-b-[3px] px-3 pb-3 pt-2 text-[15px] font-semibold', key === tab ? 'border-cta text-ink' : 'border-transparent text-muted hover:text-ink')}
                    >
                        {tabLabel(key)}
                        {key === 'guests' && counts.pending ? <span className="ms-1.5 rounded-chip bg-tint-2 px-1.5 font-mono text-xs text-on-tint-2">{counts.pending}</span> : null}
                    </Link>
                ))}
            </div>

            <section role="tabpanel" aria-label={tabLabel(tab)}>
                {Panel ? <Panel key={`${event.id}-${tab}`} event={event} data={data ?? {}} /> : null}
            </section>

            <ConfirmDialog
                open={dialog === 'cancel'}
                onClose={() => setDialog(null)}
                title={t('Cancel “:title”?', { title: event.title })}
                confirmLabel={counts.paid_orders ? t('Cancel and refund :n orders', { n: counts.paid_orders }) : t('Cancel the event')}
                onConfirm={cancel}
                busy={busy === 'cancel'}
            >
                <p>{t('Every guest is told. Free tickets stop working at once.')}</p>
                {counts.paid_orders > 0 && (
                    <Notice tone="warn">{t(':n paid orders will be refunded in full, fees included. This cannot be undone.', { n: counts.paid_orders })}</Notice>
                )}
                <Field label={t('Reason guests will see (optional)')} htmlFor="cancel-reason">
                    <Input id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} placeholder={t('e.g. The venue flooded')} />
                </Field>
            </ConfirmDialog>

            <ConfirmDialog
                open={dialog === 'postpone'}
                onClose={() => setDialog(null)}
                title={t('Postpone “:title”', { title: event.title })}
                confirmLabel={newStart ? t('Move to the new date') : t('Postpone, date to follow')}
                onConfirm={postpone}
                busy={busy === 'postpone'}
                tone="primary"
            >
                <p>{t('Tickets stay valid. Pick the new start, or leave it empty to announce a date later (sales pause until then).')}</p>
                <Field label={t('New start')} htmlFor="new-start">
                    <ZonedDateTime id="new-start" value={newStart} onChange={setNewStart} timeZone={event.timezone} />
                </Field>
            </ConfirmDialog>
        </>
    );
}

Event.layout = dashLayout;
