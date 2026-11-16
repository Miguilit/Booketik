import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CalendarX, MapPin, Repeat } from 'lucide-react';
import { accentStyle, eventPath, eventWhen, organizerPath, priceLabel, venueLine } from '@/Core/events';
import { useMode } from '@/Core/mode';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/civic/Layout';
import { Avatar, Button, Card, cn, Container, DateStamp, EmptyState, Img } from '@/Themes/civic/components/ui';
import { Availability, EventRow } from '@/Themes/civic/components/events';

/*
 | A recurring series (`/s/{id}`): the occurrences as pills; picking one
 | shows that date, and the full list of upcoming dates follows.
 */

function recurrence(rrule) {
    const parts = Object.fromEntries(String(rrule ?? '').replace(/^RRULE:/i, '').split(';').map((p) => p.split('=')));
    const days = {
        MO: t('Monday'), TU: t('Tuesday'), WE: t('Wednesday'), TH: t('Thursday'), FR: t('Friday'), SA: t('Saturday'), SU: t('Sunday'),
    };
    const byday = (parts.BYDAY ?? '').split(',').filter((d) => days[d]);
    if (parts.FREQ === 'WEEKLY' && byday.length === 1 && (!parts.INTERVAL || parts.INTERVAL === '1')) return t('Every :day', { day: days[byday[0]] });
    if (parts.FREQ === 'WEEKLY' && byday.length === 1 && parts.INTERVAL === '2') return t('Every other :day', { day: days[byday[0]] });
    if (parts.FREQ === 'DAILY') return t('Every day');
    if (parts.FREQ === 'MONTHLY') return t('Monthly');
    return t('Recurring');
}

export default function Series({ series, events = [], accent }) {
    const url = useRoute();
    const { dark } = useMode();
    const [selected, setSelected] = useState(events[0]?.id ?? null);
    const current = events.find((e) => e.id === selected) ?? events[0];
    const when = current ? eventWhen(current) : null;
    const venue = current ? venueLine(current) : null;
    const organizer = series.organizer;

    return (
        <div style={accentStyle(accent, dark)}>
            <Head title={series.title} />
            <Container className="pt-8 lg:pt-12">
                <p className="flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted">
                    <Repeat className="h-4 w-4" aria-hidden="true" />{recurrence(series.rrule)}
                </p>
                <h1 className="mt-2 font-display text-[40px] font-extrabold leading-[1.0] tracking-[-0.035em] text-ink sm:text-[56px]">{series.title}</h1>
                {organizer && (
                    <Link href={url(organizerPath(organizer.slug))} className="mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-ink hover:underline">
                        <Avatar image={organizer.avatar} name={organizer.name} size={32} />
                        {t('By :name', { name: organizer.name })}
                    </Link>
                )}

                {events.length === 0 ? (
                    <EmptyState className="mt-10" icon={CalendarX} title={t('No upcoming dates')} body={series.past_count ? t(':count past dates. Follow the organizer to hear about the next one.', { count: series.past_count }) : t('Follow the organizer to hear about the next one.')} />
                ) : (
                    <>
                        <section aria-labelledby="dates" className="mt-10">
                            <h2 id="dates" className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted">{t('Pick a date')}</h2>
                            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" role="list">
                                {events.map((e) => {
                                    const w = eventWhen(e);
                                    const on = e.id === current?.id;
                                    return (
                                        <button
                                            key={e.id}
                                            type="button"
                                            role="listitem"
                                            aria-current={on ? 'date' : undefined}
                                            onClick={() => setSelected(e.id)}
                                            className={cn('shrink-0 rounded-chip border-key px-4 py-2.5 font-mono text-sm transition-colors', on ? 'border-edge bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-edge', e.availability === 'sold_out' && !on && 'text-muted')}
                                        >
                                            {w.date} · {w.time}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {current && when && (
                            <Card sticker className="mt-6 grid overflow-hidden md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" aria-live="polite">
                                <Img image={current.cover} alt="" priority sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[3/2] h-full w-full" ratio={2 / 3} />
                                <div className="flex flex-col gap-4 p-6">
                                    <div className="flex items-start gap-4">
                                        <DateStamp when={when} size="lg" />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-ink">{when.long}</p>
                                            <p className="font-mono text-[15px] text-ink">{when.time}{when.endTime ? `–${when.endTime}` : ''} <span className="text-muted">{when.zone}</span></p>
                                            {when.relative && <p className="text-sm text-muted">{when.relative}</p>}
                                        </div>
                                    </div>
                                    <h2 className="font-display text-2xl font-bold leading-tight text-ink">{current.title}</h2>
                                    {venue && <p className="flex items-center gap-1.5 text-[15px] text-body"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />{venue}</p>}
                                    <div className="flex items-center gap-3">
                                        {priceLabel(current.price) && <span className="font-mono text-[15px] font-medium text-ink">{priceLabel(current.price)}</span>}
                                        <Availability event={current} />
                                    </div>
                                    <Button variant="accent" className="mt-auto self-start" href={url(eventPath(current.slug))} trailing={ArrowRight}>{t('View date')}</Button>
                                </div>
                            </Card>
                        )}

                        <section aria-labelledby="all-dates" className="mt-12">
                            <h2 id="all-dates" className="font-display text-2xl font-bold text-ink">{t('All upcoming dates')}</h2>
                            <div className="mt-4 divide-y divide-line rounded-card border border-line bg-surface px-4">
                                {events.map((e) => <EventRow key={e.id} event={e} />)}
                            </div>
                            {series.past_count > 0 && <p className="mt-3 text-sm text-muted">{t(':count past dates', { count: series.past_count })}</p>}
                        </section>
                    </>
                )}
            </Container>
        </div>
    );
}

Series.layout = layout;
