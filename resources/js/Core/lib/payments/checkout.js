import { get, post } from './http';
import { openPaddle } from './paddle';
import { openLemonSqueezy } from './lemonsqueezy';

/*
 | Starting a card payment, whoever is taking it.
 |
 | The server answers with a `mode` saying how the browser should finish:
 |
 |   element  — Stripe: a client secret; mount the card form on this page.
 |   overlay  — Paddle, Lemon Squeezy: their script draws a window over this
 |              page. Paddle opens from a transaction id, Lemon Squeezy from a
 |              checkout URL, so the provider is checked once the mode is known.
 |   redirect — Creem, Dodo, Polar: they host the page; send the buyer there.
 |              They come back to `/{locale}/account/subscription?checkout=done`
 |              (or the old `/shop`, which redirects there), which
 |              CleanCheckoutReturn tidies and CheckoutReturn celebrates.
 |
 | One place, so the upgrade dialog and anything added later cannot
 | disagree about what a provider needs.
 */

/** The checkout endpoints, by what is being bought. */
export const checkoutUrl = {
    plan: (locale, id) => `/${locale}/checkout/plan/${id}`,
};

const BASELINE_KEY = 'eventgoo.checkout.baseline';

/*
 | The account as it was before a hosted checkout.
 |
 | A redirect provider's webhook often beats the buyer back to the site, so on
 | return the entitlement may *already* show the purchase — and a baseline read
 | at that point would compare the new state with itself and wait for a change
 | that has already happened. So the state is read and parked in the tab's
 | session storage just before leaving, and CheckoutReturn compares against it.
 */
async function rememberBaseline(locale) {
    if (!locale) return;

    try {
        const state = await get(`/${locale}/me/entitlement`);
        window.sessionStorage.setItem(BASELINE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
    } catch {
        /* no baseline — CheckoutReturn falls back to reading one on return */
    }
}

/** Read and forget the parked baseline; null when absent or over an hour old. */
export function takeBaseline() {
    try {
        const raw = window.sessionStorage.getItem(BASELINE_KEY);
        window.sessionStorage.removeItem(BASELINE_KEY);

        if (!raw) return null;

        const parsed = JSON.parse(raw);

        return Date.now() - (parsed.savedAt ?? 0) < 60 * 60 * 1000 ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * @param {string} url            checkout endpoint to POST to
 * @param {object} options
 * @param {Function} options.onElement  called with the handoff when a card form is needed here
 * @param {Function} [options.onPaid]   called when an overlay reports success
 * @param {Function} [options.onClose]  called when an overlay is closed
 * @param {string} [options.locale]     lets a redirect park the pre-purchase state
 * @returns {Promise<object>} the handoff
 */
export async function startCheckout(url, { onElement, onPaid, onClose, locale } = {}) {
    return finishHandoff(await post(url, {}), { onElement, onPaid, onClose, locale });
}

/**
 * Act on a handoff that has already been fetched.
 *
 * @param {object} handoff
 * @param {object} options
 */
export async function finishHandoff(handoff, { onElement, onPaid, onClose, locale } = {}) {
    if (handoff.mode === 'redirect' && handoff.redirect_url) {
        await rememberBaseline(locale);
        window.location.href = handoff.redirect_url;
        return handoff;
    }

    if (handoff.mode === 'overlay') {
        if (handoff.provider === 'lemonsqueezy' && handoff.redirect_url) {
            await openLemonSqueezy({ url: handoff.redirect_url, onPaid, onClose });
            return handoff;
        }

        if (handoff.transaction_id) {
            await openPaddle({
                transactionId: handoff.transaction_id,
                token: handoff.publishable_key,
                sandbox: handoff.sandbox,
                onPaid,
                onClose,
            });
            return handoff;
        }
    }

    // `element`, or a provider that answered with nothing usable — the card
    // form reports that better than a silent no-op would.
    onElement?.(handoff);

    return handoff;
}
