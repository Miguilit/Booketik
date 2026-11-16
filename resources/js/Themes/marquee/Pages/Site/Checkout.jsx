import { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, Lock, MailCheck, Tag as TagIcon, Ticket, UserRound } from 'lucide-react';
import { accentStyle, eventPath, eventWhen, venueLine } from '@/Core/events';
import { tierStateLabel, useTicketCheckout } from '@/Core/ticketCheckout';
import { createApi } from '@/Core/api';
import { useMode } from '@/Core/mode';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { finishHandoff } from '@/Core/lib/payments/checkout';
import StripePayment from '@/Core/engines/StripePayment';
import { layout } from '@/Themes/marquee/Layout';
import { Button, Card, Checkbox, cn, Container, DateStamp, Field, Img, Input, Notice, Select, Stepper, Tag, Textarea } from '@/Themes/marquee/components/ui';
import ChannelPicker from '@/Themes/marquee/components/checkout/ChannelPicker';
import CheckoutDialog from '@/Themes/marquee/components/checkout/CheckoutDialog';

/*
 | Checkout — one page: tickets → details → pay (Core/ticketCheckout). Fees
 | are in every price from the first row; the summary shows the server's
 | breakdown once the order exists, and the 10-minute hold counts down.
 */

const STEPS = ['tickets', 'details', 'pay'];

function Steps({ step }) {
    const labels = { tickets: t('Tickets'), details: t('Details'), pay: t('Pay') };
    const at = Math.max(0, STEPS.indexOf(step === 'account' || step === 'verify' ? 'details' : step));
    return (
        <ol className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em]" aria-label={t('Checkout steps')}>
            {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                    <span aria-current={i === at ? 'step' : undefined} className={cn('flex h-7 items-center whitespace-nowrap rounded-chip border-key px-3', i < at ? 'border-edge bg-ink text-bg' : i === at ? 'border-edge bg-cta text-on-cta' : 'border-line text-muted')}>
                        {i + 1}<span className={cn(i === at ? 'inline' : 'sr-only sm:not-sr-only')}>. {labels[s]}</span>
                    </span>
                    {i < STEPS.length - 1 && <span className="h-px w-4 bg-line" aria-hidden="true" />}
                </li>
            ))}
        </ol>
    );
}

function TierRow({ tier, qty, onChange, disabled, single }) {
    const sellable = ['on_sale', 'hidden_unlocked'].includes(tier.state);
    const state = tierStateLabel(tier);
    return (
        <li className={cn('flex items-center gap-4 py-4', !sellable && 'opacity-60')}>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{tier.name}{tier.requires_code && <Tag tone="info" className="ms-2 align-middle">{t('Unlocked')}</Tag>}</p>
                {tier.description && <p className="mt-0.5 text-sm text-body">{tier.description}</p>}
                <p className="mt-1 font-mono text-sm text-ink">
                    {tier.kind === 'free' ? t('Free') : tier.total?.formatted}
                    {tier.kind !== 'free' && tier.fee?.amount > 0 && <span className="ms-2 text-xs text-muted">{t('incl. :fee fee', { fee: tier.fee.formatted })}</span>}
                </p>
                {(state || tier.remaining != null) && <p className={cn('mt-0.5 text-xs font-semibold', state ? 'text-muted' : 'text-warning')}>{state ?? t('Only :count left', { count: tier.remaining })}</p>}
            </div>
            {sellable && (single
                ? <Button variant={qty ? 'primary' : 'secondary'} size="sm" onClick={() => onChange(qty ? 0 : 1)} aria-pressed={Boolean(qty)} disabled={disabled}>{qty ? t('Selected') : t('Select')}</Button>
                : <Stepper value={qty ?? 0} onChange={onChange} max={Math.min(tier.max_per_order ?? 10, tier.remaining ?? 99)} label={t('Quantity for :tier', { tier: tier.name })} disabled={disabled} />)}
        </li>
    );
}

function Question({ q, value, onChange, error }) {
    const id = `q-${q.id}`;
    if (q.type === 'checkbox') {
        return (
            <div>
                <Checkbox id={id} label={<>{q.label}{q.required && <span className="text-danger"> *</span>}</>} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
                {error && <p className="mt-1 text-sm text-danger" role="alert">{error}</p>}
            </div>
        );
    }
    return (
        <Field label={q.label} htmlFor={id} required={q.required} error={error}>
            {q.type === 'select' ? (
                <Select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} invalid={Boolean(error)}>
                    <option value="">{t('Choose…')}</option>
                    {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
            ) : q.type === 'textarea' ? (
                <Textarea id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} invalid={Boolean(error)} />
            ) : (
                <Input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} invalid={Boolean(error)} />
            )}
        </Field>
    );
}

function Summary({ event, co }) {
    const when = eventWhen(event);
    const b = co.breakdown;
    return (
        <Card sticker className="p-5">
            <div className="flex gap-3">
                <Img image={event.cover} alt="" sizes="96px" className="h-20 w-20 shrink-0 rounded-sm border border-line" ratio={1} />
                <div className="min-w-0">
                    <p className="font-display text-[31px] leading-snug text-ink">{event.title}</p>
                    <p className="font-mono text-xs text-muted">{when?.date} · {when?.time} {when?.zone}</p>
                    <p className="truncate text-sm text-muted">{venueLine(event)}</p>
                </div>
            </div>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[15px]">
                {co.lines.map((l) => (
                    <div key={l.tier.id} className="flex justify-between gap-3">
                        <dt className="min-w-0 truncate text-body">{l.qty} × {l.tier.name}</dt>
                        <dd className="shrink-0 font-mono text-ink">{l.tier.kind === 'free' ? t('Free') : l.unit?.formatted}</dd>
                    </div>
                ))}
                {b && b.discount?.amount > 0 && (
                    <div className="flex justify-between text-success"><dt>{t('Discount')}</dt><dd className="font-mono">−{b.discount.formatted}</dd></div>
                )}
                {b && b.fees?.amount > 0 && (
                    <div className="flex justify-between text-sm text-muted"><dt>{t('of which fees')}</dt><dd className="font-mono">{b.fees.formatted}</dd></div>
                )}
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                    <dt className="font-semibold text-ink">{t('Total')}</dt>
                    <dd className="font-display text-2xl text-ink">{co.count === 0 ? '—' : co.paid ? co.total?.formatted : t('Free')}</dd>
                </div>
                {co.paid && <p className="text-xs text-muted">{t('All fees included. No extra charges at payment.')}</p>}
            </dl>
            {co.hold && (
                <p className={cn('mt-4 flex items-center gap-2 rounded-sm px-3 py-2 font-mono text-sm', co.hold.ms < 120000 ? 'bg-tint-2 text-on-tint-2' : 'bg-raised text-ink')} role="timer" aria-live="off">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {t('Seats held for :time', { time: co.hold.label })}
                </p>
            )}
        </Card>
    );
}

function Done({ result, event }) {
    const url = useRoute();
    const status = result?.registration?.status;
    const pending = status === 'pending';
    const waitlisted = status === 'waitlisted';
    return (
        <Card sticker className="p-6 sm:p-8">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-key border-edge bg-success text-bg">
                {pending || waitlisted ? <Clock className="h-7 w-7" aria-hidden="true" /> : <CheckCircle2 className="h-7 w-7" aria-hidden="true" />}
            </span>
            <h2 className="mt-4 font-display text-[52px] leading-tight text-ink">
                {pending ? t('Request sent') : waitlisted ? t('You are on the waitlist') : t('You are going!')}
            </h2>
            <p className="mt-2 text-[17px] text-body">
                {pending
                    ? t('The organizer reviews each request. We will email you when they decide.')
                    : waitlisted
                        ? t('If a spot opens you get 24 hours to claim it — we will tell you right away.')
                        : result?.email
                            ? t('Your ticket is on its way to :email. Show its QR code at the door.', { email: result.email })
                            : t('Your ticket is in My tickets.')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="secondary" href={url(eventPath(event.slug))} icon={ArrowLeft}>{t('Back to the event')}</Button>
                {!result?.email && <Button variant="primary" href={url('/tickets')} icon={Ticket}>{t('My tickets')}</Button>}
            </div>
        </Card>
    );
}

export default function Checkout({ event, tiers, accent, preselect, unlockCode, referral, waitlistEntryId, channels }) {
    const url = useRoute();
    const { dark } = useMode();
    const co = useTicketCheckout({ event, tiers, preselect, referral, unlockCode, waitlistEntryId, channels });
    const api = useMemo(() => createApi(co.user?.token), [co.user?.token]);
    const single = co.mode !== 'buy' || !co.user;
    const closed = co.sellable.length === 0 && co.mode !== 'waitlist';
    const pickerChannels = channels?.length ? [{ channel: 'card', label: t('Card') }, ...channels] : [];

    const heading = {
        buy: event.price?.is_free ? t('Get your spot') : t('Get tickets'),
        request: t('Request to join'),
        waitlist: t('Join the waitlist'),
        claim: t('Claim your spot'),
    }[co.mode];

    return (
        <div style={accentStyle(accent, dark)}>
            <Head title={`${heading} · ${event.title}`} />
            <Container className="pb-24 pt-6 sm:pt-10">
                <Link href={url(eventPath(event.slug))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-link"><ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{event.title}</Link>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                    <h1 className="font-display text-[52px] leading-none tracking-[-0.03em] text-ink sm:text-[68px]">{heading}</h1>
                    {co.step !== 'done' && <Steps step={co.step} />}
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="min-w-0 space-y-6">
                        {co.notice?.text && <Notice tone={co.notice.tone}>{co.notice.text}</Notice>}

                        {co.step === 'done' ? (
                            <Done result={co.result} event={event} />
                        ) : (
                            <>
                                {/* 1 — tickets */}
                                <Card className="p-5 sm:p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="font-display text-[36px] text-ink">{t('1. Choose tickets')}</h2>
                                        {co.step !== 'tickets' && !co.intent && <Button variant="link" onClick={() => co.setStep('tickets')}>{t('Change')}</Button>}
                                        {co.intent && co.step === 'pay' && <Button variant="link" onClick={co.changeTickets}>{t('Change')}</Button>}
                                    </div>
                                    {closed ? (
                                        <p className="mt-3 text-body">{t('Nothing is on sale right now.')}</p>
                                    ) : co.mode === 'waitlist' ? (
                                        <p className="mt-3 text-body">{t('The event is full. Join the waitlist and we will offer you a freed spot for 24 hours.')}</p>
                                    ) : (
                                        <ul className="mt-2 divide-y divide-line">
                                            {co.tiers.map((tier) => (
                                                <TierRow key={tier.id} tier={tier} qty={co.qty[tier.id]} single={single} disabled={co.step !== 'tickets'} onChange={(n) => co.setTierQty(tier, n)} />
                                            ))}
                                        </ul>
                                    )}
                                    {!co.user && co.mode === 'buy' && (
                                        <p className="mt-3 flex items-center gap-2 text-sm text-muted"><UserRound className="h-4 w-4" aria-hidden="true" />{co.paid ? t('Paid tickets need an account — we will set one up in the next step.') : t('No account needed for free tickets.')}</p>
                                    )}
                                    {co.errors.tickets && <p className="mt-2 text-sm font-medium text-danger" role="alert">{co.errors.tickets}</p>}
                                    {co.step === 'tickets' && !closed && (
                                        <Button variant="cta" size="lg" className="mt-5 w-full sm:w-auto" onClick={co.continueToDetails}>{t('Continue')}</Button>
                                    )}
                                </Card>

                                {/* 2 — details */}
                                {co.step !== 'tickets' && (
                                    <Card className="p-5 sm:p-6">
                                        <h2 className="font-display text-[36px] text-ink">{t('2. Your details')}</h2>
                                        <form onSubmit={co.submit} className="mt-4 space-y-4" noValidate>
                                            {co.user ? (
                                                <p className="rounded-sm bg-raised px-4 py-3 text-[15px] text-body">{t('Booking as :name (:email)', { name: co.user.name, email: co.user.email })}</p>
                                            ) : (
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <Field label={t('Name')} htmlFor="guest-name" required error={co.errors.name}>
                                                        <Input id="guest-name" autoComplete="name" value={co.guest.name} onChange={(e) => co.setGuest({ name: e.target.value })} invalid={Boolean(co.errors.name)} />
                                                    </Field>
                                                    <Field label={t('Email')} htmlFor="guest-email" required error={co.errors.email} hint={<span className="text-xs text-muted">{t('Your ticket goes here')}</span>}>
                                                        <Input id="guest-email" type="email" autoComplete="email" value={co.guest.email} onChange={(e) => co.setGuest({ email: e.target.value })} invalid={Boolean(co.errors.email)} />
                                                    </Field>
                                                    <p className="text-sm text-muted sm:col-span-2">
                                                        {t('Have an account?')} <button type="button" className="font-semibold text-link underline-offset-4 hover:underline" onClick={co.signIn}>{t('Sign in')}</button>
                                                    </p>
                                                </div>
                                            )}

                                            {co.questions.map((q) => (
                                                <Question key={q.id} q={q} value={co.answers[q.id]} onChange={(v) => co.setAnswer(q.id, v)} error={co.errors[`answers.${q.id}`]} />
                                            ))}

                                            {co.paid && co.mode === 'buy' && (
                                                <Field label={t('Promo code')} htmlFor="promo" error={co.errors.promo_code}>
                                                    <div className="relative">
                                                        <TagIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                                                        <Input id="promo" className="ps-9 uppercase" value={co.promo} onChange={(e) => co.setPromo(e.target.value)} placeholder={t('Optional')} />
                                                    </div>
                                                </Field>
                                            )}

                                            {co.paid && pickerChannels.length > 1 && co.step === 'details' && (
                                                <ChannelPicker channels={pickerChannels} value={co.channel ?? 'card'} onChange={(v) => co.setChannel(v === 'card' ? null : v)} />
                                            )}

                                            {co.step === 'account' && (
                                                <Notice tone="info" icon={UserRound}>{t('Sign in or create an account in the window that opened, and we will bring you right back here.')}</Notice>
                                            )}
                                            {co.step === 'verify' && (
                                                <Notice tone="warn" icon={MailCheck}>
                                                    {t('Confirm your email to pay — we sent a 6-digit code to :email.', { email: co.user?.email ?? '' })}{' '}
                                                    <button type="button" className="font-semibold underline" onClick={co.resendVerification}>{t('Enter the code')}</button>
                                                </Notice>
                                            )}

                                            {['details', 'account', 'verify'].includes(co.step) && (
                                                <Button type="submit" variant="cta" size="lg" block loading={co.busy}>
                                                    {co.paid ? t('Continue to payment') : co.mode === 'request' ? t('Send request') : co.mode === 'waitlist' ? t('Join the waitlist') : t('Confirm my spot')}
                                                </Button>
                                            )}
                                        </form>
                                    </Card>
                                )}

                                {/* 3 — pay */}
                                {co.step === 'pay' && (
                                    <Card sticker className="p-5 sm:p-6">
                                        <h2 className="flex items-center gap-2 font-display text-[36px] text-ink"><Lock className="h-5 w-5" aria-hidden="true" />{t('3. Pay')}</h2>
                                        {co.handoff ? (
                                            <div className="mt-4">
                                                <Button
                                                    variant="cta"
                                                    size="lg"
                                                    block
                                                    onClick={() => finishHandoff(co.handoff, { onPaid: () => co.confirmation(co.intent.order_id), onClose: () => {} })}
                                                >
                                                    {t('Continue to payment')}{co.total?.formatted ? ` · ${co.total.formatted}` : ''}
                                                </Button>
                                                <p className="mt-3 text-sm text-muted">{t('You finish paying on our payment partner’s secure page and come back here for your tickets.')}</p>
                                            </div>
                                        ) : co.stripe ? (
                                            <StripePayment
                                                {...co.stripe}
                                                submitLabel={t('Pay')}
                                                processingLabel={t('Paying…')}
                                                note={t('Payments are processed by Stripe. Your card never touches our servers.')}
                                                className="mt-4"
                                                classNames={{ button: 'mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-btn border-key border-edge bg-cta text-base font-semibold text-on-cta shadow-key disabled:opacity-60' }}
                                            />
                                        ) : co.charge ? (
                                            <CheckoutDialog api={api} intent={{ ...co.charge, orderId: co.charge.orderId ?? co.intent.order_id }} onClose={co.changeTickets} onDelivered={() => co.confirmation(co.intent.order_id)} />
                                        ) : (
                                            <p className="mt-3 text-body">{t('Card payments are not switched on for this site yet.')}</p>
                                        )}
                                    </Card>
                                )}
                            </>
                        )}
                    </div>

                    <aside aria-label={t('Order summary')} className="lg:sticky lg:top-24 lg:self-start">
                        <Summary event={event} co={co} />
                        {event.refund_policy && <p className="mt-4 text-sm text-muted"><strong className="text-ink">{t('Refunds')}:</strong> {event.refund_policy}</p>}
                    </aside>
                </div>
            </Container>
        </div>
    );
}

Checkout.layout = layout;
