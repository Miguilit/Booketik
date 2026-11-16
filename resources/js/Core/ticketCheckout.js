/*
 | Ticket checkout — one page, one state machine:
 |
 |   tickets ──► details ──► pay ──► (confirmation page)
 |                  │          ▲
 |                  ├─ account ┘   paid tiers need an account …
 |                  ├─ verify ─┘   … with a confirmed email (EMAIL_NOT_VERIFIED)
 |                  └─ done        a guest's free RSVP, answered in place
 |
 | Prices are fees-included from the first step (TicketType.total); the
 | server's breakdown replaces the estimate once the order exists. A paid
 | order holds its seats for 10 minutes (`hold_expires_at`): the countdown is
 | shown, and when it lapses the buyer is sent back to pick again. Payment is
 | Stripe's Payment Element on the intent's client secret, or a regional
 | channel's ChargeIntent; tickets are issued by the webhook only, so success
 | here means "go and wait on the confirmation page".
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { router, usePage } from '@inertiajs/react';
import { createApi } from './lib/api';
import { openAuthDialog, openVerifyEmailDialog } from './lib/auth/authDialog';
import { money } from './lib/format';
import { t } from './i18n';
import { countdown } from './events';

export const SELLABLE = ['on_sale', 'hidden_unlocked'];

export function tierStateLabel(tier) {
    return {
        on_sale: null,
        hidden_unlocked: t('Unlocked'),
        scheduled: tier?.sales_start_at ? t('On sale :date', { date: new Date(tier.sales_start_at).toLocaleDateString() }) : t('Not on sale yet'),
        sold_out: t('Sold out'),
        ended: t('Sales ended'),
    }[tier?.state] ?? null;
}

function modeOf(event) {
    const action = event?.cta?.action;
    if (action === 'waitlist') return 'waitlist';
    if (action === 'claim') return 'claim';
    if (action === 'request' || event?.approval_required) return 'request';
    return 'buy';
}

export function useTicketCheckout({ event, tiers, preselect, referral, unlockCode, waitlistEntryId, channels }) {
    const page = usePage();
    const { auth, locale } = page.props;
    const user = auth?.user ?? null;
    const api = useMemo(() => createApi(user?.token), [user?.token]);
    const url = (path) => `/${locale}${path}`;
    const mode = modeOf(event);

    const sellable = useMemo(() => (tiers ?? []).filter((tier) => SELLABLE.includes(tier.state)), [tiers]);

    const [qty, setQty] = useState(() => {
        const start = {};
        const pick = sellable.find((tier) => tier.id === preselect?.tier) ?? (sellable.length === 1 || mode !== 'buy' ? sellable[0] : null);
        if (pick) start[pick.id] = Math.min(preselect?.qty ?? 1, pick.max_per_order ?? 10);
        return start;
    });
    const [step, setStep] = useState('tickets');
    const [answers, setAnswers] = useState({});
    const [guest, setGuest] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
    const [promo, setPromo] = useState('');
    const [channel, setChannel] = useState(null);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState(null);
    const [busy, setBusy] = useState(false);
    const [intent, setIntent] = useState(null);
    const [result, setResult] = useState(null);
    const [now, setNow] = useState(() => Date.now());
    const resumeAfterAuth = useRef(false);

    const lines = useMemo(() => (tiers ?? [])
        .filter((tier) => (qty[tier.id] ?? 0) > 0)
        .map((tier) => ({ tier, qty: qty[tier.id], unit: tier.total, sum: (tier.total?.amount ?? 0) * qty[tier.id] })), [tiers, qty]);

    const count = lines.reduce((n, l) => n + l.qty, 0);
    const currency = lines[0]?.unit?.currency ?? sellable[0]?.total?.currency ?? 'EUR';
    const estimate = lines.reduce((n, l) => n + l.sum, 0);
    const paid = lines.some((l) => (l.tier.price?.amount ?? 0) > 0);
    const questions = event?.registration_questions ?? [];

    // A hold ticks down; when it lapses the seats are gone.
    useEffect(() => {
        if (!intent?.hold_expires_at) return undefined;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [intent?.hold_expires_at]);

    const hold = intent?.hold_expires_at ? countdown(intent.hold_expires_at, now) : null;

    useEffect(() => {
        if (intent?.hold_expires_at && step === 'pay' && !hold) {
            setIntent(null);
            setStep('tickets');
            setNotice({ tone: 'warn', text: t('Your 10-minute hold ran out and the seats were released. Pick again to continue.') });
        }
    }, [hold, intent?.hold_expires_at, step]);

    // Back from signing in or confirming the email: carry on where they were.
    useEffect(() => {
        if (!resumeAfterAuth.current || !user) return;
        if (step === 'account' || (step === 'verify' && !user.mustVerifyForTickets)) {
            resumeAfterAuth.current = false;
            setGuest((g) => ({ name: g.name || user.name || '', email: user.email || g.email }));
            setStep('details');
            setNotice({ tone: 'info', text: user.mustVerifyForTickets ? null : t('All set — you can finish your order now.') });
        }
    }, [user, step]);

    const setTierQty = (tier, value) => {
        const max = Math.min(tier.max_per_order ?? 10, tier.remaining ?? 99);
        const n = Math.max(0, Math.min(max, value));
        setQty((q) => {
            // Approval, waitlist and claim flows take one tier.
            if (mode !== 'buy' || !user) return n > 0 ? { [tier.id]: n } : {};
            return { ...q, [tier.id]: n };
        });
        setErrors({});
    };

    const validateDetails = () => {
        const next = {};
        if (!user) {
            if (!guest.name.trim()) next.name = t('Tell us your name.');
            if (!/^\S+@\S+\.\S+$/.test(guest.email.trim())) next.email = t('Enter a valid email address.');
        }
        for (const q of questions) {
            const value = answers[q.id];
            if (q.required && (value === undefined || value === null || value === '' || value === false)) next[`answers.${q.id}`] = t('This one is required.');
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const continueToDetails = () => {
        if (count === 0 && mode !== 'waitlist') {
            setErrors({ tickets: t('Choose at least one ticket.') });
            return;
        }
        setNotice(null);
        setStep('details');
    };

    const items = () => lines.map((l) => ({ ticket_type_id: l.tier.id, qty: l.qty, ...(l.tier.requires_code && unlockCode ? { unlock_code: unlockCode } : {}) }));

    const confirmation = (orderId) => router.visit(url(`/e/${event.slug}/confirmed${orderId ? `?order=${encodeURIComponent(orderId)}` : ''}`));

    const fail = (error) => {
        if (error?.code === 'EMAIL_NOT_VERIFIED') {
            resumeAfterAuth.current = true;
            setStep('verify');
            openVerifyEmailDialog({ send: true });
            return;
        }
        if (error?.fields) {
            setErrors(Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
        }
        setNotice({ tone: 'danger', text: error?.message ?? t('Something went wrong. Try again.') });
    };

    const submit = async (e) => {
        e?.preventDefault?.();
        if (busy || !validateDetails()) return;
        setNotice(null);

        // Paid tiers, and every waitlist: an account first.
        if (!user && (paid || mode === 'waitlist' || mode === 'claim')) {
            resumeAfterAuth.current = true;
            setStep('account');
            openAuthDialog('register', paid ? t('Create an account to buy tickets — it takes a minute.') : t('Create an account to join the waitlist.'));
            return;
        }

        if (user && paid && user.mustVerifyForTickets) {
            resumeAfterAuth.current = true;
            setStep('verify');
            openVerifyEmailDialog({ send: true });
            return;
        }

        setBusy(true);
        try {
            if (!user) {
                // A guest's free place: no account, the tickets are emailed.
                const line = lines[0];
                const { data } = await axios.post(url(`/e/${event.slug}/rsvp`), {
                    name: guest.name.trim(),
                    email: guest.email.trim(),
                    ticket_type_id: line?.tier.id ?? null,
                    quantity: line?.qty ?? 1,
                    answers,
                    referral,
                    unlock_code: unlockCode,
                }, { headers: { Accept: 'application/json' } });
                setResult({ registration: data.data, email: guest.email.trim() });
                setStep('done');
                return;
            }

            if (mode === 'waitlist') {
                const registration = await api.post(`/events/${event.slug}/waitlist`, { answers, quantity: Math.max(1, count) });
                setResult({ registration });
                setStep('done');
                return;
            }

            if (mode === 'claim' && !paid && waitlistEntryId) {
                await api.post(`/waitlist/${waitlistEntryId}/claim`, {});
                confirmation(null);
                return;
            }

            if (!paid && (mode === 'request' || lines.length === 1)) {
                const line = lines[0];
                await api.post(`/events/${event.slug}/register`, {
                    ticket_type_id: line?.tier.id ?? null, quantity: line?.qty ?? 1, answers, referral, unlock_code: unlockCode,
                });
                confirmation(null);
                return;
            }

            const chosen = channel ? (channels ?? []).find((c) => c.channel === channel) : null;
            const next = await api.post('/orders/intent', {
                type: 'tickets',
                event: event.slug,
                items: items(),
                answers,
                promo_code: promo.trim() || null,
                referral,
                waitlist_entry_id: mode === 'claim' ? waitlistEntryId : null,
                platform: 'web',
                ...(chosen ? { paymentMethod: chosen.paymentMethod, channel: chosen.channel } : {}),
            });

            if (next.provider === 'free') {
                confirmation(next.order_id);
                return;
            }

            setIntent(next);
            setStep('pay');
            if (!next.stripe && !next.charge) {
                setNotice({ tone: 'warn', text: t('Card payments are not switched on yet. Your seats are held for 10 minutes.') });
            }
        } catch (error) {
            fail(error?.response?.data?.error ?? error);
        } finally {
            setBusy(false);
        }
    };

    const changeTickets = async () => {
        if (intent?.order_id) {
            try {
                await api.post(`/orders/${intent.order_id}/cancel-hold`, {});
            } catch {
                // It lapses on its own.
            }
        }
        setIntent(null);
        setStep('tickets');
    };

    const total = intent?.breakdown?.total ?? (count ? { amount: estimate, currency, formatted: money(estimate, currency) } : null);

    return {
        mode,
        step,
        setStep,
        user,
        tiers: tiers ?? [],
        sellable,
        qty,
        setTierQty,
        lines,
        count,
        paid,
        total,
        breakdown: intent?.breakdown ?? null,
        questions,
        answers,
        setAnswer: (id, value) => setAnswers((a) => ({ ...a, [id]: value })),
        guest,
        setGuest: (patch) => setGuest((g) => ({ ...g, ...patch })),
        promo,
        setPromo,
        channels: channels ?? [],
        channel,
        setChannel,
        errors,
        notice,
        busy,
        intent,
        hold,
        result,
        continueToDetails,
        submit,
        changeTickets,
        stripe: intent?.stripe
            ? {
                clientSecret: intent.stripe.payment_intent_client_secret,
                publishableKey: intent.stripe.publishable_key,
                amountCents: intent.breakdown?.total?.amount,
                currency: intent.breakdown?.total?.currency,
                returnUrl: `${window.location.origin}${url(`/e/${event.slug}/confirmed?order=${encodeURIComponent(intent.order_id)}`)}`,
                onPaid: () => confirmation(intent.order_id),
            }
            : null,
        charge: intent?.charge ?? null,
        /** A hosted checkout (Dodo, Polar, Creem: redirect; Paddle: overlay) for the active provider. */
        handoff: intent?.handoff ?? null,
        signIn: () => {
            resumeAfterAuth.current = true;
            setStep('account');
            openAuthDialog('login', t('Sign in to continue your order.'));
        },
        resendVerification: () => openVerifyEmailDialog({ send: true }),
        confirmation,
    };
}
