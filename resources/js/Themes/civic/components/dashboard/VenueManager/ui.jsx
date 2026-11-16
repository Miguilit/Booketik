import { Link } from '@inertiajs/react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

export const inputClass = 'w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10 disabled:opacity-60';
export const primaryClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';
export const secondaryClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-raised disabled:opacity-40';

export function Panel({ title, action, description, children, className = '' }) {
    return <section className={`overflow-hidden rounded-2xl border border-line bg-surface ${className}`}>
        {(title || action) && <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-5 sm:px-6">
            <div><h2 className="font-display text-lg font-bold text-ink">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>{action}
        </div>}
        <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>;
}

export function Status({ children, tone = 'neutral' }) {
    const look = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : tone === 'attention' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-line bg-raised text-muted';
    return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${look}`}>{children}</span>;
}

export function Empty({ icon: Icon, title, text, action }) {
    return <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-bg p-6 sm:p-9">
        {Icon && <span className="rounded-xl bg-raised p-3 text-ink"><Icon className="h-6 w-6"/></span>}
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        <p className="max-w-xl text-sm leading-relaxed text-muted">{text}</p>
        {action}
    </div>;
}

export function ActionLink({ href, children }) {
    return <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-link hover:underline">{children}<ArrowUpRight className="h-4 w-4"/></Link>;
}

export function RoomRow({ room, href, selected = false }) {
    return <Link href={href} aria-current={selected ? 'page' : undefined} className={`flex items-center gap-4 rounded-xl border p-4 transition hover:border-ink/40 hover:bg-raised ${selected ? 'border-ink bg-raised' : 'border-line'}`}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tint-2 font-display text-lg font-bold text-on-tint-2">{(room.name || 'S').slice(0, 1).toUpperCase()}</span>
        <span className="min-w-0 flex-1"><span className="block truncate font-bold text-ink">{room.name}</span><span className="block truncate text-xs text-muted">{room.city || room.address || 'Adresse à compléter'} · {room.seat_count || 0} sièges configurés</span></span>
        <Status tone={room.layout_revision ? 'success' : 'attention'}>{room.layout_revision ? `Plan v${room.layout_revision}` : 'Plan à créer'}</Status>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted"/>
    </Link>;
}
