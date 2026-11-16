import { useState } from 'react';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { t } from '@/Core/i18n';
import { copyText, pct, useAction, useDashboard } from '@/Core/dashboard';
import { ConfirmDialog, Panel, Table } from '../kit';
import { Button, EmptyState, Field, IconButton, Input, Modal, Select } from '../../ui';

/** An event's referral links: who brings guests, and what they earn for it. */
export default function ReferralLinks({ event, links = [] }) {
    const { api, can } = useDashboard();
    const { run, busy } = useAction();
    const [editing, setEditing] = useState(null);
    const [removing, setRemoving] = useState(null);

    const remove = async () => {
        const ok = await run(() => api.org.del(`/events/${event.id}/referral-links/${removing.id}`), { success: t('Link deleted.'), reload: ['data'] });
        if (ok) setRemoving(null);
    };

    return (
        <Panel
            title={t('Referral links')}
            action={can.sales && <Button size="sm" variant="secondary" icon={Plus} onClick={() => setEditing({})}>{t('New link')}</Button>}
        >
            <Table
                caption={t('Referral links')}
                rows={links}
                empty={<EmptyState title={t('No referral links yet')} body={t('Give partners and ambassadors their own link, with a reward per guest they bring.')} />}
                columns={[
                    { key: 'code', label: t('Code'), render: (l) => (
                        <span className="flex items-center gap-1.5">
                            <span className="font-mono text-sm text-ink">{l.code}</span>
                            <IconButton label={t('Copy link')} icon={Copy} className="h-8 w-8" onClick={() => copyText(l.url, t('Link copied'))} />
                        </span>
                    ) },
                    { key: 'owner', label: t('Owner'), render: (l) => l.owner ?? '—' },
                    { key: 'reward', label: t('Reward'), render: (l) => (l.reward_type === 'percent' ? `${l.reward_value}%` : l.reward_value) },
                    { key: 'clicks', label: t('Clicks'), align: 'end', render: (l) => <span className="font-mono">{l.clicks}</span> },
                    { key: 'conversions', label: t('Sales'), align: 'end', render: (l) => <span className="font-mono">{l.conversions} <span className="text-muted">{pct(l.conversion_rate)}</span></span> },
                    { key: 'guests', label: t('Guests'), align: 'end', render: (l) => <span className="font-mono">{l.guests}</span> },
                    { key: 'revenue', label: t('Revenue'), align: 'end', render: (l) => <span className="font-mono">{l.revenue?.formatted}</span> },
                    { key: 'actions', label: '', hideLabel: true, align: 'end', render: (l) => can.sales && (
                        <span className="inline-flex gap-1">
                            <IconButton label={t('Edit :code', { code: l.code })} icon={Pencil} className="h-8 w-8" onClick={() => setEditing(l)} />
                            <IconButton label={t('Delete :code', { code: l.code })} icon={Trash2} className="h-8 w-8" onClick={() => setRemoving(l)} />
                        </span>
                    ) },
                ]}
            />
            {editing && <LinkForm event={event} link={editing.id ? editing : null} onClose={() => setEditing(null)} />}
            <ConfirmDialog open={Boolean(removing)} onClose={() => setRemoving(null)} title={t('Delete this link?')} confirmLabel={t('Delete link')} busy={busy === 'default'} onConfirm={remove}>
                <p>{t('The link stops working. Guests it already brought stay counted on their orders.')}</p>
            </ConfirmDialog>
        </Panel>
    );
}

function LinkForm({ event, link, onClose }) {
    const { api } = useDashboard();
    const { run, busy, errors } = useAction();
    const [form, setForm] = useState({ code: link?.code ?? '', reward_type: link?.reward_type ?? 'percent', reward_value: link?.reward_value ?? 10 });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = async () => {
        const body = { ...form, code: form.code.trim() || null, reward_value: Number(form.reward_value) || 0 };
        const ok = await run(
            () => (link ? api.org.patch(`/events/${event.id}/referral-links/${link.id}`, body) : api.org.post(`/events/${event.id}/referral-links`, body)),
            { success: t('Link saved.'), reload: ['data'] },
        );
        if (ok) onClose();
    };

    return (
        <Modal open onClose={onClose} title={link ? t('Edit referral link') : t('New referral link')} footer={(
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
                <Button variant="primary" loading={busy === 'default'} onClick={save}>{t('Save link')}</Button>
            </div>
        )}>
            <div className="space-y-4">
                <Field label={t('Code')} htmlFor="ref-code" error={errors.code} hint={<span className="text-xs text-muted">{t('Empty = generated')}</span>}>
                    <Input id="ref-code" value={form.code} onChange={(e) => set('code', e.target.value.toLowerCase())} className="font-mono" placeholder="lena-friends" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label={t('Reward')} htmlFor="ref-type">
                        <Select id="ref-type" value={form.reward_type} onChange={(e) => set('reward_type', e.target.value)}>
                            <option value="percent">{t('Percent of the sale')}</option>
                            <option value="fixed">{t('Fixed per sale (minor units)')}</option>
                        </Select>
                    </Field>
                    <Field label={t('Value')} htmlFor="ref-value" error={errors.reward_value}>
                        <Input id="ref-value" type="number" min="0" value={form.reward_value} onChange={(e) => set('reward_value', e.target.value)} />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}
