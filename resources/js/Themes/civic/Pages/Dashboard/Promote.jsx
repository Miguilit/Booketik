import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { money } from '@/Core/format';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { ConfirmDialog, PageHead, Panel, StatusPill, Table } from '@/Themes/civic/components/dashboard/kit';
import PromoCodeForm from '@/Themes/civic/components/dashboard/tabs/PromoCodeForm';
import { Button, EmptyState, IconButton } from '@/Themes/civic/components/ui';

/** Promo codes across the organizer: organizer-wide ones made here, event ones made on each event. */
export default function Promote({ promo_codes: codes = [], events = [] }) {
    const { api, org, path } = useDashboard();
    const { run, busy } = useAction();
    const [editing, setEditing] = useState(null);
    const [removing, setRemoving] = useState(null);
    const currency = org?.currency ?? 'EUR';

    const remove = () => run(() => api.org.del(`/promo-codes/${removing.id}`), {
        key: 'remove', success: (d) => (d.deactivated ? t('The code was used, so it is switched off rather than deleted.') : t('Code deleted.')), reload: ['promo_codes'],
    }).then((ok) => ok && setRemoving(null));

    return (
        <>
            <Head title={t('Promote')} />
            <PageHead title={t('Promote')} subtitle={t('Codes made here work on every event. For one event’s codes, referral links and the share kit, open the event’s Promote tab.')}
                actions={<Button variant="cta" icon={Plus} onClick={() => setEditing({})}>{t('New organizer-wide code')}</Button>} />

            <Panel title={t('Promo codes')} bodyClass="py-1">
                <Table
                    caption={t('Promo codes')}
                    rows={codes}
                    empty={<EmptyState className="my-4" icon={TagIcon} title={t('No promo codes yet')} />}
                    columns={[
                        { key: 'code', label: t('Code'), render: (p) => <span className="font-mono font-medium text-ink">{p.code}</span> },
                        { key: 'discount', label: t('Discount'), render: (p) => (p.percent_off ? `${p.percent_off}%` : money(p.amount_off_cents, currency)) },
                        { key: 'event', label: t('Applies to'), render: (p) => (p.event ? <Link href={path(`/events/${p.event.id}/promote`)} className="text-link hover:underline">{p.event.title}</Link> : t('Every event')) },
                        { key: 'used', label: t('Used'), align: 'end', render: (p) => <span className="font-mono">{p.used}{p.max_uses ? ` / ${p.max_uses}` : ''}</span> },
                        { key: 'state', label: t('State'), render: (p) => <StatusPill status={p.redeemable ? 'approved' : 'declined'} label={p.redeemable ? t('Redeemable') : p.is_active ? t('Out of window') : t('Off')} /> },
                        {
                            key: 'actions', label: '', hideLabel: true, align: 'end',
                            render: (p) => (
                                <span className="inline-flex gap-1">
                                    {!p.event && <IconButton label={t('Edit :code', { code: p.code })} icon={Pencil} className="h-8 w-8" onClick={() => setEditing(p)} />}
                                    <IconButton label={t('Delete :code', { code: p.code })} icon={Trash2} className="h-8 w-8" onClick={() => setRemoving(p)} />
                                </span>
                            ),
                        },
                    ]}
                />
            </Panel>

            {events.length > 0 && (
                <Panel title={t('Per-event promotion')} className="mt-5">
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {events.map((e) => (
                            <li key={e.id}><Link href={path(`/events/${e.id}/promote`)} className="block truncate rounded-sm border border-line px-3 py-2.5 font-semibold text-ink hover:border-edge">{e.title}</Link></li>
                        ))}
                    </ul>
                </Panel>
            )}

            {editing && (
                <PromoCodeForm open promo={editing.id ? editing : null} currency={currency} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
            )}
            <ConfirmDialog open={Boolean(removing)} onClose={() => setRemoving(null)} title={t('Delete :code?', { code: removing?.code ?? '' })} confirmLabel={t('Delete')} onConfirm={remove} busy={busy === 'remove'}>
                <p>{t('A code that has been used is switched off instead, so past orders keep their discount on record.')}</p>
            </ConfirmDialog>
        </>
    );
}

Promote.layout = dashLayout;
