import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Check, ChevronDown, Download, Flag, Quote, TextSearch, Undo2, X } from 'lucide-react';
import { t } from '@/Core/i18n';
import { useAction, useDashboard, useKeyboardTriage } from '@/Core/dashboard';
import { Panel, StatusPill } from '../kit';
import { Avatar, Button, Chip, cn, EmptyState, Input, Tag } from '../../ui';
import RefundDialog from './RefundDialog';

const STATUSES = ['pending', 'waitlisted', 'going', 'approved', 'declined', 'cancelled', 'attended', 'all'];
const FLAG_LABEL = {
    spam: () => t('Looks like spam'),
    duplicate: () => t('Possible duplicate'),
    disposable_email: () => t('Disposable email'),
    incomplete: () => t('Answers incomplete'),
};

/** The guest list: the approval queue with keyboard triage, the waitlist, attendees, export and refunds. */
export default function Guests({ event, data }) {
    const { api, path, can } = useDashboard();
    const { run, busy } = useAction();
    const status = data?.status ?? 'going';
    const [rows, setRows] = useState(data?.guests ?? []);
    const [cursor, setCursor] = useState(data?.next_cursor ?? null);
    const [announce, setAnnounce] = useState('');
    const [criteria, setCriteria] = useState('');
    const [refund, setRefund] = useState(null);
    const [open, setOpen] = useState({});
    const pending = status === 'pending';

    // A reload (after a decision or a triage run) brings a fresh first page.
    useEffect(() => {
        setRows(data?.guests ?? []);
        setCursor(data?.next_cursor ?? null);
    }, [data?.guests, data?.next_cursor]);
    const currency = event.ticket_types?.find((tier) => tier.price_cents > 0)?.currency ?? 'EUR';

    const decide = async (guest, action) => {
        const done = await run(() => api.org.post(`/registrations/${guest.id}/${action}`), { key: guest.id, quiet: false });
        if (!done) return;
        setRows((list) => list.filter((g) => g.id !== guest.id));
        const label = { approve: t('Approved :name', { name: guest.name }), decline: t('Declined :name', { name: guest.name }), 'offer-spot': t('Offered a spot to :name', { name: guest.name }) }[action];
        setAnnounce(label);
        router.reload({ only: ['frame', 'event'], preserveScroll: true });
    };

    const triage = useKeyboardTriage(rows, {
        enabled: pending && can.edit,
        onApprove: (g) => decide(g, 'approve'),
        onDecline: (g) => decide(g, 'decline'),
        onOpen: (g) => setOpen((o) => ({ ...o, [g.id]: !o[g.id] })),
    });

    const summarise = () => run(() => api.org.post('/ai/triage', { event_id: event.id, criteria: criteria.trim() || null }), {
        key: 'triage',
        success: (d) => t('Summarised :n applicants. You still decide every one.', { n: d.applicants?.length ?? 0 }),
        reload: ['data'],
    });

    const more = async () => {
        const q = new URLSearchParams({ ...(status !== 'all' ? { status } : {}), cursor });
        const page = await run(() => api.org.list(`/events/${event.id}/guests?${q}`), { key: 'more' });
        if (page) {
            setRows((list) => [...list, ...(page.data ?? [])]);
            setCursor(page.meta?.next_cursor ?? null);
        }
    };

    const counts = event.counts ?? {};
    const countFor = useMemo(() => ({ pending: counts.pending, waitlisted: counts.waitlisted, going: counts.going, declined: counts.declined }), [counts]);

    return (
        <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => (
                    <Chip key={s} active={s === status} count={countFor[s]} onClick={() => router.get(path(`/events/${event.id}/guests`), { status: s }, { preserveState: false })}>
                        {s === 'all' ? t('Everyone') : s === 'waitlisted' ? t('Waitlist') : statusName(s)}
                    </Chip>
                ))}
                <Button size="sm" variant="secondary" icon={Download} className="ms-auto" href={path(`/events/${event.id}/guests.csv`)} external download>{t('Export CSV')}</Button>
            </div>

            {pending && can.edit && (
                <Panel title={t('Approval queue')} bodyClass="space-y-3">
                    <p className="text-sm text-muted">
                        {t('Keyboard:')} <Kbd>j</Kbd> / <Kbd>k</Kbd> {t('move')} · <Kbd>a</Kbd> {t('approve')} · <Kbd>d</Kbd> {t('decline')} · <Kbd>o</Kbd> {t('show answers')}
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[220px] flex-1">
                            <label htmlFor="triage-criteria" className="mb-1.5 block text-sm font-semibold text-ink">{t('What fits this event? (optional)')}</label>
                            <Input id="triage-criteria" value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder={t('e.g. founders in fintech')} />
                        </div>
                        <Button variant="secondary" icon={TextSearch} loading={busy === 'triage'} onClick={summarise} disabled={!rows.length}>{t('Summarise applicants')}</Button>
                    </div>
                    <p className="text-xs text-muted">{t('A one-line summary and spam or duplicate flags for each applicant. It never approves or declines — you do.')}</p>
                </Panel>
            )}

            <p className="sr-only" aria-live="polite">{announce}</p>

            {rows.length === 0 ? (
                <EmptyState title={pending ? t('No one is waiting for approval') : t('No guests here yet')} body={pending ? t('New requests show up here, and in the Guests badge in the sidebar.') : null} />
            ) : (
                <ul className="divide-y divide-line rounded-card border border-line bg-surface" aria-label={t('Guests')}>
                    {rows.map((g, i) => (
                        <li
                            key={g.id}
                            className={cn('px-4 py-3.5 sm:px-5', pending && triage.index === i && 'bg-tint/40 outline outline-2 -outline-offset-2 outline-focus')}
                            aria-current={pending && triage.index === i ? 'true' : undefined}
                            onClick={() => pending && triage.setIndex(i)}
                        >
                            <div className="flex flex-wrap items-start gap-3">
                                <Avatar image={g.avatar} name={g.name} size={36} />
                                <div className="min-w-0 flex-1 basis-[calc(100%-48px)] sm:basis-0">
                                    <p className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-ink">{g.name ?? t('Guest')}</span>
                                        <StatusPill status={g.status} />
                                        {g.ticket_type && <span className="text-sm text-muted">{g.ticket_type}</span>}
                                        {g.checked_in_at && <Tag tone="success">{t('In')}</Tag>}
                                    </p>
                                    {g.email && <p className="truncate font-mono text-xs text-muted">{g.email}</p>}
                                    {g.ai_summary && (
                                        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-body"><Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-label={t('Summary')} />{g.ai_summary}</p>
                                    )}
                                    {g.ai_flags?.length > 0 && (
                                        <p className="mt-1.5 flex flex-wrap gap-1.5">{g.ai_flags.map((f) => <Tag key={f} tone="warn" icon={Flag}>{FLAG_LABEL[f]?.() ?? f}</Tag>)}</p>
                                    )}
                                    {g.answers?.length > 0 && (
                                        <button type="button" className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-link" aria-expanded={Boolean(open[g.id])} onClick={(e) => { e.stopPropagation(); setOpen((o) => ({ ...o, [g.id]: !o[g.id] })); }}>
                                            {t(':n answers', { n: g.answers.length })}<ChevronDown className={cn('h-4 w-4 transition-transform', open[g.id] && 'rotate-180')} aria-hidden="true" />
                                        </button>
                                    )}
                                    {open[g.id] && (
                                        <dl className="mt-2 space-y-1.5 rounded-sm bg-raised p-3 text-sm">
                                            {g.answers.map((a) => <div key={a.question_id}><dt className="font-semibold text-ink">{a.label}</dt><dd className="text-body">{a.answer || '—'}</dd></div>)}
                                        </dl>
                                    )}
                                </div>
                                <div className="flex w-full flex-wrap gap-2 ps-12 sm:w-auto sm:ps-0">
                                    {g.status === 'pending' && can.edit && (
                                        <>
                                            <Button size="sm" variant="primary" icon={Check} loading={busy === g.id} onClick={() => decide(g, 'approve')}>{t('Approve')}</Button>
                                            <Button size="sm" variant="ghost" icon={X} onClick={() => decide(g, 'decline')}>{t('Decline')}</Button>
                                        </>
                                    )}
                                    {g.status === 'waitlisted' && can.edit && (
                                        <Button size="sm" variant="secondary" icon={Undo2} loading={busy === g.id} onClick={() => decide(g, 'offer-spot')}>{t('Offer a spot')}</Button>
                                    )}
                                    {g.order_id && can.sales && (
                                        <Button size="sm" variant="danger" onClick={() => setRefund(g)}>{t('Refund')}</Button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {cursor && <div className="text-center"><Button variant="secondary" loading={busy === 'more'} onClick={more}>{t('Load more')}</Button></div>}

            {refund && <RefundDialog orderId={refund.order_id} guestName={refund.name} currency={currency} onClose={() => setRefund(null)} />}
        </div>
    );
}

function Kbd({ children }) {
    return <kbd className="rounded-[6px] border border-line bg-raised px-1.5 py-0.5 font-mono text-xs text-ink">{children}</kbd>;
}

function statusName(s) {
    return { pending: t('Pending'), going: t('Going'), approved: t('Approved'), declined: t('Declined'), cancelled: t('Cancelled'), attended: t('Attended') }[s] ?? s;
}
