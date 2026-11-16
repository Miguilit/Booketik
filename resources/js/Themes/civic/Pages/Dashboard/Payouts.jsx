import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { BadgeCheck, ExternalLink, Landmark } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { ConfirmDialog, Hint, MoneyInput, PageHead, Panel, StatTile, StatusPill, Table } from '@/Themes/civic/components/dashboard/kit';
import { Button, EmptyState, Field, Notice } from '@/Themes/civic/components/ui';

const CONNECT_COPY = {
    not_started: () => t('Connect a Stripe account and card sales are paid straight to your bank.'),
    incomplete: () => t('Stripe needs a few more details before it can pay you.'),
    pending_verification: () => t('Stripe is checking your details. This usually takes a day or two.'),
    ready: () => t('Stripe pays your card sales straight to your bank.'),
};

const LINE = { sale: () => t('Sale'), refund: () => t('Refund'), adjustment: () => t('Adjustment'), payout: () => t('Payout'), payout_reversal: () => t('Payout reversed') };

/** Getting paid: Stripe Connect, the balance, payout requests and the ledger behind them. */
export default function Payouts({ payouts, connect, ledger = [], balance, rules, next_cursor: nextCursor }) {
    const { api, can, path } = useDashboard();
    const { run, busy } = useAction();
    const [asking, setAsking] = useState(false);
    const [amount, setAmount] = useState(null);
    const currency = payouts?.currency ?? 'EUR';

    const onboard = () => run(() => api.org.post('/payments/connect'), { key: 'connect' }).then((d) => d?.url && window.location.assign(d.url));
    const request = () => run(() => api.org.post('/payouts', amount ? { amount } : {}), { key: 'request', success: t('Requested. The platform team pays it out — you will get a notification.'), reload: ['payouts', 'ledger', 'balance'] })
        .then((ok) => ok && setAsking(false));

    return (
        <>
            <Head title={t('Payouts')} />
            <PageHead title={t('Payouts')} />

            <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label={t('Available')} value={balance?.available?.formatted ?? payouts?.balance?.formatted} note={t('Ready to pay out')} />
                <StatTile label={t('Pending')} value={balance?.pending?.formatted ?? payouts?.pending?.formatted} note={t('Released :n days after each sale', { n: rules?.hold_days ?? 7 })} />
                <StatTile label={t('Next payout')} value={payouts?.next_payout_at ? new Date(payouts.next_payout_at).toLocaleDateString() : '—'} note={rules?.schedule === 'manual_only' ? t('Arranged by the platform') : t('Minimum :min', { min: rules?.minimum })} />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
                <Panel title={t('Stripe Connect')}>
                    {!connect?.available ? (
                        <Notice tone="info">{t('Card payouts through Stripe are not switched on for this platform. Your balance is paid out manually on request.')}</Notice>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <StatusPill status={connect.state === 'ready' ? 'approved' : connect.state === 'not_started' ? 'draft' : 'pending'} label={{ not_started: t('Not connected'), incomplete: t('Details missing'), pending_verification: t('Being verified'), ready: t('Connected') }[connect.state]} />
                                {connect.country && <span className="font-mono text-xs text-muted">{connect.country}</span>}
                            </div>
                            <p className="text-[15px] text-body">{CONNECT_COPY[connect.state]?.()}</p>
                            {connect.state !== 'ready' && (
                                <Button variant="primary" icon={ExternalLink} loading={busy === 'connect'} onClick={onboard}>{connect.state === 'not_started' ? t('Connect with Stripe') : t('Continue on Stripe')}</Button>
                            )}
                            {connect.state === 'ready' && <p className="flex items-center gap-1.5 text-sm text-success"><BadgeCheck className="h-4 w-4" aria-hidden="true" />{t('Charges and payouts enabled')}</p>}
                        </div>
                    )}
                    <div className="mt-5 border-t border-line pt-4">
                        <h3 className="font-semibold text-ink">{t('Request a payout')}</h3>
                        <Hint>{t('Money from sales that Stripe did not pay you directly waits here until you ask for it.')}</Hint>
                        {can.billing ? (
                            <Button className="mt-3" variant="cta" icon={Landmark} disabled={rules?.schedule === 'manual_only' || !balance?.requestable?.amount} onClick={() => { setAmount(null); setAsking(true); }}>{t('Request payout')}</Button>
                        ) : (
                            <p className="mt-2 text-sm text-muted">{t('Only the owner can request payouts.')}</p>
                        )}
                    </div>
                </Panel>

                <Panel title={t('Payout history')} bodyClass="py-1">
                    <Table
                        caption={t('Payout history')}
                        rows={payouts?.payouts ?? []}
                        empty={<EmptyState className="my-4" icon={Landmark} title={t('No payouts yet')} />}
                        columns={[
                            { key: 'amount', label: t('Amount'), render: (p) => <span className="font-mono font-medium tabular-nums text-ink">{p.amount.formatted}</span> },
                            { key: 'status', label: t('Status'), render: (p) => <StatusPill status={p.status} /> },
                            { key: 'arrives', label: t('Arrives'), align: 'end', render: (p) => <span className="font-mono text-sm">{new Date(p.arrives_at).toLocaleDateString()}</span> },
                        ]}
                    />
                </Panel>
            </div>

            <Panel title={t('Ledger')} className="mt-5" bodyClass="py-1">
                <Table
                    caption={t('Ledger')}
                    rows={ledger}
                    empty={<p className="py-4 text-sm text-muted">{t('Sales, refunds and payouts appear here as they happen.')}</p>}
                    columns={[
                        { key: 'when', label: t('Date'), render: (l) => <span className="font-mono text-sm">{new Date(l.created_at).toLocaleDateString()}</span> },
                        { key: 'type', label: t('Type'), render: (l) => <span className="font-semibold text-ink">{LINE[l.type]?.() ?? l.type}</span> },
                        { key: 'what', label: t('For'), render: (l) => <span className="text-sm text-body">{l.event ?? l.note ?? '—'}{l.order_number ? <span className="block font-mono text-xs text-muted">{l.order_number}</span> : null}</span> },
                        { key: 'fee', label: t('Fee'), align: 'end', render: (l) => <span className="font-mono text-sm tabular-nums text-muted">{l.fee.formatted}</span> },
                        { key: 'net', label: t('Net'), align: 'end', render: (l) => <span className="font-mono tabular-nums text-ink">{l.net.formatted}</span> },
                        { key: 'state', label: t('State'), align: 'end', render: (l) => (l.paid_out ? <StatusPill status="paid" label={t('Paid out')} /> : l.settlement === 'destination' ? <StatusPill status="paid" label={t('Paid by Stripe')} /> : null) },
                    ]}
                />
            </Panel>
            {nextCursor && <div className="mt-4 text-center"><Button variant="secondary" href={`${path('/payouts')}?cursor=${encodeURIComponent(nextCursor)}`}>{t('Older lines')}</Button></div>}

            <ConfirmDialog open={asking} onClose={() => setAsking(false)} title={t('Request a payout')} confirmLabel={t('Request')} onConfirm={request} busy={busy === 'request'} tone="primary">
                <p>{t('You can request up to :amount now.', { amount: balance?.requestable?.formatted ?? '—' })}</p>
                <Field label={t('Amount (leave empty for everything available)')} htmlFor="payout-amount">
                    <MoneyInput id="payout-amount" value={amount} onChange={setAmount} currency={currency} />
                </Field>
            </ConfirmDialog>
        </>
    );
}

Payouts.layout = dashLayout;
