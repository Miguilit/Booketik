import { useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarPlus, CheckCircle2, Clock, Copy, Loader2, Share2, Ticket, Wallet } from 'lucide-react';
import { accentStyle, calendarLinks, eventPath, eventWhen, venueLine } from '@/Core/events';
import { useTicketQr } from '@/Core/tickets';
import { useOrderPolling } from '@/Core/checkout';
import { createApi } from '@/Core/api';
import { useShare } from '@/Core/lib/share';
import { useMode } from '@/Core/mode';
import { useRoute, useViewer } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/marquee/Layout';
import { Button, Card, cn, Container, DateStamp, Notice } from '@/Themes/marquee/components/ui';

/*
 | The ticket reveal: the order is confirmed by the webhook, not by the
 | browser, so a paid order that has not landed yet is watched here
 | (useOrderPolling) and the page reloads its tickets when it does.
 */

const QR_COLORS = { dark: '#13201F', light: '#FFFFFF' };

function Stub({ ticket, event, index }) {
    const url = useRoute();
    const qr = useTicketQr(ticket, QR_COLORS);
    const when = eventWhen(event);

    return (
        <li className="cv-reveal" style={{ animationDelay: `${index * 90}ms` }}>
            <Card sticker className="grid overflow-hidden sm:grid-cols-[1fr_auto]">
                <div className="p-5 sm:p-6">
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{ticket.ticket_type?.name}</p>
                    <p className="mt-1 font-display text-[47px] leading-tight text-ink">{event.title}</p>
                    <p className="mt-1 font-mono text-sm text-ink">{when?.date} · {when?.time} <span className="text-muted">{when?.zone}</span></p>
                    <p className="text-sm text-muted">{venueLine(event)}</p>
                    <p className="mt-3 text-sm text-body">{ticket.holder?.name}</p>
                    <p className="font-mono text-lg tracking-wider text-ink">{ticket.code}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" href={url(`/t/${ticket.code}`)} icon={Ticket}>{t('Open ticket')}</Button>
                        {ticket.wallet?.google_url && <Button size="sm" variant="secondary" href={ticket.wallet.google_url} external icon={Wallet}>{t('Google Wallet')}</Button>}
                        {ticket.wallet?.apple_url && <Button size="sm" variant="secondary" href={url(`/t/${ticket.code}`)} icon={Wallet}>{t('Apple Wallet')}</Button>}
                    </div>
                </div>
                <div className="flex items-center justify-center border-t-key border-dashed border-edge bg-tint-2 p-5 sm:border-s-key sm:border-t-0">
                    <div className="qr-frame w-[168px] rounded-sm border-key border-edge bg-white p-2" role="img" aria-label={t('QR code for ticket :code', { code: ticket.code })}>
                        {qr.svg ? <div dangerouslySetInnerHTML={{ __html: qr.svg }} /> : <div className="aspect-square animate-pulse bg-raised" />}
                    </div>
                </div>
            </Card>
        </li>
    );
}

export default function OrderConfirmation({ event, order, tickets = [], accent }) {
    const url = useRoute();
    const viewer = useViewer();
    const { dark } = useMode();
    const api = useMemo(() => createApi(viewer?.token), [viewer?.token]);
    const waiting = Boolean(order && !order.isDelivered && order.paymentStatus !== 'failed');
    const { state } = useOrderPolling(api, waiting ? order.id : null, { enabled: waiting });
    const when = eventWhen(event);
    const calendar = calendarLinks(event);
    const invite = event.viewer?.referral_url ?? event.share_url;
    const { copy, copied } = useShare(invite);
    const status = event.viewer?.status;

    useEffect(() => {
        if (state === 'delivered') router.reload({ only: ['event', 'order', 'tickets'] });
    }, [state]);

    const headline = waiting
        ? t('Payment received — issuing your tickets')
        : status === 'pending'
            ? t('Request sent')
            : status === 'waitlisted'
                ? t('You are on the waitlist')
                : t('You are going!');

    return (
        <div style={accentStyle(accent, dark)}>
            <Head title={headline} />
            <Container className="pb-24 pt-8 sm:pt-12">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="min-w-0">
                        <div className="flex items-start gap-4">
                            <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-key border-edge', waiting || status === 'pending' || status === 'waitlisted' ? 'bg-tint-2 text-on-tint-2' : 'bg-success text-bg')}>
                                {waiting ? <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" /> : status === 'pending' || status === 'waitlisted' ? <Clock className="h-7 w-7" aria-hidden="true" /> : <CheckCircle2 className="h-7 w-7" aria-hidden="true" />}
                            </span>
                            <div>
                                <h1 className="font-display text-[49px] tracking-[-0.03em] text-ink sm:text-[68px]" aria-live="polite">{headline}</h1>
                                {order?.orderNumber && <p className="mt-1 font-mono text-sm text-muted">{t('Order :number', { number: order.orderNumber })} · {order.amountFormatted}</p>}
                            </div>
                        </div>

                        {waiting && <Notice tone="info" className="mt-6">{t('This usually takes a few seconds. You can leave this page — we email your tickets too.')}</Notice>}
                        {status === 'pending' && <p className="mt-4 text-[17px] text-body">{t('The organizer reviews each request. We will let you know as soon as they decide.')}</p>}
                        {status === 'waitlisted' && <p className="mt-4 text-[17px] text-body">{t('If a spot opens, you get 24 hours to claim it.')}</p>}

                        {tickets.length > 0 && (
                            <ul className="mt-8 space-y-4">
                                {tickets.map((ticket, i) => <Stub key={ticket.code} ticket={ticket} event={event} index={i} />)}
                            </ul>
                        )}
                    </div>

                    <aside className="space-y-4 lg:pt-4">
                        <Card className="flex items-center gap-4 p-5">
                            <DateStamp when={when} />
                            <div className="min-w-0">
                                <Link href={url(eventPath(event.slug))} className="font-semibold text-ink hover:underline">{event.title}</Link>
                                <p className="font-mono text-xs text-muted">{when?.time} {when?.zone} · {when?.relative}</p>
                            </div>
                        </Card>
                        {calendar && (
                            <Card className="p-5">
                                <p className="flex items-center gap-2 font-semibold text-ink"><CalendarPlus className="h-4 w-4" aria-hidden="true" />{t('Add to calendar')}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {calendar.ics && <Button size="sm" variant="secondary" href={calendar.ics} external>{t('Apple / iCal')}</Button>}
                                    <Button size="sm" variant="secondary" href={calendar.google} external>Google</Button>
                                    <Button size="sm" variant="secondary" href={calendar.outlook} external>Outlook</Button>
                                </div>
                            </Card>
                        )}
                        <Card className="bg-tint p-5 text-on-tint">
                            <p className="flex items-center gap-2 font-semibold text-on-tint"><Share2 className="h-4 w-4" aria-hidden="true" />{t('Bring a friend')}</p>
                            <p className="mt-1 text-sm">{t('Share your invite link — the organizer sees who you brought along.')}</p>
                            <div className="mt-3 flex gap-2">
                                <input readOnly value={invite} aria-label={t('Invite link')} className="h-10 min-w-0 flex-1 rounded-sm border-key border-edge bg-surface px-3 font-mono text-xs text-ink" onFocus={(e) => e.target.select()} />
                                <Button size="sm" variant="primary" onClick={copy} icon={Copy}>{copied ? t('Copied') : t('Copy')}</Button>
                            </div>
                        </Card>
                        <Button variant="secondary" block href={url('/tickets')} icon={Ticket}>{t('All my tickets')}</Button>
                    </aside>
                </div>
            </Container>
        </div>
    );
}

OrderConfirmation.layout = layout;
