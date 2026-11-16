import { useState } from 'react';
import { CalendarClock, EyeOff, KeyRound, Pencil, Plus, Ticket, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAction, useDashboard } from '@/Core/dashboard';
import { money } from '@/Core/format';
import { t } from '@/Core/i18n';
import { Button, Checkbox, EmptyState, Field, Input, Modal, Notice, Select, Tag, Textarea } from '../../ui';
import { ConfirmDialog, Hint, MoneyInput, Panel, Table, ZonedDateTime } from '../kit';
import { RELOAD, zonedLabel } from './shared';

const BLANK = { name: '', description: '', kind: 'paid', price_cents: null, quantity: '', min_per_order: 1, max_per_order: 6, sales_start_at: null, sales_end_at: null, is_hidden: false, unlock_code: '', transferable: true };

function TierForm({ event, tier, currency, onClose }) {
    const { api } = useDashboard();
    const { run, busy, errors } = useAction();
    const [form, setForm] = useState(() => (tier ? { ...BLANK, ...tier, quantity: tier.quantity ?? '', unlock_code: tier.unlock_code ?? '' } : { ...BLANK, currency }));
    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
    const locked = tier && tier.sold > 0;

    const submit = async (e) => {
        e.preventDefault();
        const body = {
            name: form.name, description: form.description || null, kind: form.kind,
            quantity: form.quantity === '' ? null : Number(form.quantity),
            min_per_order: Number(form.min_per_order) || 1, max_per_order: Number(form.max_per_order) || 1,
            sales_start_at: form.sales_start_at, sales_end_at: form.sales_end_at,
            is_hidden: Boolean(form.is_hidden), unlock_code: form.unlock_code || null, transferable: Boolean(form.transferable),
        };
        if (!locked) Object.assign(body, { price_cents: form.kind === 'free' ? 0 : form.price_cents ?? 0, currency: form.currency ?? currency });
        const done = await run(() => (tier ? api.org.patch(`/events/${event.id}/ticket-types/${tier.id}`, body) : api.org.post(`/events/${event.id}/ticket-types`, body)), {
            success: tier ? t('Tier saved') : t('Tier added'), reload: RELOAD,
        });
        if (done) onClose();
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Field label={t('Name')} htmlFor="tier-name" required error={errors.name}>
                <Input id="tier-name" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder={t('General admission')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Kind')} htmlFor="tier-kind">
                    <Select id="tier-kind" value={form.kind} onChange={(e) => set('kind')(e.target.value)} disabled={locked}>
                        <option value="paid">{t('Paid')}</option>
                        <option value="free">{t('Free (RSVP)')}</option>
                        <option value="donation">{t('Pay what you want')}</option>
                    </Select>
                </Field>
                {form.kind !== 'free' && (
                    <Field label={t('Your price (before fees)')} htmlFor="tier-price" error={errors.price_cents}>
                        <MoneyInput id="tier-price" value={form.price_cents} currency={form.currency ?? currency} onChange={set('price_cents')} disabled={locked} />
                    </Field>
                )}
            </div>
            {locked && <Notice tone="info">{t('This tier has sales, so its price stays. Add a new tier for a new price.')}</Notice>}
            <Field label={t('Description')} htmlFor="tier-desc">
                <Textarea id="tier-desc" value={form.description ?? ''} onChange={(e) => set('description')(e.target.value)} className="min-h-[64px]" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t('Quantity')} htmlFor="tier-qty" error={errors.quantity}>
                    <Input id="tier-qty" type="number" min={1} value={form.quantity} onChange={(e) => set('quantity')(e.target.value)} placeholder={t('No limit')} />
                </Field>
                <Field label={t('Min per order')} htmlFor="tier-min"><Input id="tier-min" type="number" min={1} max={50} value={form.min_per_order} onChange={(e) => set('min_per_order')(e.target.value)} /></Field>
                <Field label={t('Max per order')} htmlFor="tier-max" error={errors.max_per_order}><Input id="tier-max" type="number" min={1} max={50} value={form.max_per_order} onChange={(e) => set('max_per_order')(e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Sales start')} htmlFor="tier-start"><ZonedDateTime id="tier-start" value={form.sales_start_at} timeZone={event.timezone} onChange={set('sales_start_at')} /></Field>
                <Field label={t('Sales end')} htmlFor="tier-end" error={errors.sales_end_at}><ZonedDateTime id="tier-end" value={form.sales_end_at} timeZone={event.timezone} onChange={set('sales_end_at')} /></Field>
            </div>
            <Hint>{t('An early-bird is a tier whose sales end when the next one starts. Leave both empty to sell until the event.')}</Hint>
            <Checkbox label={t('Hidden — only with an unlock code')} checked={form.is_hidden} onChange={(e) => set('is_hidden')(e.target.checked)} />
            {form.is_hidden && (
                <Field label={t('Unlock code')} htmlFor="tier-code" error={errors.unlock_code}>
                    <Input id="tier-code" value={form.unlock_code} onChange={(e) => set('unlock_code')(e.target.value.toUpperCase())} placeholder="FRIENDS" className="font-mono" />
                </Field>
            )}
            <Checkbox label={t('Guests may transfer these tickets')} checked={form.transferable} onChange={(e) => set('transferable')(e.target.checked)} />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
                <Button type="submit" variant="primary" loading={busy === 'default'}>{tier ? t('Save tier') : t('Add tier')}</Button>
            </div>
        </form>
    );
}

function EarlyBird({ event, currency, onClose }) {
    const { api } = useDashboard();
    const { run, busy } = useAction();
    const [switchAt, setSwitchAt] = useState(null);
    const [early, setEarly] = useState(null);
    const [general, setGeneral] = useState(null);
    const [qty, setQty] = useState('');

    const create = async () => {
        const ok = await run(async () => {
            await api.org.post(`/events/${event.id}/ticket-types`, { name: t('Early bird'), kind: 'paid', price_cents: early, currency, sales_end_at: switchAt, quantity: qty ? Number(qty) : null });
            return api.org.post(`/events/${event.id}/ticket-types`, { name: t('General'), kind: 'paid', price_cents: general, currency, sales_start_at: switchAt });
        }, { success: t('Early-bird schedule added'), reload: RELOAD });
        if (ok) onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-[15px]">{t('Two tiers: an early-bird price until the switch, then the general price from that moment.')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Early-bird price')} htmlFor="eb-price"><MoneyInput id="eb-price" value={early} currency={currency} onChange={setEarly} /></Field>
                <Field label={t('Early-bird quantity')} htmlFor="eb-qty"><Input id="eb-qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder={t('No limit')} /></Field>
                <Field label={t('General price')} htmlFor="gen-price"><MoneyInput id="gen-price" value={general} currency={currency} onChange={setGeneral} /></Field>
                <Field label={t('Switch to general at')} htmlFor="eb-switch"><ZonedDateTime id="eb-switch" value={switchAt} timeZone={event.timezone} onChange={setSwitchAt} /></Field>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
                <Button variant="primary" loading={!!busy} disabled={!switchAt || !early || !general} onClick={create}>{t('Add both tiers')}</Button>
            </div>
        </div>
    );
}

export default function Tickets({ event }) {
    const { api } = useDashboard();
    const { run, busy } = useAction();
    const [editing, setEditing] = useState(null);
    const [schedule, setSchedule] = useState(false);
    const [removing, setRemoving] = useState(null);
    const tiers = event.ticket_types ?? [];
    const currency = tiers.find((x) => x.price_cents > 0)?.currency ?? 'EUR';

    const remove = async () => {
        const data = await run(() => api.org.del(`/events/${event.id}/ticket-types/${removing.id}`), { reload: RELOAD });
        if (data) toast.success(data.hidden ? t('It has sales, so it was hidden and its sales closed instead.') : t('Tier deleted'));
        setRemoving(null);
    };

    return (
        <div className="space-y-6">
            {!event.modules?.tickets && <Notice tone="warn">{t('The tickets module is off for this event. Turn it on under Basics → Modules to sell.')}</Notice>}
            <Panel title={t('Ticket tiers')} action={(
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" icon={CalendarClock} onClick={() => setSchedule(true)}>{t('Early-bird schedule')}</Button>
                    <Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing('new')}>{t('Add tier')}</Button>
                </div>
            )}>
                <Table
                    caption={t('Ticket tiers')}
                    rows={tiers}
                    empty={<EmptyState icon={Ticket} title={t('No tiers yet')} body={t('Add a free RSVP tier or a paid one. Prices here are yours; buyers see them with fees included.')} />}
                    columns={[
                        { key: 'name', label: t('Tier'), hideLabel: true, render: (r) => (
                            <span className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-ink">{r.name}</span>
                                {r.is_hidden && <Tag tone="muted" icon={r.unlock_code ? KeyRound : EyeOff}>{r.unlock_code ? r.unlock_code : t('Hidden')}</Tag>}
                                {r.state && <Tag tone={r.state === 'sold_out' ? 'danger' : r.state === 'on_sale' || r.state === 'available' ? 'success' : 'neutral'}>{r.state.replace(/_/g, ' ')}</Tag>}
                            </span>
                        ) },
                        { key: 'price', label: t('Price'), render: (r) => <span className="font-mono">{r.kind === 'free' ? t('Free') : money(r.price_cents, r.currency)}</span> },
                        { key: 'sold', label: t('Sold'), render: (r) => <span className="font-mono tabular-nums">{r.sold}{r.quantity ? ` / ${r.quantity}` : ''}</span> },
                        { key: 'window', label: t('On sale'), render: (r) => <span className="text-sm text-muted">{r.sales_start_at || r.sales_end_at ? `${zonedLabel(r.sales_start_at, event.timezone)} → ${zonedLabel(r.sales_end_at, event.timezone)}` : t('Until the event')}</span> },
                        { key: 'actions', label: '', align: 'end', render: (r) => (
                            <span className="inline-flex gap-1">
                                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(r)} aria-label={t('Edit :name', { name: r.name })}>{t('Edit')}</Button>
                                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setRemoving(r)} aria-label={t('Delete :name', { name: r.name })} />
                            </span>
                        ) },
                    ]}
                />
            </Panel>

            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? t('New tier') : t('Edit tier')} size="lg">
                {editing && <TierForm event={event} tier={editing === 'new' ? null : editing} currency={currency} onClose={() => setEditing(null)} />}
            </Modal>
            <Modal open={schedule} onClose={() => setSchedule(false)} title={t('Early-bird schedule')} size="lg">
                {schedule && <EarlyBird event={event} currency={currency} onClose={() => setSchedule(false)} />}
            </Modal>
            <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} title={t('Delete this tier?')} confirmLabel={t('Delete')} busy={!!busy} onConfirm={remove}>
                <p>{t('A tier with sales or holds is hidden and closed instead, so existing tickets keep working.')}</p>
            </ConfirmDialog>
        </div>
    );
}
