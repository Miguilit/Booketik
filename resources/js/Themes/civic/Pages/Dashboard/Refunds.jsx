import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ReceiptText } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { ConfirmDialog, MoneyInput, PageHead, Panel, StatusPill, Table } from '@/Themes/civic/components/dashboard/kit';
import { Button, Chip, EmptyState, Field, Textarea } from '@/Themes/civic/components/ui';

/** Refund requests from guests: approve in full or in part, or reject with a note they will read. */
export default function Refunds({ status, requests = [] }) {
    const { api, path } = useDashboard();
    const { run, busy } = useAction();
    const [open, setOpen] = useState(null);
    const [amount, setAmount] = useState(null);
    const [note, setNote] = useState('');

    const start = (row, mode) => {
        setOpen({ row, mode });
        setAmount(row.price?.amount ?? null);
        setNote('');
    };

    const decide = () => {
        const { row, mode } = open;
        const body = mode === 'approve' ? { ...(amount && amount !== row.price?.amount ? { amount } : {}), ...(note ? { note } : {}) } : { note };
        run(() => api.org.post(`/refund-requests/${row.id}/${mode}`, body), {
            key: 'decide', success: mode === 'approve' ? t('Refunded.') : t('Rejected — the guest is told why.'), reload: ['requests', 'frame'],
        }).then((ok) => ok && setOpen(null));
    };

    return (
        <>
            <Head title={t('Refund requests')} />
            <PageHead title={t('Refund requests')} subtitle={t('Guests ask from their ticket. Money goes back to the card they paid with; the seat goes back on sale.')} />
            <div className="mb-4 flex flex-wrap gap-2">
                {[['requested', t('Waiting')], ['refunded', t('Refunded')], ['rejected', t('Rejected')], ['all', t('All')]].map(([key, label]) => (
                    <Chip key={key} href={`${path('/refunds')}?status=${key}`} active={status === key}>{label}</Chip>
                ))}
            </div>
            <Panel bodyClass="py-1">
                <Table
                    caption={t('Refund requests')}
                    rows={requests}
                    empty={<EmptyState className="my-4" icon={ReceiptText} title={status === 'requested' ? t('No requests waiting') : t('Nothing here')} />}
                    columns={[
                        { key: 'guest', label: t('Guest'), render: (r) => <span><span className="block font-semibold text-ink">{r.guest?.name ?? '—'}</span><span className="text-xs text-muted">{r.guest?.email}</span></span> },
                        { key: 'event', label: t('Event'), render: (r) => <span className="text-body">{r.event?.title}<span className="block font-mono text-xs text-muted">{r.ticket_code}</span></span> },
                        { key: 'reason', label: t('Reason'), render: (r) => <span className="text-sm text-body">{r.reason || '—'}</span> },
                        { key: 'price', label: t('Paid'), align: 'end', render: (r) => <span className="font-mono tabular-nums">{r.refund?.amount?.formatted ?? r.price?.formatted ?? '—'}</span> },
                        { key: 'status', label: t('Status'), render: (r) => <StatusPill status={r.status} /> },
                        {
                            key: 'act', label: '', hideLabel: true, align: 'end',
                            render: (r) => r.status === 'requested' && (
                                <span className="inline-flex gap-2">
                                    <Button size="sm" variant="primary" onClick={() => start(r, 'approve')}>{t('Refund')}</Button>
                                    <Button size="sm" variant="ghost" onClick={() => start(r, 'reject')}>{t('Reject')}</Button>
                                </span>
                            ),
                        },
                    ]}
                />
            </Panel>

            <ConfirmDialog
                open={Boolean(open)}
                onClose={() => setOpen(null)}
                title={open?.mode === 'approve' ? t('Refund :name', { name: open?.row.guest?.name ?? '' }) : t('Reject the request')}
                confirmLabel={open?.mode === 'approve' ? t('Send the refund') : t('Reject')}
                tone={open?.mode === 'approve' ? 'primary' : 'danger'}
                onConfirm={decide}
                busy={busy === 'decide'}
                disabled={open?.mode === 'reject' && note.trim().length < 3}
            >
                {open?.mode === 'approve' && (
                    <Field label={t('Amount (full by default — lower it for a partial refund)')} htmlFor="refund-amount">
                        <MoneyInput id="refund-amount" value={amount} currency={open.row.price?.currency ?? 'EUR'} onChange={setAmount} />
                    </Field>
                )}
                <Field label={open?.mode === 'approve' ? t('Note (optional)') : t('Why — the guest reads this')} htmlFor="refund-note" required={open?.mode === 'reject'}>
                    <Textarea id="refund-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
                </Field>
            </ConfirmDialog>
        </>
    );
}

Refunds.layout = dashLayout;
