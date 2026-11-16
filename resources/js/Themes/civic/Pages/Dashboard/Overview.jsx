import { Head, Link } from '@inertiajs/react';
import { CalendarPlus, MapPin, ScanLine, UsersRound } from 'lucide-react';
import { pct, useDashboard } from '@/Core/dashboard';
import { eventWhen } from '@/Core/events';
import { formatCount } from '@/Core/format';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { PageHead, Panel, StatTile, StatusPill, Table } from '@/Themes/civic/components/dashboard/kit';
import { Funnel } from '@/Themes/civic/components/dashboard/charts';
import { AskInsightsCard, InsightsAgentProvider } from '@/Themes/civic/components/dashboard/InsightsAgent';
import { Button, Card, DateStamp, EmptyState, Img } from '@/Themes/civic/components/ui';

function NextEvent({ event }) {
    const { path, can } = useDashboard();
    if (!event) {
        return (
            <EmptyState icon={CalendarPlus} title={t('Nothing coming up')} body={t('Create an event — paste a flyer or a message and the draft fills itself in.')}
                action={<Button variant="cta" href={path('/events/new')}>{t('Create an event')}</Button>} />
        );
    }
    const when = eventWhen(event);
    const fill = event.capacity ? event.sold / event.capacity : null;
    return (
        <Card sticker className="overflow-hidden">
            <div className="grid sm:grid-cols-[220px_1fr]">
                <Img image={event.cover} alt="" className="aspect-[16/10] w-full sm:aspect-auto sm:h-full" sizes="220px" />
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        <DateStamp when={when} />
                        <div className="min-w-0">
                            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{t('Next up')} · {when.relative}</p>
                            <Link href={path(`/events/${event.id}`)} className="mt-0.5 block font-display text-[22px] font-bold leading-tight text-ink hover:underline">{event.title}</Link>
                            <p className="mt-1 font-mono text-sm text-muted">{when.time} {when.zone}</p>
                        </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div><dt className="text-xs text-muted">{t('Sold')}</dt><dd className="font-display text-xl font-bold tabular-nums text-ink">{formatCount(event.sold)}{event.capacity ? <span className="text-sm text-muted">/{formatCount(event.capacity)}</span> : null}</dd></div>
                        <div><dt className="text-xs text-muted">{t('To approve')}</dt><dd className="font-display text-xl font-bold tabular-nums text-ink">{event.pending_approvals}</dd></div>
                        <div><dt className="text-xs text-muted">{t('Waitlist')}</dt><dd className="font-display text-xl font-bold tabular-nums text-ink">{event.waitlist}</dd></div>
                    </dl>
                    {fill !== null && (
                        <div className="mt-3 h-2 rounded-chip bg-raised" role="meter" aria-valuenow={Math.round(fill * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={t('Capacity sold')}>
                            <div className="h-2 rounded-chip bg-brand" style={{ width: `${Math.min(100, fill * 100)}%` }} />
                        </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" icon={UsersRound} href={path(`/events/${event.id}/guests`)}>{t('Guests')}</Button>
                        <Button size="sm" variant="secondary" icon={ScanLine} href={path(`/events/${event.id}/checkin`)}>{t('Check-in')}</Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}

/** The organizer's Overview: bento tiles, the funnel, the next event, recent orders and the copilot. */
export default function Overview({ tiles, next_event: nextEvent, recent_orders: orders, events = [] }) {
    const { org, path, can } = useDashboard();
    const f = tiles?.funnel ?? {};
    const live = events.filter((e) => e.state === 'live');

    return (
        <InsightsAgentProvider event={nextEvent}>
            <Head title={t('Overview')} />
            <PageHead eyebrow={org?.name} title={t('Overview')} actions={can.edit && <Button variant="cta" icon={CalendarPlus} href={path('/events/new')}>{t('Create an event')}</Button>} />

            {live.length > 0 && (
                <Card className="mb-5 flex flex-wrap items-center gap-3 border-success/40 bg-success/10 p-4">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success motion-reduce:animate-none" aria-hidden="true" />
                    <span className="font-semibold text-ink">{t('Happening now:')}</span>
                    {live.map((e) => <Link key={e.id} href={path(`/events/${e.id}/checkin`)} className="font-semibold text-link hover:underline">{e.title} · {e.checked_in}/{e.sold}</Link>)}
                </Card>
            )}

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatTile label={t('Sales today')} value={tiles.sales_today.formatted} className="xl:col-span-1" />
                <StatTile label={t('Sales, 7 days')} value={tiles.sales_7d.formatted} note={t(':n tickets this week', { n: formatCount(tiles.tickets_sold_7d) })} />
                <StatTile label={t('Tickets sold')} value={formatCount(tiles.tickets_sold)} note={t('All time, refunds excluded')} />
                <StatTile label={t('Check-in rate')} value={pct(tiles.checkin_rate)} note={t('Of tickets for events that have started')} />
                <StatTile label={t('Waiting for approval')} value={formatCount(tiles.pending_approvals)} href={path('/guests')} tone={tiles.pending_approvals ? 'warn' : undefined} />
                <StatTile label={t('On the waitlist')} value={formatCount(tiles.waitlist)} href={path('/guests')} />
                <Panel title={t('Last 30 days')} className="col-span-2" bodyClass="pt-4">
                    <Funnel steps={[
                        { label: t('Page views'), value: f.views ?? 0 },
                        { label: t('Checkout started'), value: f.checkout_started ?? 0 },
                        { label: t('Paid orders'), value: f.orders_paid ?? 0 },
                        { label: t('Tickets issued'), value: f.tickets ?? 0, noRate: true },
                    ]} />
                </Panel>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
                <div className="space-y-5">
                    <NextEvent event={nextEvent} />
                    {orders && (
                        <Panel title={t('Recent orders')} action={<Link href={path('/events')} className="text-sm font-semibold text-link">{t('Events')}</Link>} bodyClass="py-1">
                            <Table
                                caption={t('Recent orders')}
                                rows={orders}
                                empty={<p className="py-4 text-sm text-muted">{t('No paid orders yet.')}</p>}
                                columns={[
                                    { key: 'buyer', label: t('Buyer'), render: (o) => <span className="font-semibold text-ink">{o.buyer || o.number}</span> },
                                    { key: 'event', label: t('Event'), render: (o) => <span className="text-body">{o.event}</span> },
                                    { key: 'total', label: t('Total'), align: 'end', render: (o) => <span className="font-mono tabular-nums">{o.total.formatted}</span> },
                                    { key: 'status', label: t('Status'), hideLabel: true, align: 'end', render: (o) => (o.refund_status ? <StatusPill status="refunded" label={o.refund_status === 'partial' ? t('Part refunded') : t('Refunded')} /> : <StatusPill status="paid" />) },
                                ]}
                            />
                        </Panel>
                    )}
                </div>
                {/* The copilot's endpoint is editor and up; check-in staff don't see it. */}
                {can.edit && (
                <Panel title={t('Sales insights')} id="copilot" className="self-start">
                    <p className="mb-4 text-sm text-muted">{t('Answers come from your own numbers. Suggested actions only run when you confirm them.')}</p>
                    <AskInsightsCard />
                    {nextEvent && <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{t('Actions apply to :title.', { title: nextEvent.title })}</p>}
                </Panel>
                )}
            </div>
        </InsightsAgentProvider>
    );
}

Overview.layout = dashLayout;
