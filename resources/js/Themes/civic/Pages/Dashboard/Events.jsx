import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarPlus, Search } from 'lucide-react';
import { useDashboard } from '@/Core/dashboard';
import { eventWhen } from '@/Core/events';
import { formatCount } from '@/Core/format';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { PageHead, Panel, StatusPill, Table } from '@/Themes/civic/components/dashboard/kit';
import { Button, Chip, EmptyState, Img, Input } from '@/Themes/civic/components/ui';

/** Events: upcoming, drafts and past, with a quick text filter and the state of each. */
export default function Events({ when, events = [], next_cursor: nextCursor }) {
    const { path, can } = useDashboard();
    const [q, setQ] = useState('');
    const [state, setState] = useState('all');

    const rows = useMemo(() => events.filter((e) => (!q || e.title.toLowerCase().includes(q.toLowerCase())) && (state === 'all' || e.state === state)), [events, q, state]);
    const states = [...new Set(events.map((e) => e.state))];

    return (
        <>
            <Head title={t('Events')} />
            <PageHead title={t('Events')} actions={can.edit && <Button variant="cta" icon={CalendarPlus} href={path('/events/new')}>{t('Create an event')}</Button>} />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                {[['upcoming', t('Upcoming')], ['draft', t('Drafts')], ['past', t('Past')]].map(([key, label]) => (
                    <Chip key={key} href={`${path('/events')}?when=${key}`} active={when === key}>{label}</Chip>
                ))}
                <label className="relative ms-auto w-full sm:w-64">
                    <span className="sr-only">{t('Filter by title')}</span>
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Filter by title')} className="ps-9" />
                </label>
            </div>
            {states.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2" aria-label={t('Status')}>
                    <Chip active={state === 'all'} onClick={() => setState('all')} className="h-9">{t('All')}</Chip>
                    {states.map((s) => <Chip key={s} active={state === s} onClick={() => setState(s)} className="h-9"><StatusPill status={s} /></Chip>)}
                </div>
            )}

            <Panel bodyClass="py-1">
                <Table
                    caption={t('Events')}
                    rows={rows}
                    onRowClick={(e) => router.visit(path(`/events/${e.id}`))}
                    empty={<EmptyState className="my-4" icon={CalendarPlus} title={when === 'draft' ? t('No drafts') : when === 'past' ? t('No past events yet') : t('Nothing coming up')} action={can.edit && <Button variant="primary" href={path('/events/new')}>{t('Create an event')}</Button>} />}
                    columns={[
                        {
                            key: 'title', label: t('Event'), hideLabel: true,
                            render: (e) => {
                                const w = eventWhen(e);
                                return (
                                    <span className="flex items-center gap-3">
                                        <Img image={e.cover} alt="" className="h-12 w-16 shrink-0 rounded-[10px]" sizes="64px" />
                                        <span className="min-w-0">
                                            <Link href={path(`/events/${e.id}`)} className="block truncate font-semibold text-ink hover:underline" onClick={(ev) => ev.stopPropagation()}>{e.title}</Link>
                                            <span className="font-mono text-xs text-muted">{w.short} · {w.time} {w.zone}</span>
                                        </span>
                                    </span>
                                );
                            },
                        },
                        { key: 'state', label: t('Status'), render: (e) => <StatusPill status={e.state} /> },
                        { key: 'sold', label: t('Sold'), align: 'end', render: (e) => <span className="font-mono tabular-nums">{formatCount(e.sold)}{e.capacity ? `/${formatCount(e.capacity)}` : ''}</span> },
                        { key: 'pending', label: t('To approve'), align: 'end', render: (e) => <span className="font-mono tabular-nums">{e.pending_approvals || '—'}</span> },
                        { key: 'revenue', label: t('Revenue'), align: 'end', render: (e) => <span className="font-mono tabular-nums">{e.revenue?.formatted ?? t('Free')}</span> },
                    ]}
                />
            </Panel>
            {nextCursor && (
                <div className="mt-4 text-center">
                    <Button variant="secondary" href={`${path('/events')}?when=${when}&cursor=${encodeURIComponent(nextCursor)}`}>{t('More')}</Button>
                </div>
            )}
        </>
    );
}

Events.layout = dashLayout;
