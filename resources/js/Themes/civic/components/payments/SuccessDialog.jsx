import { PartyPopper } from 'lucide-react';
import { useSuccessDialog } from '@/Core/lib/payments';
import { buttonClass } from '@/Themes/civic/components/ui';
import PaymentModal from './PaymentModal';
import { t } from '@/Core/i18n';

/*
 | What a buyer sees when a payment has actually landed.
 | Behaviour: `useSuccessDialog` (Core/payments).
 */
export default function SuccessDialog() {
    const state = useSuccessDialog();
    const { dismiss, follow } = state;

    if (!state.open) return null;

    return (
        <PaymentModal title={state.title ?? t('All done')} onClose={dismiss} size="sm" labelId="payment-success-title">
            <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-key border-edge bg-tint-2 text-on-tint-2 shadow-key">
                    <PartyPopper className="h-8 w-8" aria-hidden="true" />
                </span>
                {state.message && <p className="mt-4 text-[15px] text-body">{state.message}</p>}
            </div>

            <div className="mt-6 space-y-2">
                {state.actions.map((action) =>
                    action.href ? (
                        <a
                            key={action.label}
                            href={action.href}
                            onClick={follow}
                            className={buttonClass({ variant: action.primary ? 'cta' : 'secondary', block: true })}
                        >
                            {action.label}
                        </a>
                    ) : null,
                )}

                <button
                    type="button"
                    onClick={dismiss}
                    className={buttonClass({ variant: state.hasPrimary ? 'ghost' : 'cta', block: true })}
                >
                    {state.hasPrimary ? t('Close') : t('Continue')}
                </button>
            </div>
        </PaymentModal>
    );
}
