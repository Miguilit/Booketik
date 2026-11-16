import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { intentPanel, useCheckoutDialog, useCopyValue } from '@/Core/lib/checkout';
import Countdown from './Countdown';
import PaymentModal from '@/Themes/civic/components/payments/PaymentModal';
import { buttonClass } from '@/Themes/civic/components/ui';
import { t } from '@/Core/i18n';

/**
 * One checkout screen for every regional gateway (QR, virtual account,
 * hosted page). What it shows and why is `useCheckoutDialog` (Core/checkout).
 */
export default function CheckoutDialog({ api, intent, onClose, onDelivered }) {
    const { state, settled, dead, deadReason, handleExpire, checkNow } = useCheckoutDialog({ api, intent, onDelivered });

    return (
        <PaymentModal
            title={settled ? t('Payment received') : t('Complete your payment')}
            subtitle={t('Order :number', { number: intent.orderNumber })}
            onClose={onClose}
            labelId="checkout-title"
        >
            <div className="mb-5 flex items-baseline justify-between border-y border-line py-4">
                <span className="text-sm text-muted">{t('Amount')}</span>
                <span className="font-mono text-2xl font-medium tabular-nums text-ink">{intent.amountFormatted}</span>
            </div>

            {settled ? (
                <Settled onClose={onClose} />
            ) : dead ? (
                <Dead reason={deadReason} onClose={onClose} />
            ) : (
                <Live intent={intent} state={state} onExpire={handleExpire} onCheckNow={checkNow} />
            )}
        </PaymentModal>
    );
}

function Live({ intent, state, onExpire, onCheckNow }) {
    const panel = intentPanel(intent);

    return (
        <>
            {panel === 'qr' && <QrPanel intent={intent} />}
            {panel === 'va' && <VirtualAccountPanel intent={intent} />}
            {panel === 'redirect' && <RedirectPanel intent={intent} />}

            {intent.deeplinkUrl && (
                <a
                    href={intent.deeplinkUrl}
                    className={buttonClass({ variant: 'cta', size: 'lg', block: true, className: 'mt-4' })}
                >
                    {t('Open in your e-wallet')}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
            )}

            {intent.expiresAt && (
                <p className="mt-4 flex items-center justify-between rounded-sm bg-raised px-4 py-3 text-sm">
                    <span className="text-muted">{t('Time left to pay')}</span>
                    <Countdown expiresAt={intent.expiresAt} onExpire={onExpire} />
                </p>
            )}

            {intent.instructions?.length > 0 && (
                <ol className="mt-4 space-y-2 text-sm text-muted">
                    {intent.instructions.map((step, index) => (
                        <li key={step} className="flex gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raised font-mono text-xs font-medium text-ink">
                                {index + 1}
                            </span>
                            {step}
                        </li>
                    ))}
                </ol>
            )}

            <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />
                <span className="flex-1 text-sm text-muted">
                    {state === 'watching' ? t('Waiting for your payment…') : t('Checking…')}
                </span>
                <button
                    type="button"
                    onClick={onCheckNow}
                    className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                    {t('I have paid')}
                </button>
            </div>
        </>
    );
}

function QrPanel({ intent }) {
    return (
        <div className="flex flex-col items-center">
            <div className="rounded-card border-key border-edge bg-white p-3 shadow-key">
                <img
                    src={intent.qrImageUrl}
                    alt={t('Scan this code with any QRIS app to pay')}
                    width={220}
                    height={220}
                    className="h-[220px] w-[220px]"
                />
            </div>
            <p className="mt-3 text-center text-xs text-muted">
                {t('Works with any QRIS app — GoPay, DANA, OVO, ShopeePay, or your bank.')}
            </p>
        </div>
    );
}

function VirtualAccountPanel({ intent }) {
    const { copied, copy } = useCopyValue(intent.vaNumber);

    return (
        <div className="rounded-card border border-line bg-raised p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {intent.bank ? t(':bank virtual account', { bank: intent.bank.toUpperCase() }) : t('Virtual account')}
            </p>
            <div className="mt-2 flex items-center gap-3">
                <code className="flex-1 select-all font-mono text-lg font-medium tabular-nums tracking-wider text-ink">
                    {intent.vaNumber}
                </code>
                <button
                    type="button"
                    onClick={copy}
                    aria-label={t('Copy the account number')}
                    className="rounded-sm border-key border-line bg-surface p-2 text-muted transition-colors hover:border-edge hover:text-ink"
                >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

function RedirectPanel({ intent }) {
    return (
        <a
            href={intent.redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: 'cta', size: 'lg', block: true })}
        >
            {t('Continue to payment')}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
    );
}

function Settled({ onClose }) {
    return (
        <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <Check className="h-6 w-6 text-success" aria-hidden="true" />
            </div>
            <p className="font-semibold text-ink">{t('Everything landed in your account.')}</p>
            <button
                type="button"
                onClick={onClose}
                className={buttonClass({ variant: 'cta', block: true, className: 'mt-5' })}
            >
                {t('Done')}
            </button>
        </div>
    );
}

function Dead({ reason, onClose }) {
    return (
        <div className="py-4 text-center">
            <p className={cn('font-semibold', reason === 'failed' ? 'text-danger' : 'text-ink')}>
                {reason === 'failed'
                    ? t('That payment did not go through.')
                    : t('This payment code has expired.')}
            </p>
            <p className="mt-1.5 text-sm text-muted">
                {reason === 'failed'
                    ? t('Nothing was charged. You can try again.')
                    : t('Nothing was charged. Close this and start again to get a fresh code.')}
            </p>
            <button
                type="button"
                onClick={onClose}
                className={buttonClass({ variant: 'secondary', block: true, className: 'mt-5' })}
            >
                {t('Close')}
            </button>
        </div>
    );
}
