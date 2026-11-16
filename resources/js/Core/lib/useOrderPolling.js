import { useEffect, useRef, useState } from 'react';

/**
 * Watches our own order until the server says it was delivered.
 *
 * This is a **read, not an assertion**: the browser is asking what happened, not
 * telling the server what to believe. Nothing here can grant anything — a purchase
 * arrive only from a signature-verified webhook — so a hostile client polling
 * this endpoint learns nothing it did not already know.
 *
 * The cadence is shaped by how QRIS actually behaves. A card sheet resolves in
 * seconds; a QR is scanned in a different app, and settlement is routinely
 * thirty seconds to a couple of minutes away. So: every 3s for the first
 * minute, when most payments land, then every 10s, which is often enough to
 * feel live and rare enough not to hammer the API for the twenty minutes a
 * distracted buyer might leave the tab open.
 *
 * `pending` is a **success**, not a failure. The money has been taken; only the
 * confirmation is late, and telling the member otherwise would be a lie.
 */
const FAST_INTERVAL_MS = 3000;
const SLOW_INTERVAL_MS = 10000;
const FAST_PHASE_MS = 60000;

export function useOrderPolling(api, orderId, { enabled = true, expiresAt = null } = {}) {
    const [state, setState] = useState('watching');
    const [order, setOrder] = useState(null);
    const startedAt = useRef(Date.now());

    useEffect(() => {
        if (!enabled || !orderId) {
            return undefined;
        }

        let cancelled = false;
        let timer = null;
        startedAt.current = Date.now();

        const stop = (next) => {
            if (!cancelled) {
                setState(next);
            }
        };

        const tick = async () => {
            if (cancelled) {
                return;
            }

            try {
                const data = await api.get(`/user/orders/${orderId}`);
                const fetched = data?.order;

                if (fetched && !cancelled) {
                    setOrder(fetched);

                    if (fetched.isDelivered) {
                        stop('delivered');
                        return;
                    }

                    const status = String(fetched.paymentStatus ?? '').toLowerCase();

                    if (status === 'failed' || status === 'refunded') {
                        stop('failed');
                        return;
                    }
                }
            } catch {
                // A failed poll says nothing about the payment — the network
                // dropped, not the money. Keep asking.
            }

            if (cancelled) {
                return;
            }

            // Past the code's expiry there is nothing left to wait for, and a
            // tab left open overnight should not keep asking.
            if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
                stop('expired');
                return;
            }

            const elapsed = Date.now() - startedAt.current;
            timer = setTimeout(tick, elapsed < FAST_PHASE_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS);
        };

        timer = setTimeout(tick, FAST_INTERVAL_MS);

        return () => {
            cancelled = true;

            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [api, orderId, enabled, expiresAt]);

    /** An explicit "I have paid — check again", for an impatient buyer. */
    const checkNow = async () => {
        try {
            const data = await api.get(`/user/orders/${orderId}`);
            const fetched = data?.order;

            if (fetched) {
                setOrder(fetched);

                if (fetched.isDelivered) {
                    setState('delivered');
                }
            }
        } catch {
            // Same as above: a failed request is not an answer about the money.
        }
    };

    return { state, order, checkNow };
}
