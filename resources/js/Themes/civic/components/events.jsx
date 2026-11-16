/*
 | Event cards — one per collection layout (Core home layouts).
 | Each reads an EventSummary; dates are in the event's zone with its label.
 */
import { Link } from '@inertiajs/react';
import { BadgeCheck, MapPin, Users } from 'lucide-react';
import { availabilityTag, displayPrice, eventPath, eventWhen, priceLabel, venueLine } from '@/Core/events';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { cn, DateStamp, Img, Tag } from './ui';

function useHref(event) {
    const url = useRoute();
    return url(eventPath(event.slug));
}

export function Availability({ event, className }) {
    const tag = availabilityTag(event.availability);
    if (!tag) return null;
    return <Tag tone={tag.tone} className={className}>{tag.label}</Tag>;
}

export function Price({ price, external = false, className }) {
    const label = priceLabel(price) ?? (external ? t('Price not provided') : null);
    if (!label) return null;
    return <span className={cn('font-mono text-sm font-medium text-ink', className)}>{label}</span>;
}

function Meta({ event, when }) {
    return (
        <p className="mt-1 font-mono text-[13px] text-muted">
            <span className="text-ink">{when.date}</span> · {when.time} <span className="text-muted">{when.zone}</span>
        </p>
    );
}

/** The standard card: cover, date stamp, title, when, where, price. */
export function EventCard({ event, priority = false, sizes = '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw', className, sticker = false }) {
    const href = useHref(event);
    const when = eventWhen(event);
    const venue = venueLine(event);

    return (
        <article className={cn('group relative flex h-full flex-col', className)}>
            <div className={cn('relative overflow-hidden rounded-card bg-raised', sticker ? 'border-key border-edge shadow-key' : 'border border-line')}>
                <Img image={event.cover} alt="" sizes={sizes} priority={priority} className="aspect-[3/2] w-full transition-transform duration-300 group-hover:scale-[1.02]" ratio={2 / 3} />
                <div className="absolute start-3 top-3">
                    <DateStamp when={when} />
                </div>
                <div className="absolute end-3 top-3 flex gap-1.5">
                    {event.external ? <><Tag tone="info">{t('External event')}</Tag>{event.availability === 'sold_out' && <Availability event={event} />}</> : <Availability event={event} />}
                </div>
            </div>
            <div className="mt-3 flex flex-1 flex-col px-0.5">
                <h3 className="font-display text-[19px] font-bold leading-snug tracking-[-0.01em] text-ink">
                    <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                        <span className="line-clamp-2 group-focus-within:underline">{event.title}</span>
                    </Link>
                </h3>
                {when && <Meta event={event} when={when} />}
                {venue && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{venue}</span>
                    </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                    <Price price={event.price} external={Boolean(event.external)} />
                    {event.friends_going?.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-link"><Users className="h-3.5 w-3.5" aria-hidden="true" />{t(':count friends', { count: event.friends_going.length })}</span>
                    ) : event.going_count > 0 ? (
                        <span className="text-xs text-muted">{t(':count going', { count: event.going_count })}</span>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

/** Compact row (grid3 / list layouts): 72px thumb, title, when, where, price. */
export function EventRow({ event, rank, className }) {
    const href = useHref(event);
    const when = eventWhen(event);
    const venue = venueLine(event);

    return (
        <article className={cn('group relative flex items-center gap-3.5 py-2.5', className)}>
            {rank != null && (
                <span className="w-9 shrink-0 text-center font-display text-[34px] font-extrabold leading-none text-ink/80 tabular-nums" aria-hidden="true">{rank}</span>
            )}
            <Img image={event.cover} alt="" sizes="80px" className="h-[72px] w-[72px] shrink-0 rounded-sm border border-line" ratio={1} />
            <div className="min-w-0 flex-1">
                <h3 className="font-semibold leading-snug text-ink">
                    <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                        <span className="line-clamp-2 group-hover:underline">{event.title}</span>
                    </Link>
                </h3>
                {when && <p className="mt-0.5 font-mono text-xs text-muted">{when.date} · {when.time} {when.zone}</p>}
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    {venue && <span className="truncate">{venue}</span>}
                    <Price price={event.price} external={Boolean(event.external)} className="ms-auto shrink-0 text-xs" />
                </div>
            </div>
        </article>
    );
}

/** 2:3 portrait with the date stamp (poster layout). */
export function PosterCard({ event, className }) {
    const href = useHref(event);
    const when = eventWhen(event);
    return (
        <article className={cn('group relative', className)}>
            <div className="relative overflow-hidden rounded-card border-key border-edge bg-raised shadow-key transition-transform group-hover:-translate-y-0.5">
                <Img image={event.cover} alt="" sizes="(min-width: 1024px) 22vw, 60vw" className="aspect-[2/3] w-full" ratio={1.5} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/90 via-scrim/60 to-transparent p-4 pt-16">
                    <p className="font-mono text-xs uppercase tracking-widest text-on-scrim/90">{when?.date} · {when?.time}</p>
                    <h3 className="mt-1 font-display text-xl font-bold leading-tight text-on-scrim">
                        <Link href={href} className="after:absolute after:inset-0 after:content-['']"><span className="line-clamp-3">{event.title}</span></Link>
                    </h3>
                </div>
                <div className="absolute end-3 top-3">{event.external ? <><Tag tone="info">{t('External event')}</Tag>{event.availability === 'sold_out' && <Availability event={event} />}</> : <Availability event={event} />}</div>
            </div>
        </article>
    );
}

/** A tiny line for map sheets and calendars. */
export function EventMini({ event, className }) {
    const href = useHref(event);
    const when = eventWhen(event);
    return (
        <Link href={href} className={cn('block rounded-sm px-2 py-1.5 text-start hover:bg-raised', className)}>
            <span className="block truncate text-sm font-semibold text-ink">{event.title}</span>
            <span className="block font-mono text-[11px] text-muted">{when?.time} {when?.zone} · {displayPrice(event) ?? priceLabel(event.price ?? { is_free: event.is_free, min: event.price_from })}</span>
        </Link>
    );
}

export function OrganizerChip({ organizer, className }) {
    const url = useRoute();
    return (
        <Link href={url(`/o/${organizer.slug}`)} className={cn('inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline', className)}>
            {organizer.name}
            {organizer.is_verified && <BadgeCheck className="h-4 w-4 text-link" aria-label={t('Verified organizer')} />}
        </Link>
    );
}

export function EventGrid({ events, className, priorityFirst = 0 }) {
    return (
        <ul className={cn('grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3', className)}>
            {events.map((event, i) => (
                <li key={event.id}><EventCard event={event} priority={i < priorityFirst} /></li>
            ))}
        </ul>
    );
}
