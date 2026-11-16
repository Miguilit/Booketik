import { useEffect, useRef, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { money } from '@/Core/lib/format';
import { resolvedColor, resolvedValue } from '@/Core/lib/bridge';
import { isDark } from '@/Core/lib/mode';
import { t } from '@/Core/i18n';

/*
 | Card payment with Stripe's Payment Element, on this page.
 |
 | The server creates a PaymentIntent (or a subscription's first invoice intent)
 | and hands back its client secret — not a URL — so the payment is confirmed
 | here rather than on a hosted page. The card itself is collected inside
 | Stripe's iframe; no card number reaches this origin.
 |
 | `redirect: "if_required"`: cards settle in place, while a method that needs
 | the bank's own page (a 3DS challenge, iDEAL) goes there and comes back to
 | `returnUrl`. Either way the purchase is granted by the webhook, never by
 | this component.
 |
 | An engine (theme-neutral): colours come from the bridge tokens by default,
 | and every visible part takes its class from `classNames` so a theme can style
 | it — `notConfigured`, `spinner`, `error`, `button` (or `buttonGold` /
 | `buttonBrand` per `tone`), `note`. A slot given replaces the default whole.
 | The modal around it belongs to the theme.
 */

const DEFAULT_CLASSES = {
    notConfigured:
        'rounded-xl border border-[rgb(var(--t-gold)/0.4)] bg-[rgb(var(--t-gold)/0.1)] px-4 py-3 text-sm font-semibold text-[rgb(var(--t-gold))]',
    spinner: 'absolute inset-0 flex items-center justify-center text-[rgb(var(--t-muted))]',
    error: 'mt-3 rounded-xl border border-[rgb(var(--t-danger)/0.3)] bg-[rgb(var(--t-danger)/0.05)] px-3 py-2 text-sm font-semibold text-[rgb(var(--t-danger))]',
    buttonGold:
        'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--t-gold))] py-3 text-sm font-bold text-[rgb(var(--t-on-accent))] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60',
    buttonBrand:
        'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--t-accent))] py-3 text-sm font-bold text-[rgb(var(--t-on-accent))] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60',
    note: 'mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-[rgb(var(--t-muted))]',
};

let stripeJs = null;

/*
 | Stripe renders inside its own iframe and cannot see our CSS variables, so
 | the appearance is built from the bridge tokens as resolved *now*, and
 | rebuilt whenever the visitor flips light/dark (see the effect below).
 */
function stripeAppearance(tone) {
    return {
        theme: isDark() ? 'night' : 'stripe',
        variables: {
            colorPrimary: resolvedColor(tone === 'gold' ? 'gold' : 'accent', tone === 'gold' ? '#E0912B' : '#3D5AFE'),
            colorBackground: resolvedColor('card', '#FFFFFF'),
            colorText: resolvedColor('ink', '#15161C'),
            colorDanger: resolvedColor('danger', '#E4392E'),
            borderRadius: resolvedValue('radius', '12px'),
            fontFamily: resolvedValue('font-body', 'Inter, system-ui, sans-serif'),
        },
    };
}

/*
 | Stripe.js, fetched once — but a failure is never cached. Inertia keeps the
 | document alive across visits, so a rejected promise kept here would make
 | paying impossible until a hard reload.
 */
function loadStripeJs() {
    if (stripeJs) return stripeJs;

    stripeJs = new Promise((resolve, reject) => {
        if (window.Stripe) return resolve(window.Stripe);

        const existing = document.querySelector('script[src^="https://js.stripe.com/v3"]');

        if (existing) {
            existing.addEventListener('load', () => resolve(window.Stripe));
            existing.addEventListener('error', () => reject(new Error(t('Stripe could not be loaded.'))));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = () => resolve(window.Stripe);
        script.onerror = () => {
            script.remove();
            reject(new Error(t('Stripe could not be loaded.')));
        };
        document.head.appendChild(script);
    });

    stripeJs.catch(() => {
        stripeJs = null;
    });

    return stripeJs;
}

export default function StripePayment({
    clientSecret,
    publishableKey,
    amountCents,
    currency,
    returnUrl,
    onPaid,
    submitLabel = t('Pay now'),
    tone = 'brand',
    className = undefined,
    classNames = {},
    processingLabel = t('Processing…'),
    note: noteProp,
}) {
    // Read from <html data-site-name> rather than usePage(): this form also
    // renders under PaymentsRoot, which sits outside the Inertia page context.
    const siteName = (typeof document !== 'undefined' && document.documentElement.dataset.siteName) || t('us');
    // `undefined` → the default line; an explicit null/'' hides it, as before.
    const note = noteProp === undefined ? t('Card details are handled by Stripe and never reach :site.', { site: siteName }) : noteProp;
    const classes = { ...DEFAULT_CLASSES, ...classNames };
    const buttonClass =
        tone === 'gold'
            ? classNames.buttonGold ?? classNames.button ?? DEFAULT_CLASSES.buttonGold
            : classNames.buttonBrand ?? classNames.button ?? DEFAULT_CLASSES.buttonBrand;

    const mount = useRef(null);
    const [stripe, setStripe] = useState(null);
    const [elements, setElements] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!clientSecret || !publishableKey) return undefined;

        let dead = false;
        let element = null;

        loadStripeJs()
            .then((Stripe) => {
                if (dead || !mount.current) return;

                const instance = Stripe(publishableKey);

                const group = instance.elements({
                    clientSecret,
                    appearance: stripeAppearance(tone),
                });

                element = group.create('payment', { layout: 'tabs' });
                element.mount(mount.current);

                setStripe(instance);
                setElements(group);
            })
            .catch((e) => !dead && setError(e.message));

        return () => {
            dead = true;
            try {
                element?.destroy();
            } catch {
                /* already unmounted */
            }
        };
    }, [clientSecret, publishableKey, tone]);

    // Follow a light/dark flip while the form is open.
    useEffect(() => {
        if (!elements) return undefined;
        const onMode = () => elements.update({ appearance: stripeAppearance(tone) });
        window.addEventListener('site-mode-change', onMode);
        return () => window.removeEventListener('site-mode-change', onMode);
    }, [elements, tone]);

    const pay = async () => {
        if (!stripe || !elements || busy) return;

        setBusy(true);
        setError(null);

        const { error: failure, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: returnUrl },
            redirect: 'if_required',
        });

        if (failure) {
            setError(failure.message ?? t('That payment did not go through.'));
            setBusy(false);
            return;
        }

        // `succeeded` or `processing` are both fine to leave on: the webhook is
        // what grants, and it will arrive either way.
        setBusy(false);
        onPaid?.(paymentIntent);
    };

    if (!clientSecret || !publishableKey) {
        return (
            <p className={classes.notConfigured}>
                {t('Card payments are not fully configured yet. Please choose another way to pay.')}
            </p>
        );
    }

    return (
        <div className={className}>
            {/* Stripe owns the mount node's children; the spinner is a sibling
                so React and Stripe never edit the same DOM. */}
            <div className="relative min-h-[220px]">
                <div ref={mount} />
                {!stripe && !error && (
                    <div className={classes.spinner}>
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
            </div>

            {error && (
                <p className={classes.error}>
                    {error}
                </p>
            )}

            <button
                type="button"
                onClick={pay}
                disabled={!stripe || busy}
                className={buttonClass}
            >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? processingLabel : submitLabel}
                {!busy && amountCents != null && ` · ${money(amountCents, currency)}`}
            </button>

            {note && (
                <p className={classes.note}>
                    <Lock className="h-3 w-3" />
                    {note}
                </p>
            )}
        </div>
    );
}
