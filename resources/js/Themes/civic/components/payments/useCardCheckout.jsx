import StripePayment from '@/Core/engines/StripePayment';
import { requireSignIn, requireVerifiedEmail, useCardCheckoutState } from '@/Core/lib/payments';
import PaymentModal from './PaymentModal';
import { buttonClass } from '@/Themes/civic/components/ui';
import { t } from '@/Core/i18n';

/*
 | The card checkout for plans. The behaviour is `useCardCheckoutState`
 | (Core/payments); this file only draws the card-form modal around the
 | StripePayment engine, in Civic's kit.
 */

export { requireSignIn, requireVerifiedEmail };

/** Civic's classes for the StripePayment engine's slots. */
export const STRIPE_CLASSES = {
    notConfigured: 'rounded-sm border border-line bg-tint-2 px-4 py-3 text-sm font-semibold text-on-tint-2',
    spinner: 'absolute inset-0 flex items-center justify-center text-muted',
    error: 'mt-3 rounded-sm border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger',
    buttonGold: buttonClass({ variant: 'cta', size: 'lg', block: true, className: 'mt-5' }),
    buttonBrand: buttonClass({ variant: 'cta', size: 'lg', block: true, className: 'mt-5' }),
    note: 'mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted',
};

/**
 * The card-form modal for a card checkout in progress (null when none is).
 *
 * @param {{checkout: ReturnType<typeof useCardCheckoutState>}} props
 */
export function CardCheckoutDialog({ checkout }) {
    const { paying } = checkout;

    if (!paying) return null;

    return (
        <PaymentModal
            title={paying.kind === 'plan' ? t('Subscribe to :name', { name: paying.item.name }) : t('Buy :name', { name: paying.item.name })}
            subtitle={
                paying.kind === 'plan'
                    ? paying.handoff.renews
                        ? t('Renews automatically · cancel anytime')
                        : t('One payment · no auto-renew')
                    : t('One-time purchase · credited instantly')
            }
            onClose={checkout.close}
        >
            <StripePayment
                {...checkout.stripe}
                submitLabel={paying.kind === 'plan' && paying.handoff.renews ? t('Subscribe') : t('Pay now')}
                classNames={STRIPE_CLASSES}
            />
        </PaymentModal>
    );
}

/**
 * Buying a plan by card, from any screen.
 *
 * Returns `buy(kind, item)`, the id currently starting, and the card-form
 * dialog to render (null unless a Stripe handoff is in progress). Overlay and
 * redirect providers need no markup here — their own scripts or pages take over.
 *
 * @param {{locale: string, user?: object|null, onStart?: Function, onPaid?: Function}} options
 *   `onPaid` runs once the provider reports the payment (before the webhook).
 */
export function useCardCheckout(options) {
    const checkout = useCardCheckoutState(options);

    const dialog = checkout.paying ? <CardCheckoutDialog checkout={checkout} /> : null;

    return { ...checkout, dialog };
}
