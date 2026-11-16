import { useState } from 'react';
import { t } from '@/Core/i18n';
import { useAction, useDashboard } from '@/Core/dashboard';
import { MoneyInput, ZonedDateTime } from '../kit';
import { Button, Checkbox, Field, Input, Modal, Select, Toggle } from '../../ui';

/**
 * Create or edit one promo code. `event` scopes it to that event (its tiers
 * become the subset checkboxes); without one it is organizer-wide.
 */
export default function PromoCodeForm({ open, onClose, promo, event, currency = 'EUR', timeZone = 'UTC', onSaved }) {
    const { api } = useDashboard();
    const { run, busy, errors } = useAction();
    const [form, setForm] = useState(() => ({
        code: promo?.code ?? '',
        kind: promo?.amount_off_cents ? 'amount' : 'percent',
        percent_off: promo?.percent_off ?? 10,
        amount_off_cents: promo?.amount_off_cents ?? null,
        max_uses: promo?.max_uses ?? '',
        starts_at: promo?.starts_at ?? null,
        ends_at: promo?.ends_at ?? null,
        ticket_type_ids: promo?.ticket_type_ids ?? [],
        is_active: promo?.is_active ?? true,
    }));
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const tiers = event?.ticket_types ?? [];

    const save = async () => {
        const body = {
            code: form.code.trim(),
            event_id: event?.id ?? promo?.event?.id ?? null,
            percent_off: form.kind === 'percent' ? Number(form.percent_off) || null : null,
            amount_off_cents: form.kind === 'amount' ? form.amount_off_cents : null,
            max_uses: form.max_uses === '' ? null : Number(form.max_uses),
            starts_at: form.starts_at,
            ends_at: form.ends_at,
            ticket_type_ids: form.ticket_type_ids.length ? form.ticket_type_ids : null,
            is_active: form.is_active,
        };
        const done = await run(
            () => (promo ? api.org.patch(`/promo-codes/${promo.id}`, body) : api.org.post('/promo-codes', body)),
            { success: promo ? t('Code saved.') : t('Code created.'), reload: ['data', 'promo_codes'] },
        );
        if (done) {
            onSaved?.(done);
            onClose();
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={promo ? t('Edit promo code') : t('New promo code')} size="lg" footer={(
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
                <Button variant="primary" loading={busy === 'default'} onClick={save}>{t('Save code')}</Button>
            </div>
        )}>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Code')} htmlFor="promo-code" error={errors.code} required className="sm:col-span-2">
                    <Input id="promo-code" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="EARLY20" className="font-mono uppercase" invalid={Boolean(errors.code)} />
                </Field>
                <Field label={t('Discount')} htmlFor="promo-kind">
                    <Select id="promo-kind" value={form.kind} onChange={(e) => set('kind', e.target.value)}>
                        <option value="percent">{t('Percent off')}</option>
                        <option value="amount">{t('Fixed amount off')}</option>
                    </Select>
                </Field>
                {form.kind === 'percent' ? (
                    <Field label={t('Percent')} htmlFor="promo-pct" error={errors.percent_off}>
                        <Input id="promo-pct" type="number" min="1" max="100" value={form.percent_off} onChange={(e) => set('percent_off', e.target.value)} />
                    </Field>
                ) : (
                    <Field label={t('Amount')} htmlFor="promo-amt" error={errors.amount_off_cents}>
                        <MoneyInput id="promo-amt" currency={currency} value={form.amount_off_cents} onChange={(v) => set('amount_off_cents', v)} />
                    </Field>
                )}
                <Field label={t('Uses allowed')} htmlFor="promo-max" hint={<span className="text-xs text-muted">{t('Empty = unlimited')}</span>}>
                    <Input id="promo-max" type="number" min="1" value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} />
                </Field>
                <div className="hidden sm:block" />
                <Field label={t('Starts')} htmlFor="promo-start" error={errors.starts_at}>
                    <ZonedDateTime id="promo-start" timeZone={timeZone} value={form.starts_at} onChange={(v) => set('starts_at', v)} />
                </Field>
                <Field label={t('Ends')} htmlFor="promo-end" error={errors.ends_at}>
                    <ZonedDateTime id="promo-end" timeZone={timeZone} value={form.ends_at} onChange={(v) => set('ends_at', v)} />
                </Field>
                {tiers.length > 0 && (
                    <fieldset className="sm:col-span-2">
                        <legend className="mb-1.5 text-sm font-semibold text-ink">{t('Tiers (none ticked = every tier)')}</legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {tiers.map((tier) => (
                                <Checkbox
                                    key={tier.id}
                                    label={tier.name}
                                    checked={form.ticket_type_ids.includes(tier.id)}
                                    onChange={(e) => set('ticket_type_ids', e.target.checked ? [...form.ticket_type_ids, tier.id] : form.ticket_type_ids.filter((x) => x !== tier.id))}
                                />
                            ))}
                        </div>
                    </fieldset>
                )}
                <div className="sm:col-span-2">
                    <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label={t('Active')} description={t('Switched off, the code is refused at checkout.')} />
                </div>
            </div>
        </Modal>
    );
}
