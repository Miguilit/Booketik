import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { openAuthDialog, openVerifyEmailDialog } from '@/Core/lib/auth/authDialog';
import { checkoutUrl, startCheckout, takeBaseline } from '@/Core/lib/payments/checkout';
import { paymentLanded } from '@/Core/lib/payments/celebrate';
import {
    closeSuccessDialog,
    closeUpgradeDialog,
    subscribeSuccessDialog,
    subscribeUpgradeDialog,
} from '@/Core/lib/payments/dialogs';
import { HttpError, post } from '@/Core/lib/payments/http';
import { t } from '@/Core/i18n';

/*
 | The payment dialogs' behaviour, without their look. Classic's markup lives in
 | Site/payments/*.jsx; the Stripe card form is the engine in Core/engines.
 */

/** Close a payment sheet on Escape (no-op when `onClose` is not given). */
export function useEscapeKey(onClose) {
    useEffect(() => {
        if (!onClose) return undefined;

        const onKey = (event) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
}

/**
 * Send a signed-out visitor to sign in — the site's auth dialog, over the page.
 */
export function requireSignIn(locale, intent = t('Sign in to pay by card.')) {
    openAuthDialog('register', intent);
}

/**
 * Ask a signed-in visitor to confirm their email before paying — the six-box
 * code dialog. The server refuses the checkout with `email_unverified` too.
 */
export function requireVerifiedEmail() {
    openVerifyEmailDialog({ send: true });
}

/**
 * Buying a plan by card, from any screen — headless.
 *
 * Returns `buy(kind, item)`, the id currently starting, and — while a Stripe
 * handoff is in progress — `paying` plus `stripe`, the props for the
 * `StripePayment` engine. Overlay and redirect providers need no markup — their
 * own scripts or pages take over. The card-form modal around the engine is the
 * theme's (Classic: `CardCheckoutDialog` in Site/payments/useCardCheckout.jsx).
 *
 * `kind` is `plan` — Eventgoo Plus. Another kind goes beside it rather than
 * in a second copy of this state machine.
 *
 * @param {{locale: string, user?: object|null, onStart?: Function, onPaid?: Function}} options
 *   `onPaid` runs once the provider reports the payment (before the webhook).
 */
export function useCardCheckoutState({ locale, user, onStart, onPaid }) {
    const userId = user?.id ?? null;
    const mustVerify = Boolean(user?.mustVerifyEmail);

    const [busyId, setBusyId] = useState(null);
    const [paying, setPaying] = useState(null);

    const landed = useCallback(
        (kind) => {
            onPaid?.(kind);

            return paymentLanded({ locale, userId, watch: 'plus' });
        },
        [locale, onPaid, userId],
    );

    const buy = useCallback(
        async (kind, item) => {
            if (!userId) {
                requireSignIn(locale, t('Sign in to get Plus.'));
                return;
            }

            if (mustVerify) {
                requireVerifiedEmail();
                return;
            }

            if (busyId || !checkoutUrl[kind]) return;

            setBusyId(item.id);
            onStart?.();

            try {
                await startCheckout(checkoutUrl[kind](locale, item.id), {
                    locale,
                    onElement: (handoff) => setPaying({ kind, item, handoff }),
                    onPaid: () => landed(kind),
                });
            } catch (error) {
                if (error instanceof HttpError && error.status === 401) {
                    requireSignIn(locale);
                } else if (error instanceof HttpError && error.body?.code === 'email_unverified') {
                    requireVerifiedEmail();
                } else {
                    toast.error(error instanceof HttpError ? error.message : t('That could not be started.'));
                }
            } finally {
                setBusyId(null);
            }
        },
        [busyId, landed, locale, mustVerify, onStart, userId],
    );

    const close = () => setPaying(null);

    /** The Stripe form reported success: drop the form, then wait for the webhook and celebrate. */
    const paid = () => {
        const { kind } = paying;
        setPaying(null);
        landed(kind);
    };

    // A bank page (3DS, iDEAL) sends the buyer back here; the
    // `checkout=done` marker makes CheckoutReturn wait and celebrate.
    const returnUrl = paying ? `${window.location.origin}/${locale}/account/subscription?checkout=done&kind=plus` : null;

    const stripe = paying
        ? {
              clientSecret: paying.handoff.client_secret,
              publishableKey: paying.handoff.publishable_key,
              amountCents: paying.handoff.amount_cents,
              currency: paying.handoff.currency,
              tone: 'gold',
              returnUrl,
              onPaid: paid,
          }
        : null;

    return {
        buy,
        busyId,
        paying,
        kind: paying?.kind ?? null,
        item: paying?.item ?? null,
        renews: Boolean(paying?.handoff?.renews),
        stripe,
        returnUrl,
        paid,
        close,
    };
}

/** The `/ week|month|year` or `one-time` suffix under an upgrade-dialog plan price. */
export function upgradeIntervalLabel(plan) {
    if (!plan.renews) return t('one-time');

    switch ((plan.interval ?? '').toLowerCase()) {
        case 'week':
            return t('/ week');
        case 'year':
            return t('/ year');
        default:
            return t('/ month');
    }
}

/*
 | The Plus offer, over whatever page asked for it.
 |
 | Plans open over the page, the card is taken in the same dialog, and on
 | success the page reloads in place with the badge on. When cards are not
 | configured the dialog says so rather than offering a button that fails.
 */
export function useUpgradeDialog({ locale, user }) {
    const [state, setState] = useState({ open: false, reason: null });
    const [catalog, setCatalog] = useState(null);

    useEffect(() => subscribeUpgradeDialog(setState), []);

    const hasPlus = Boolean(user?.hasPlus);

    const card = useCardCheckoutState({ locale, user, onPaid: closeUpgradeDialog });
    const { buy, busyId, close } = card;

    // Loaded when first needed rather than with every page.
    useEffect(() => {
        if (!state.open || catalog || !user) return;

        post(`/${locale}/checkout/plans`, {})
            .then(setCatalog)
            .catch(() => setCatalog({ plans: [], cardsEnabled: false }));
    }, [state.open, catalog, locale, user]);

    // Every open starts at the offer, never at a half-finished card form.
    useEffect(() => {
        if (!state.open) close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.open]);

    const list = catalog?.plans;

    /** Whether a plan wears the "Popular" highlight. */
    const isFeatured = (item) => item.interval === 'year' || list.length === 1;

    /** Close the offer and open the sign-in dialog instead. */
    const signIn = () => {
        closeUpgradeDialog();
        requireSignIn(locale, t('Sign in to get Plus.'));
    };

    return {
        open: state.open,
        reason: state.reason,
        hasPlus,
        catalog,
        loading: Boolean(user) && catalog === null,
        list,
        cardsEnabled: Boolean(catalog?.cardsEnabled),
        providerLabel: catalog?.providerLabel ?? null,
        card,
        busyId,
        buyItem: (item) => buy('plan', item),
        isFeatured,
        signIn,
        close: closeUpgradeDialog,
    };
}

/*
 | What a buyer sees when a payment has actually landed.
 |
 | Mounted at the app root (PaymentsRoot), outside the page, so it survives
 | whatever the page underneath does. Nothing navigates on its own: the confetti
 | runs its length around the dialog, and closing reloads the page in place so
 | the Plus badge reflects the purchase.
 */
export function useSuccessDialog() {
    const [state, setState] = useState({ open: false, title: null, message: null, actions: [] });

    useEffect(() => subscribeSuccessDialog(setState), []);

    const dismiss = () => {
        closeSuccessDialog();
        router.reload();
    };

    // Following a link is already a visit; reloading as well would race it.
    const follow = () => closeSuccessDialog();

    return {
        open: state.open,
        title: state.title,
        message: state.message,
        actions: state.actions,
        hasPrimary: state.actions.some((action) => action.primary),
        dismiss,
        follow,
    };
}

/*
 | Coming back from a hosted checkout (Creem, Dodo, Polar — and a Stripe card
 | that needed the bank's own page).
 |
 | The provider sends the buyer to `/{locale}/account/subscription?checkout=done`.
 | CleanCheckoutReturn redirects that to the clean URL and flashes `celebrate`;
 | this reads the flash, waits for the webhook against the state parked before
 | leaving (see checkout.js), and opens the success dialog.
 |
 | Mounted once at the root (PaymentsRoot), so it works wherever a provider
 | decides to return somebody.
 */
export function useCheckoutReturn({ locale, userId, celebrate }) {
    // One celebration per flash — a re-render with the same page must not
    // start a second wait.
    const handled = useRef(null);

    useEffect(() => {
        if (!celebrate || !userId || handled.current === celebrate) return;

        handled.current = celebrate;

        paymentLanded({ locale, userId, watch: 'plus', baseline: takeBaseline() });
    }, [celebrate, locale, userId]);

    // Cleared when the flash goes, so a second purchase in the same visit
    // celebrates too.
    useEffect(() => {
        if (!celebrate) handled.current = null;
    }, [celebrate]);
}

/*
 | The payment dialogs, mounted once beside the Inertia app (resources/js/app.jsx).
 |
 | Siblings of the page rather than children of `Site/Layout`, so the success
 | dialog survives the page reloading underneath it. Being outside Inertia's
 | page context, it follows the current page through the router's `navigate`
 | event instead of `usePage()`.
 |
 | Only on the public site: admin pages never render these.
 |
 | Returns `active: false` when nothing should be mounted.
 */
export function usePaymentsRoot(initialPage) {
    const [page, setPage] = useState(initialPage ?? null);

    useEffect(
        () =>
            router.on('navigate', (event) => {
                setPage(event.detail.page);
            }),
        [],
    );

    if (!page || !String(page.component ?? '').startsWith('Site/')) {
        return { active: false, page, locale: null, user: null, userId: null, celebrate: null };
    }

    const props = page.props ?? {};
    const locale = props.locale ?? 'en';
    const user = props.auth?.user ?? null;

    return {
        active: true,
        page,
        locale,
        user,
        userId: user?.id ?? null,
        celebrate: props.flash?.celebrate ?? null,
    };
}
