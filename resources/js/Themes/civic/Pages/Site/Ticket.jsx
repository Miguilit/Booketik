import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarPlus, CheckCircle2, MapPin, Navigation, Send, Undo2, Wallet, WifiOff } from 'lucide-react';
import { calendarLinks, eventPath, eventWhen, venueLine } from '@/Core/events';
import { ticketStatusLabel, useTicketActions, useTicketQr } from '@/Core/tickets';
import { osmLink } from '@/Core/map';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/civic/Layout';
import { Button, Card, Container, Field, Input, Modal, Notice, Tag, Textarea } from '@/Themes/civic/components/ui';

/*
 | One ticket: the rotating QR (`EG1:{code}:{totp}`, computed in the browser
 | from `qr.secret`, so it works offline once loaded), the code, the event, and
 | what can be done with it — wallet, calendar, transfer, refund request.
 | The QR is always dark on light: scanners need it whatever the page's mode.
 */

const QR_COLORS = { dark: '#13201F', light: '#FFFFFF' };
const STATUS_TONE = { valid: 'success', checked_in: 'info', refunded: 'muted', transferred: 'muted', void: 'danger' };

function useReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function Qr({ ticket }) {
    const { svg, usable, rotating, secondsLeft, period } = useTicketQr(ticket, QR_COLORS);
    const still = useReducedMotion();

    if (!usable) {
        const copy = {
            refunded: t('This ticket was refunded and no longer gets you in.'),
            transferred: t('You sent this ticket to someone else. It now lives in their account.'),
            void: t('This ticket was cancelled by the organizer.'),
        }[ticket.status] ?? t('This ticket cannot be scanned.');
        return <Notice tone={ticket.status === 'void' ? 'danger' : 'info'}>{copy}</Notice>;
    }

    return (
        <div className="flex flex-col items-center">
            {ticket.status === 'checked_in' && (
                <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t('Checked in')}</p>
            )}
            <div
                className="qr-frame w-full max-w-[280px] rounded-sm border-key border-edge bg-white p-4"
                role="img"
                aria-label={t('QR code for ticket :code', { code: ticket.code })}
            >
                {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="aspect-square w-full animate-pulse bg-[#F2EEE6]" />}
            </div>
            {rotating && (
                <div className="mt-3 w-full max-w-[280px]" aria-live="off">
                    <div className="h-1.5 overflow-hidden rounded-chip bg-raised" aria-hidden="true">
                        <div className="h-full bg-brand" style={{ width: `${(secondsLeft / period) * 100}%`, transition: still ? 'none' : 'width 1s linear' }} />
                    </div>
                    <p className="mt-1.5 text-center font-mono text-xs text-muted">{t('Refreshes in :seconds s', { seconds: secondsLeft })}</p>
                </div>
            )}
        </div>
    );
}

function TransferDialog({ open, onClose, actions }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const errors = actions.errors;
    const submit = async (e) => {
        e.preventDefault();
        if (await actions.transfer({ name: name.trim(), email: email.trim() })) onClose();
    };
    return (
        <Modal open={open} onClose={onClose} title={t('Send this ticket')}>
            <p className="text-[15px] text-body">{t('They get a new ticket in their name; this one stops working.')}</p>
            <form onSubmit={submit} className="mt-4 space-y-4">
                <Field label={t('Their name')} htmlFor="tr-name" error={errors.name?.[0]}>
                    <Input id="tr-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="off" />
                </Field>
                <Field label={t('Their email')} htmlFor="tr-email" error={errors.email?.[0]}>
                    <Input id="tr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
                </Field>
                {errors.form && <Notice tone="danger">{errors.form[0]}</Notice>}
                <Button type="submit" variant="cta" block loading={actions.busy === 'transfer'} icon={Send}>{t('Send ticket')}</Button>
            </form>
        </Modal>
    );
}

function RefundDialog({ open, onClose, actions }) {
    const [reason, setReason] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        if (await actions.requestRefund(reason.trim())) onClose();
    };
    return (
        <Modal open={open} onClose={onClose} title={t('Request a refund')}>
            <p className="text-[15px] text-body">{t('The organizer decides, following their refund policy. You keep the ticket until they do.')}</p>
            <form onSubmit={submit} className="mt-4 space-y-4">
                <Field label={t('Why? (optional)')} htmlFor="rf-reason" error={actions.errors.refund?.[0]}>
                    <Textarea id="rf-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
                </Field>
                <Button type="submit" variant="primary" block loading={actions.busy === 'refund'}>{t('Send request')}</Button>
            </form>
        </Modal>
    );
}

async function downloadApplePass(href, token, code) {
    try {
        const res = await fetch(href, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.apple.pkpass' } });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${code}.pkpass`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    } catch {
        toast.error(t('Apple Wallet is not available for this ticket right now.'));
    }
}

export default function TicketPage({ ticket: initial }) {
    const url = useRoute();
    const token = usePage().props.auth?.user?.token;
    const actions = useTicketActions(initial);
    const ticket = actions.ticket;
    const event = ticket.event;
    const when = eventWhen(event);
    const venue = venueLine(event);
    const calendar = calendarLinks(event);
    const [dialog, setDialog] = useState(null);
    const usable = ['valid', 'checked_in'].includes(ticket.status);

    return (
        <>
            <Head title={t('Ticket :code', { code: ticket.code })} />
            <Container className="py-8 sm:py-12">
                <Link href={url('/tickets')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    {t('My tickets')}
                </Link>

                <div className="mx-auto mt-6 grid max-w-4xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <Card sticker className="overflow-hidden">
                        <div className="bg-tint-2 px-6 py-5 text-on-tint-2">
                            <p className="font-mono text-xs uppercase tracking-[0.18em]">{ticket.ticket_type?.name}</p>
                            <h1 className="mt-1 font-display text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-on-tint-2">{event.title}</h1>
                            {when && <p className="mt-1 font-mono text-sm">{when.date} · {when.time} {when.zone}</p>}
                        </div>
                        <div className="relative" aria-hidden="true">
                            <span className="absolute -start-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full border-key border-edge bg-bg" />
                            <span className="absolute -end-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full border-key border-edge bg-bg" />
                        </div>
                        <div className="px-6 py-6">
                            <Qr ticket={ticket} />
                            <p className="mt-5 text-center font-mono text-[22px] font-medium tracking-[0.12em] text-ink">{ticket.code}</p>
                            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
                                <div className="min-w-0"><dt className="text-muted">{t('Holder')}</dt><dd className="truncate font-semibold text-ink">{ticket.holder?.name ?? '—'}</dd></div>
                                <div><dt className="text-muted">{t('Status')}</dt><dd><Tag tone={STATUS_TONE[ticket.status] ?? 'neutral'}>{ticketStatusLabel(ticket.status)}</Tag></dd></div>
                                {ticket.gate && <div><dt className="text-muted">{t('Gate')}</dt><dd className="font-semibold text-ink">{ticket.gate}</dd></div>}
                                {ticket.seat && <div><dt className="text-muted">{t('Seat')}</dt><dd className="font-semibold text-ink">{ticket.seat}</dd></div>}
                            </dl>
                            {usable && (
                                <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted"><WifiOff className="h-3.5 w-3.5" aria-hidden="true" />{t('Works offline once this page has loaded.')}</p>
                            )}
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <section aria-labelledby="when-where">
                            <h2 id="when-where" className="font-display text-2xl font-bold text-ink">{t('When and where')}</h2>
                            {when && (
                                <p className="mt-3 text-[15px] text-body">
                                    <span className="block font-semibold text-ink">{when.long}</span>
                                    <span className="font-mono">{when.time}{when.endTime ? `–${when.endTime}` : ''} {when.zone}</span>
                                    {when.viewerTime && <span className="block text-sm text-muted">{when.viewerTime}</span>}
                                </p>
                            )}
                            {venue && <p className="mt-3 flex items-start gap-1.5 text-[15px] text-body"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{venue}</p>}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {event.venue?.lat != null && event.venue?.lng != null && (
                                    <Button variant="secondary" size="sm" icon={Navigation} external href={osmLink(event.venue.lat, event.venue.lng)}>{t('Directions')}</Button>
                                )}
                                <Button variant="secondary" size="sm" href={url(eventPath(event.slug))}>{t('Event page')}</Button>
                            </div>
                        </section>

                        {usable && (ticket.wallet?.apple_url || ticket.wallet?.google_url) && (
                            <section aria-labelledby="wallet">
                                <h2 id="wallet" className="font-display text-xl font-bold text-ink">{t('Add to your wallet')}</h2>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {ticket.wallet.apple_url && (
                                        <Button variant="primary" icon={Wallet} onClick={() => downloadApplePass(ticket.wallet.apple_url, token, ticket.code)}>{t('Apple Wallet')}</Button>
                                    )}
                                    {ticket.wallet.google_url && (
                                        <Button variant="primary" icon={Wallet} external href={ticket.wallet.google_url}>{t('Google Wallet')}</Button>
                                    )}
                                </div>
                            </section>
                        )}

                        {calendar && !when?.past && (
                            <section aria-labelledby="calendar">
                                <h2 id="calendar" className="font-display text-xl font-bold text-ink">{t('Add to calendar')}</h2>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button variant="secondary" size="sm" icon={CalendarPlus} external href={calendar.google}>Google Calendar</Button>
                                    <Button variant="secondary" size="sm" icon={CalendarPlus} external href={calendar.outlook}>Outlook</Button>
                                </div>
                            </section>
                        )}

                        {(ticket.can_transfer || ticket.can_request_refund) && (
                            <section aria-labelledby="manage" className="border-t border-line pt-6">
                                <h2 id="manage" className="font-display text-xl font-bold text-ink">{t('Can’t make it?')}</h2>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {ticket.can_transfer && <Button variant="secondary" icon={Send} onClick={() => setDialog('transfer')}>{t('Send to a friend')}</Button>}
                                    {ticket.can_request_refund && !actions.refund && <Button variant="ghost" icon={Undo2} onClick={() => setDialog('refund')}>{t('Request a refund')}</Button>}
                                </div>
                                {actions.refund && <Notice tone="info" className="mt-3">{t('Refund requested. The organizer will decide.')}</Notice>}
                            </section>
                        )}
                    </div>
                </div>
            </Container>

            <TransferDialog open={dialog === 'transfer'} onClose={() => setDialog(null)} actions={actions} />
            <RefundDialog open={dialog === 'refund'} onClose={() => setDialog(null)} actions={actions} />
        </>
    );
}

TicketPage.layout = layout;
