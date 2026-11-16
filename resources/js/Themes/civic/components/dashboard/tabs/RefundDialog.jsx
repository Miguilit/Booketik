import { useState } from 'react';
import { t } from '@/Core/i18n';
import { useAction, useDashboard } from '@/Core/dashboard';
import { ConfirmDialog, MoneyInput } from '../kit';
import { Field, Select, Textarea } from '../../ui';

/** Refund one order: everything, or an amount, with a note the guest sees. */
export default function RefundDialog({ orderId, guestName, currency = 'EUR', onClose }) {
    const { api } = useDashboard();
    const { run, busy } = useAction();
    const [mode, setMode] = useState('full');
    const [amount, setAmount] = useState(null);
    const [note, setNote] = useState('');

    const refund = async () => {
        const body = { note: note.trim() || null, ...(mode === 'partial' ? { amount } : {}) };
        const done = await run(() => api.org.post(`/orders/${orderId}/refund`, body), {
            success: (r) => t('Refunded :amount.', { amount: r.amount?.formatted ?? '' }),
            reload: ['data', 'event', 'frame'],
        });
        if (done) onClose();
    };

    return (
        <ConfirmDialog
            open
            onClose={onClose}
            title={t('Refund :name', { name: guestName ?? t('this guest') })}
            confirmLabel={mode === 'full' ? t('Refund the whole order') : t('Refund this amount')}
            busy={busy === 'default'}
            disabled={mode === 'partial' && !amount}
            onConfirm={refund}
        >
            <Field label={t('How much')} htmlFor="refund-mode">
                <Select id="refund-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="full">{t('Everything — every ticket on the order is cancelled')}</option>
                    <option value="partial">{t('An amount — the tickets stay valid')}</option>
                </Select>
            </Field>
            {mode === 'partial' && (
                <Field label={t('Amount')} htmlFor="refund-amount">
                    <MoneyInput id="refund-amount" currency={currency} value={amount} onChange={setAmount} />
                </Field>
            )}
            <Field label={t('Note to the guest (optional)')} htmlFor="refund-note">
                <Textarea id="refund-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </Field>
            <p className="text-sm text-muted">{t('The money goes back to the card it came from. The platform fee comes back only when the event is cancelled.')}</p>
        </ConfirmDialog>
    );
}
