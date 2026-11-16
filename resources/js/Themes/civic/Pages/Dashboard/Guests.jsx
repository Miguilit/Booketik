import { Head, Link } from '@inertiajs/react';
import { Inbox, Keyboard } from 'lucide-react';
import { useDashboard } from '@/Core/dashboard';
import { eventWhen } from '@/Core/events';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { PageHead, Panel, Table } from '@/Themes/civic/components/dashboard/kit';
import { Button, EmptyState, Img } from '@/Themes/civic/components/ui';

/** Every upcoming event's open requests and waitlist, so nobody waits on an organizer who forgot a tab. */
export default function Guests({ events = [] }) {
    const { path } = useDashboard();
    const open = events.filter((e) => e.pending || e.waitlisted);

    return (
        <>
            <Head title={t('Guests')} />
            <PageHead title={t('Guests')} subtitle={t('Requests to approve and waitlists, across your upcoming events. Open one to triage with the keyboard: j / k to move, a to approve, d to decline.')} />
            <Panel bodyClass="py-1">
                <Table
                    caption={t('Events with guests waiting')}
                    rows={open}
                    empty={<EmptyState className="my-4" icon={Inbox} title={t('Nobody is waiting')} body={t('Requests and waitlist sign-ups for upcoming events show up here.')} />}
                    columns={[
                        {
                            key: 'title', label: t('Event'), hideLabel: true,
                            render: (e) => {
                                const w = eventWhen(e);
                                return (
                                    <span className="flex items-center gap-3">
                                        <Img image={e.cover} alt="" className="h-11 w-14 shrink-0 rounded-[10px]" sizes="56px" />
                                        <span className="min-w-0"><span className="block truncate font-semibold text-ink">{e.title}</span><span className="font-mono text-xs text-muted">{w.short} · {w.time} {w.zone}</span></span>
                                    </span>
                                );
                            },
                        },
                        { key: 'pending', label: t('To approve'), align: 'end', render: (e) => <span className="font-mono tabular-nums">{e.pending || '—'}</span> },
                        { key: 'waitlisted', label: t('Waitlist'), align: 'end', render: (e) => <span className="font-mono tabular-nums">{e.waitlisted || '—'}</span> },
                        {
                            key: 'go', label: '', hideLabel: true, align: 'end',
                            render: (e) => (
                                <span className="inline-flex gap-2">
                                    {e.pending > 0 && <Button size="sm" variant="primary" icon={Keyboard} href={`${path(`/events/${e.id}/guests`)}?status=pending`}>{t('Triage')}</Button>}
                                    {e.waitlisted > 0 && <Button size="sm" variant="secondary" href={`${path(`/events/${e.id}/guests`)}?status=waitlisted`}>{t('Waitlist')}</Button>}
                                </span>
                            ),
                        },
                    ]}
                />
            </Panel>
            {events.length > open.length && (
                <p className="mt-4 text-sm text-muted">{t('Other upcoming events have nobody waiting.')} <Link href={path('/events')} className="font-semibold text-link">{t('All events')}</Link></p>
            )}
        </>
    );
}

Guests.layout = dashLayout;
