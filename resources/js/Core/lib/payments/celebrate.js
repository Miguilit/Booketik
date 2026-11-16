import toast from 'react-hot-toast';
import { get } from './http';
import { awaitSettlement } from './echo';
import { openSuccessDialog } from './dialogs';
import { t } from '@/Core/i18n';

/*
 | What happens in the seconds after somebody pays.
 |
 | A card is confirmed in the browser, but Plus is granted by the provider's
 | webhook — a separate request that arrives whenever it arrives.
 | Reloading the instant the card cleared therefore showed the account from
 | *before* the purchase. So the page waits for the grant, two ways at once:
 |
 |   - **pushed** — the webhook broadcasts `purchase.settled` on the buyer's
 |     private `user.{id}` channel (App\Events\PurchaseSettled);
 |   - **polled** — `/{locale}/me/entitlement` once a second, as the floor for
 |     when there is no socket (no Pusher key, a proxy that eats websockets).
 |
 | Whichever answers first wins. Then a dialog, and a little confetti around
 | it. Nothing navigates — the dialog's Close reloads the page in place.
 */

const GIVE_UP_MS = 30000;
const POLL_MS = 1000;

/*
 | Plus, as the entitlement endpoint reports it.
 */
const plusOf = (state) => state.has_plus === true;

/** What counts as "it landed", given the state before and now. */
const LANDED = {
    // A plan. Also covers renewing or switching, where Plus was already on.
    plus: (now, before) =>
        plusOf(now) && (!plusOf(before) || now.expires_at !== before.expires_at || now.plan !== before.plan),
};

/** The broadcast kinds that mean "Plus was granted" (`pro` is the old name). */
const PUSHED_KINDS = { plus: ['plus', 'pro'] };

/**
 * The copy per kind, shared with CheckoutReturn.
 *
 * Getters, so the text is translated when read rather than frozen at import.
 */
export const LANDED_COPY = {
    plus: {
        get title() { return t('Welcome to Eventgoo Plus'); },
        get message() { return t('No service fee on most tickets, early access to presales and priority on waitlists.'); },
    },
};

/**
 * Wait for the webhook, then celebrate.
 *
 * @param {object} options
 * @param {string} options.locale
 * @param {number|string} [options.userId]  whose private channel to listen on
 * @param {'plus'} [options.watch]          what this purchase should change
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {Array} [options.actions]         extra buttons for the success dialog
 * @param {object} [options.baseline]       entitlement from before the purchase
 */
export async function paymentLanded({ locale, userId, watch = 'plus', title, message, actions = [], baseline = null } = {}) {
    const kind = LANDED[watch] ? watch : 'plus';
    const landed = LANDED[kind];
    const endpoint = `/${locale}/me/entitlement`;
    const copy = LANDED_COPY[kind];

    // Held open for the whole wait, so a closed card form and an unchanged page
    // do not read as a failure.
    const waiting = toast.loading(t('Confirming your payment…'));

    /*
     | The baseline: the one parked before a redirect when there is one (see
     | checkout.js), otherwise read now — not taken from page props, which were
     | rendered before the checkout opened.
     */
    const defaults = { has_plus: false, plan: null, expires_at: null };
    let before = baseline ? { ...defaults, ...baseline } : defaults;
    let now = null;

    try {
        now = await get(endpoint);
    } catch {
        // The push can still answer, and the poll keeps asking.
    }

    if (!baseline && now) before = { ...before, ...now };

    // With a real baseline the webhook may already have won the race back.
    let confirmed = Boolean(baseline && now && landed({ ...before, ...now }, before));

    if (!confirmed) {
        // Shared with the poll so it stops once the push has answered.
        const race = { over: false };

        confirmed = await Promise.race([
            waitForPush(userId, kind),
            pollUntilLanded(endpoint, landed, before, race),
        ]);

        race.over = true;
    }

    toast.dismiss(waiting);

    if (!confirmed) {
        // The webhook is late, not lost — providers retry for hours.
        toast.success(
            t('Payment received. It is taking a moment to confirm — refresh in a minute if it has not appeared.'),
            { duration: 8000 },
        );

        return false;
    }

    // The dialog first; the confetti is decoration that is allowed to fail.
    openSuccessDialog({ title: title ?? copy.title, message: message ?? copy.message, actions });

    try {
        confetti();
    } catch {
        /* no canvas — the dialog still says it */
    }

    return true;
}

/**
 * Resolves true when the webhook broadcasts this kind of settlement.
 *
 * The event is only dispatched once something was actually granted, so the
 * kind matching is enough. Never resolves false: losing the race silently is
 * the point, so the poll beside it decides.
 */
async function waitForPush(userId, kind) {
    const pushed = await awaitSettlement(userId, (payload) => (PUSHED_KINDS[kind] ?? [kind]).includes(payload.kind), GIVE_UP_MS);

    return pushed === null ? new Promise(() => {}) : true;
}

/** Asks the server once a second until it says yes or the deadline passes. */
async function pollUntilLanded(endpoint, landed, before, race) {
    const deadline = Date.now() + GIVE_UP_MS;

    while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));

        if (race.over) return false;

        try {
            if (landed({ ...before, ...(await get(endpoint)) }, before)) return true;
        } catch {
            // A hiccup mid-poll is not a failed payment; keep asking.
        }
    }

    return false;
}

/*
 | Confetti, written out rather than installed: coloured paper thrown up from
 | the bottom corners, on a canvas that removes itself. Pointer events pass
 | through, and a visitor who has asked for less motion gets none.
 */
export function confetti({ count = 90, duration = 2800 } = {}) {
    if (typeof document === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Privacy extensions can refuse a canvas outright.
    if (ctx === null) {
        canvas.remove();
        return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Eventgoo's palette: brand indigo, gold, sky, success green.
    const colors = ['#3D5AFE', '#E0912B', '#22B8F0', '#2FA968', '#F4C152'];

    const pieces = Array.from({ length: count }, (_, i) => {
        const left = i % 2 === 0;
        const angle = ((left ? -60 : -120) + (Math.random() - 0.5) * 40) * (Math.PI / 180);
        const speed = 13 + Math.random() * 13;

        return {
            x: left ? w * 0.08 : w * 0.92,
            y: h + 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 5 + Math.random() * 6,
            spin: (Math.random() - 0.5) * 0.4,
            rotation: Math.random() * Math.PI,
            color: colors[i % colors.length],
            squash: 0.4 + Math.random() * 0.6,
        };
    });

    const started = performance.now();

    const frame = (now) => {
        const elapsed = now - started;
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = elapsed > duration - 600 ? Math.max(0, (duration - elapsed) / 600) : 1;

        let visible = 0;

        for (const p of pieces) {
            p.vy += 0.42;
            p.vx *= 0.995;
            p.vy *= 0.995;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.spin;

            if (p.y > h + 40) continue;
            visible += 1;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -(p.size * p.squash) / 2, p.size, p.size * p.squash);
            ctx.restore();
        }

        if (visible > 0 && elapsed < duration) {
            requestAnimationFrame(frame);
        } else {
            canvas.remove();
        }
    };

    requestAnimationFrame(frame);
}
