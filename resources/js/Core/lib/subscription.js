import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRoute } from '@/Core/lib/useSite';
import { openUpgradeDialog } from '@/Core/lib/payments/dialogs';
import { HttpError, post } from '@/Core/lib/payments/http';
import { t } from '@/Core/i18n';

/*
 | Subscription & billing.
 |
 | A subscriber comes here with one of three questions — when am I charged
 | again, how do I cancel, what have I paid for — and each gets its own answer:
 | the plan card (renew/end date and who bills it), the billing portal button,
 | and the purchase list with a receipt per row where one can be reached.
 |
 | Portal and receipt links are minted per click (they expire) and opened in a
 | new tab, so the member comes back to this page rather than losing it.
 */

/** A billing date as `Mar 4, 2026`, or an em dash when there is none. */
export function formatDate(value) {
    if (!value) return '—';

    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Open a freshly minted URL in a new tab; fall back to this tab if blocked. */
export function openExternal(url) {
    // Not the `noopener` feature: with it, window.open returns null by spec and
    // a blocked popup could not be told from an opened one.
    const opened = window.open(url, '_blank');

    if (opened) {
        opened.opener = null;
    } else {
        window.location.href = url;
    }
}

/**
 * The Subscription page's actions.
 *
 * @param {{subscription?: object|null}} props  the page's Inertia props
 */
export function useSubscription({ subscription } = {}) {
    const url = useRoute();
    const [busy, setBusy] = useState(null);

    const openLink = async (key, endpoint) => {
        if (busy) return;

        setBusy(key);

        try {
            const response = await post(endpoint);
            openExternal(response.url);
        } catch (error) {
            toast.error(error instanceof HttpError ? error.message : t('That could not be opened.'));
        } finally {
            setBusy(null);
        }
    };

    return {
        url,
        /** The key of the link being minted (`portal`, `current-invoice`, `order-{id}`), or null. */
        busy,
        openLink,
        openPortal: () => openLink('portal', url('/account/subscription/portal')),
        openCurrentInvoice: () =>
            openLink('current-invoice', url(`/account/purchases/subscription/${subscription?.id}/invoice`)),
        openOrderReceipt: (id) => openLink(`order-${id}`, url(`/account/purchases/order/${id}/invoice`)),
        // The same date means opposite things: a cancelled subscription still
        // runs to the end of what was paid for, and "renews" would tell
        // somebody who cancelled that they had failed to.
        ends: Boolean(subscription && (subscription.cancelsAtPeriodEnd || !subscription.recurring)),
        goPlus: () => openUpgradeDialog(),
    };
}
