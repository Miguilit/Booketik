import { useCallback, useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useOrderPolling } from '@/Core/lib/useOrderPolling';
import { t } from '@/Core/i18n';

/*
 | The local-channel checkout's behaviour, without its look (Classic's markup:
 | Site/checkout/*.jsx).
 */

export { useOrderPolling };

/**
 * One checkout screen for every gateway — its state.
 *
 * It renders a `ChargeIntent` — the shape `App\Services\Payments\ChargeIntent`
 * serialises — and nothing else. That is the whole point of having built the
 * DTO before either gateway: Midtrans answers a QRIS charge with an image URL
 * and Duitku with a QR payload, Duitku POP answers with a hosted page, and a
 * bank transfer answers with a virtual account number. Without a common shape
 * each of those grows its own screen, and the third gateway needs a third pair
 * of them.
 *
 * So the branch here is on **what the buyer has to do**, not on who is
 * processing it (see `intentPanel`):
 *
 *   - a QR to scan
 *   - a number to copy into a banking app
 *   - a page to be sent to
 *
 * Nothing here can grant anything. It shows what to pay and then *asks* the
 * server what happened; what was bought arrives only from a signed webhook.
 */
export function useCheckoutDialog({ api, intent, onDelivered }) {
    const [expired, setExpired] = useState(false);

    const handleExpire = useCallback(() => setExpired(true), []);

    const { state, order, checkNow } = useOrderPolling(api, intent.orderId, {
        enabled: !expired,
        expiresAt: intent.expiresAt,
    });

    const settled = state === 'delivered';
    const dead = expired || state === 'expired' || state === 'failed';

    if (settled) {
        onDelivered?.();
    }

    return {
        state,
        order,
        expired,
        settled,
        dead,
        deadReason: state === 'failed' ? 'failed' : 'expired',
        handleExpire,
        checkNow,
    };
}

/** Which collection panel a live intent shows: `qr`, `va` (virtual account), `redirect`, or null. */
export function intentPanel(intent) {
    if (intent.qrImageUrl) return 'qr';
    if (intent.vaNumber) return 'va';
    if (intent.redirectUrl) return 'redirect';

    return null;
}

/** Copy a value to the clipboard; `copied` is true for two seconds after. */
export function useCopyValue(value) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard access is denied in some browsers and over plain HTTP.
            // The number is on screen and selectable either way, so this is a
            // convenience that failed, not a broken checkout.
        }
    };

    return { copied, copy };
}

/** Milliseconds until `expiresAt` (0 when there is none). */
export function msLeft(expiresAt) {
    return expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0;
}

/**
 * Time left on a payment code.
 *
 * A QR is only good for a fixed window — fifteen minutes on Midtrans — and a
 * buyer who wanders off needs to know the code went stale rather than that the
 * payment failed. Those are different messages and lead to different actions:
 * one means "generate a new code", the other means "check your bank".
 *
 * Ticks once a second because it is showing seconds; stops at zero rather than
 * counting into negative time.
 *
 * Returns `active` (an expiry is set), `expired`, `remaining` (ms), `minutes`,
 * `seconds` and `label` (`m:ss`).
 */
export function useCountdown(expiresAt, onExpire) {
    const [remaining, setRemaining] = useState(() => msLeft(expiresAt));

    useEffect(() => {
        if (!expiresAt) {
            return undefined;
        }

        const timer = setInterval(() => {
            const left = msLeft(expiresAt);
            setRemaining(left);

            if (left <= 0) {
                clearInterval(timer);
                onExpire?.();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt, onExpire]);

    const totalSeconds = Math.max(0, Math.floor(remaining / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return {
        active: Boolean(expiresAt),
        expired: remaining <= 0,
        remaining,
        minutes,
        seconds,
        label: `${minutes}:${String(seconds).padStart(2, '0')}`,
    };
}

/*
 | How the buyer wants to pay.
 |
 | Tiles are **channels, not gateways**. A buyer picks "QRIS" — they do not know
 | or care whether Midtrans or Duitku processes it, and showing two QRIS tiles
 | because two providers are switched on would be a worse checkout than one. The
 | server decides which gateway serves each channel; see
 | `PaymentGatewayRegistry::channelsFor()`.
 |
 | `kind` says which icon a theme draws: qr, wallet, bank, phone, card.
 */
// Hints (and the non-brand labels) are getters, so they are translated when read, not at import.
export const CHANNEL_LABELS = {
    qris: { label: 'QRIS', get hint() { return t('Scan with any wallet or bank app'); }, kind: 'qr' },
    gopay: { label: 'GoPay', get hint() { return t('Pay in the Gojek app'); }, kind: 'wallet' },
    shopeepay: { label: 'ShopeePay', get hint() { return t('Pay in Shopee'); }, kind: 'wallet' },
    ovo: { label: 'OVO', get hint() { return t('Pay in the OVO app'); }, kind: 'wallet' },
    indodana: { label: 'Indodana', get hint() { return t('Pay later'); }, kind: 'wallet' },
    atm_bersama: { label: 'ATM Bersama', get hint() { return t('Transfer from any ATM'); }, kind: 'bank' },
    checkout: { get label() { return t('Card'); }, get hint() { return t('Debit or credit card'); }, kind: 'phone' },
    // The web card checkout (Stripe / Paddle / Lemon Squeezy / Creem / Dodo /
    // Polar), added by the shop itself rather than the regional registry.
    card: { get label() { return t('Pay by card'); }, get hint() { return t('Debit or credit card'); }, kind: 'card' },
};

/** `{label, hint, kind}` for a channel key. */
export function describeChannel(channel) {
    if (CHANNEL_LABELS[channel]) {
        return CHANNEL_LABELS[channel];
    }

    if (channel.startsWith('va_')) {
        return {
            label: t(':bank transfer', { bank: channel.slice(3).toUpperCase() }),
            hint: t('Bank transfer to a virtual account'),
            kind: 'bank',
        };
    }

    // A channel the server offers that this table has never heard of. Drawn
    // plainly rather than hidden: the operator switched it on deliberately, and
    // silently dropping it would look like the setting did nothing.
    return { label: channel.replace(/_/g, ' '), hint: null, kind: 'wallet' };
}

/** The server's channel entries as picker options: `{label, hint, kind, value}`. */
export function channelOptions(channels) {
    // An entry may carry its own label or hint — the card option names the
    // provider securing it, which only the server knows.
    return channels.map((entry) => ({
        ...describeChannel(entry.channel),
        ...(entry.label ? { label: entry.label } : {}),
        ...(entry.hint ? { hint: entry.hint } : {}),
        value: entry.channel,
    }));
}

/*
 | Which currency to price this page in.
 |
 | A query parameter rather than a stored preference, deliberately: the shop
 | resolves currency server-side from `?currency=` first, so reloading with it
 | set is the whole mechanism. Persisting a choice belongs on the account, and
 | an anonymous visitor has no account to persist it to.
 |
 | Hidden entirely when there is only one currency — a picker with one option is
 | furniture (`visible`).
 */

/** Reload the current page priced in `code` (via `?currency=`). */
export function switchCurrency(code) {
    const url = new URL(window.location.href);
    url.searchParams.set('currency', code);
    router.visit(url.pathname + url.search, { preserveScroll: true });
}

/** The site's currencies, whether a picker is worth showing, and `change(code)`. */
export function useCurrencyPicker() {
    const currencies = usePage().props.currencies ?? [];

    return { currencies, visible: currencies.length >= 2, change: switchCurrency };
}
