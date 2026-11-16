import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarMonth } from '@/Core/discover';
import { eventPath, eventWhen } from '@/Core/events';
import { useRoute } from '@/Core/site';
import { pageLang, t } from '@/Core/i18n';
import { Button, cn, IconButton, Skeleton } from '../ui';

function DayChip({ event }) {
    const url = useRoute();
    const when = eventWhen(event);
    return (
        <Link href={url(eventPath(event.slug))} className="block truncate rounded-[6px] bg-raised px-1.5 py-0.5 text-[12px] leading-snug text-ink hover:bg-tint hover:text-on-tint" title={event.title}>
            <span className="font-mono text-[11px] text-muted">{when?.time}</span> {event.title}
        </Link>
    );
}

/** A Monday-first month; on phones, an agenda of the days that have events. */
export default function CalendarView({ filters, category }) {
    const url = useRoute();
    const cal = useCalendarMonth(filters, category);
    const days = cal.weeks.flat().filter((d) => d.inMonth && d.events.length);

    return (
        <section aria-label={t('Calendar')}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl capitalize text-ink" aria-live="polite">{cal.label}</h2>
                <div className="flex items-center gap-2">
                    <IconButton label={t('Previous month')} icon={ChevronLeft} variant="secondary" className="rtl:rotate-180" onClick={cal.prev} />
                    <Button variant="secondary" size="sm" onClick={cal.thisMonth}>{t('Today')}</Button>
                    <IconButton label={t('Next month')} icon={ChevronRight} variant="secondary" className="rtl:rotate-180" onClick={cal.next} />
                </div>
            </div>

            {/* Desktop and tablet: the grid. */}
            <div className="hidden overflow-hidden rounded-card border border-line bg-surface md:block">
                <div className="grid grid-cols-7 border-b border-line bg-raised">
                    {cal.weekdays.map((d) => (
                        <div key={d} className="px-2 py-2 text-center font-mono text-xs uppercase tracking-widest text-muted">{d}</div>
                    ))}
                </div>
                {cal.weeks.map((week, i) => (
                    <div key={i} className="grid grid-cols-7 border-b border-line last:border-0">
                        {week.map((day) => (
                            <div key={day.ymd} className={cn('min-h-[112px] border-e border-line p-1.5 last:border-e-0', !day.inMonth && 'bg-raised/50')}>
                                <span
                                    className={cn(
                                        'mb-1 inline-flex h-7 min-w-7 items-center justify-center rounded-chip px-1.5 font-mono text-sm',
                                        day.today ? 'bg-cta font-medium text-on-cta' : day.inMonth ? 'text-ink' : 'text-muted',
                                    )}
                                    aria-current={day.today ? 'date' : undefined}
                                >
                                    {day.day}
                                </span>
                                <div className="space-y-0.5">
                                    {cal.loading ? null : day.events.slice(0, 3).map((e) => <DayChip key={e.id} event={e} />)}
                                    {day.events.length > 3 && (
                                        <Link href={url(`/discover?date=range&from=${day.ymd}&to=${day.ymd}`)} className="block px-1.5 text-[12px] font-semibold text-link">
                                            {t('+:count more', { count: day.events.length - 3 })}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Phones: an agenda. */}
            <div className="md:hidden">
                {cal.loading ? (
                    <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : days.length ? (
                    <ol className="space-y-4">
                        {days.map((day) => (
                            <li key={day.ymd} className="rounded-card border border-line bg-surface p-3">
                                <p className={cn('mb-2 font-mono text-sm', day.today ? 'font-medium text-ink' : 'text-muted')}>
                                    {new Intl.DateTimeFormat(pageLang(), { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(`${day.ymd}T12:00:00`))}
                                    {day.today ? ` · ${t('Today')}` : ''}
                                </p>
                                <div className="space-y-1">{day.events.map((e) => <DayChip key={e.id} event={e} />)}</div>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="rounded-card border border-dashed border-line px-4 py-10 text-center text-sm text-muted">{t('Nothing listed this month.')}</p>
                )}
            </div>
            {!cal.loading && <p className="mt-3 text-sm text-muted">{t(':count events this month', { count: cal.count })}</p>}
        </section>
    );
}
