import { Link } from '@inertiajs/react';
import { ArrowRight, MapPin } from 'lucide-react';
import { eventWhen, venueLine } from '@/Core/events';
import { ticketStatusLabel } from '@/Core/tickets';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { cn, DateStamp, Img, Tag } from '@/Themes/civic/components/ui';

const STATUS_TONE = { valid: 'success', checked_in: 'info', refunded: 'muted', transferred: 'muted', void: 'danger' };

/** Every ticket a viewer holds for one event, as a ticket stub with a perforated edge. */
export default function TicketGroup({ event, tickets, past = false }) {
    const url = useRoute();
    const when = eventWhen(event);
    const venue = venueLine(event);

    return (
        <article className={cn('overflow-hidden rounded-card border-key border-edge bg-surface', !past && 'shadow-key')}>
            <div className="flex gap-4 p-4 sm:p-5">
                <div className="relative shrink-0">
                    <Img image={event.cover} alt="" sizes="112px" className={cn('h-24 w-24 rounded-sm border border-line sm:h-28 sm:w-28', past && 'grayscale')} ratio={1} />
                    <div className="absolute -bottom-2 -end-2 hidden sm:block"><DateStamp when={when} /></div>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl font-bold leading-snug text-ink">{event.title}</h3>
                    {when && <p className="mt-1 font-mono text-[13px] text-ink">{when.date} · {when.time} <span className="text-muted">{when.zone}</span>{when.relative && !past ? <span className="text-muted"> · {when.relative}</span> : null}</p>}
                    {venue && <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{venue}</span></p>}
                </div>
            </div>
            {/* The perforation: two notches and a dashed rule, like a stub. */}
            <div className="relative" aria-hidden="true">
                <span className="absolute -start-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-key border-edge bg-bg" />
                <span className="absolute -end-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-key border-edge bg-bg" />
                <div className="mx-5 border-t-2 border-dashed border-line" />
            </div>
            <ul className="divide-y divide-line">
                {tickets.map((ticket) => (
                    <li key={ticket.code}>
                        <Link href={url(`/t/${ticket.code}`)} className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-raised">
                            <span className="font-mono text-[15px] font-medium tracking-wider text-ink">{ticket.code}</span>
                            <span className="text-sm text-body">{ticket.ticket_type?.name}</span>
                            {ticket.holder?.name && <span className="text-sm text-muted">{ticket.holder.name}</span>}
                            <span className="ms-auto flex items-center gap-2">
                                <Tag tone={STATUS_TONE[ticket.status] ?? 'neutral'}>{ticketStatusLabel(ticket.status)}</Tag>
                                <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                                <span className="sr-only">{t('Open ticket')}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </article>
    );
}

/** Tickets grouped by their event, in the order they came. */
export function groupByEvent(tickets) {
    const groups = [];
    const index = new Map();
    for (const ticket of tickets ?? []) {
        const key = ticket.event?.id ?? ticket.code;
        if (!index.has(key)) {
            index.set(key, groups.length);
            groups.push({ event: ticket.event, tickets: [] });
        }
        groups[index.get(key)].tickets.push(ticket);
    }
    return groups;
}
