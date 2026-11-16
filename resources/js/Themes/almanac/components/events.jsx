/*
 | Almanac event listings — set like a printed programme: serif titles, the
 | date as an italic line or a margin dateline, hairline rules between
 | entries. Every time carries its zone (eventWhen).
 */
import { Link } from '@inertiajs/react';
import { BadgeCheck, MapPin, Users } from 'lucide-react';
import { availabilityTag, displayPrice, eventPath, eventWhen, priceLabel, venueLine } from '@/Core/events';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { cn, Dateline, Img, Tag } from './ui';

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
    return <span className={cn('font-mono text-sm text-ink', className)}>{label}</span>;
}

export function When({ when, className }) {
    if (!when) return null;
    return (
        <p className={cn('font-display text-[17px] italic text-link', className)}>
            {when.date}, {when.time} <span className="font-mono text-xs not-italic text-muted">{when.zone}</span>
        </p>
    );
}

/** The standard entry: image, italic date, title, place, price. */
export function EventCard({ event, priority = false, sizes = '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw', className, sticker = false }) {
    const href = useHref(event);
    const when = eventWhen(event);
    const venue = venueLine(event);

    return (
        <article className={cn('group relative flex h-full flex-col', className)}>
            <div className={cn('relative overflow-hidden rounded-card bg-raised', sticker && 'shadow-key')}>
                <Img image={event.cover} alt="" sizes={sizes} priority={priority} className="aspect-[4/3] w-full" ratio={3 / 4} />
                <div className="absolute end-3 top-3">{event.external ? <><Tag tone="info">{t('External event')}</Tag>{event.availability === 'sold_out' && <Availability event={event} />}</> : <Availability event={event} />}</div>
            </div>
            <div className="mt-3 flex flex-1 flex-col">
                <When when={when} />
                <h3 className="mt-0.5 font-display text-[24px] leading-[1.1] text-ink">
                    <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                        <span className="line-clamp-2 decoration-1 underline-offset-4 group-hover:underline">{event.title}</span>
                    </Link>
                </h3>
                {venue && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{venue}</span>
                    </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5">
                    <Price price={event.price} external={Boolean(event.external)} />
                    {event.friends_going?.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-success"><Users className="h-3.5 w-3.5" aria-hidden="true" />{t(':count friends', { count: event.friends_going.length })}</span>
                    ) : event.going_count > 0 ? (
                        <span className="text-xs text-muted">{t(':count going', { count: event.going_count })}</span>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

/** A programme line: the dateline in the margin, then title, time, place, price. */
export function ProgrammeRow({ event, showDate = true, className }) {
    const href = useHref(event);
    const when = eventWhen(event);
    const venue = venueLine(event);

    return (
        <article className={cn('group relative flex gap-4 border-b border-line py-4 last:border-0', className)}>
            {showDate ? <Dateline when={when} /> : <span className="w-[68px] shrink-0 border-e border-line pe-3 text-end font-mono text-sm text-ink">{when?.time}</span>}
            <div className="min-w-0 flex-1">
                <h3 className="font-display text-[22px] leading-[1.15] text-ink">
                    <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                        <span className="decoration-1 underline-offset-4 group-hover:underline">{event.title}</span>
                    </Link>
                </h3>
                <p className="mt-0.5 font-mono text-xs text-muted">{when?.time}{when?.endTime ? `–${when.endTime}` : ''} {when?.zone}{venue ? ` · ${venue}` : ''}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Price price={event.price} external={Boolean(event.external)} className="text-xs" />
                    {event.external ? <><Tag tone="info">{t('External event')}</Tag>{event.availability === 'sold_out' && <Availability event={event} />}</> : <Availability event={event} />}
                    {event.category && <span className="font-display text-sm italic text-muted">{event.category.name}</span>}
                </div>
            </div>
            <Img image={event.cover} alt="" sizes="112px" className="hidden h-[84px] w-[112px] shrink-0 rounded-sm xs:block" ratio={0.75} />
        </article>
    );
}

/** Compact row (grid3 / list / ranked). */
export function EventRow({ event, rank, className }) {
    const href = useHref(event);
    const when = eventWhen(event);
    const venue = venueLine(event);

    return (
        <article className={cn('group relative flex items-center gap-3.5 py-3', className)}>
            {rank != null && (
                <span className="w-9 shrink-0 text-center font-display text-[40px] italic leading-none text-link tabular-nums" aria-hidden="true">{rank}</span>
            )}
            <Img image={event.cover} alt="" sizes="80px" className="h-[68px] w-[68px] shrink-0 rounded-sm" ratio={1} />
            <div className="min-w-0 flex-1">
                <h3 className="font-display text-[19px] leading-tight text-ink">
                    <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                        <span className="line-clamp-2 group-hover:underline">{event.title}</span>
                    </Link>
                </h3>
                {when && <p className="mt-0.5 font-display text-sm italic text-link">{when.date}, {when.time} <span className="font-mono text-[11px] not-italic text-muted">{when.zone}</span></p>}
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    {venue && <span className="truncate">{venue}</span>}
                    <Price price={event.price} external={Boolean(event.external)} className="ms-auto shrink-0 text-xs" />
                </div>
            </div>
        </article>
    );
}

/** A plate: 2:3 image with an italic caption below. */
export function PosterCard({ event, className }) {
    const href = useHref(event);
    const when = eventWhen(event);
    return (
        <article className={cn('group relative', className)}>
            <div className="relative overflow-hidden rounded-card bg-raised shadow-key">
                <Img image={event.cover} alt="" sizes="(min-width: 1024px) 22vw, 60vw" className="aspect-[2/3] w-full" ratio={1.5} />
                <div className="absolute end-3 top-3">{event.external ? <><Tag tone="info">{t('External event')}</Tag>{event.availability === 'sold_out' && <Availability event={event} />}</> : <Availability event={event} />}</div>
            </div>
            <p className="mt-3 font-display text-[15px] italic text-link">{when?.date}, {when?.time} <span className="font-mono text-[11px] not-italic text-muted">{when?.zone}</span></p>
            <h3 className="font-display text-[21px] leading-tight text-ink">
                <Link href={href} className="after:absolute after:inset-0 after:content-['']"><span className="line-clamp-2 group-hover:underline">{event.title}</span></Link>
            </h3>
        </article>
    );
}

/** A tiny line for map sheets and calendars. */
export function EventMini({ event, className }) {
    const href = useHref(event);
    const when = eventWhen(event);
    return (
        <Link href={href} className={cn('block rounded-sm px-2 py-1.5 text-start hover:bg-raised', className)}>
            <span className="block truncate font-display text-[16px] text-ink">{event.title}</span>
            <span className="block font-mono text-[11px] text-muted">{when?.time} {when?.zone} · {displayPrice(event) ?? priceLabel(event.price ?? { is_free: event.is_free, min: event.price_from })}</span>
        </Link>
    );
}

export function OrganizerChip({ organizer, className }) {
    const url = useRoute();
    return (
        <Link href={url(`/o/${organizer.slug}`)} className={cn('inline-flex items-center gap-1.5 font-display text-[17px] italic text-ink hover:underline', className)}>
            {t('by :name', { name: organizer.name })}
            {organizer.is_verified && <BadgeCheck className="h-4 w-4 text-success" aria-label={t('Verified organizer')} />}
        </Link>
    );
}

export function EventGrid({ events, className, priorityFirst = 0 }) {
    return (
        <ul className={cn('grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3', className)}>
            {events.map((event, i) => (
                <li key={event.id}><EventCard event={event} priority={i < priorityFirst} /></li>
            ))}
        </ul>
    );
}
