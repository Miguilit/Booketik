/*
 | The dashboard's pieces, on top of the Civic kit (../ui.jsx): page heads,
 | stat tiles, tables, status pills, confirm dialogs and the money / time
 | inputs. Charts are in ./charts.jsx.
 */
import { useId, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Info } from 'lucide-react';
import { t } from '@/Core/i18n';
import { inputToMinor, minorToInput, toZonedInput, fromZonedInput } from '@/Core/dashboard';
import { currencyExponent } from '@/Core/format';
import { Button, Card, cn, FIELD, Modal, Notice, Tag } from '../ui';

export function PageHead({ eyebrow, title, subtitle, actions, className }) {
    return (
        <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
            <div className="min-w-0">
                {eyebrow && <p className="mb-1 font-mono text-xs uppercase tracking-[0.16em] text-muted">{eyebrow}</p>}
                <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[38px]">{title}</h1>
                {subtitle && <p className="mt-1 max-w-2xl text-[15px] text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

/** A bento tile: a label, one big number, an optional note and link. */
export function StatTile({ label, value, note, href, tone, className, children }) {
    const body = (
        <>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
            <p className={cn('mt-2 break-words font-display text-[24px] font-extrabold leading-none sm:text-[34px] tracking-[-0.03em] tabular-nums', tone === 'warn' ? 'text-warning' : 'text-ink')}>{value}</p>
            {note && <p className="mt-2 text-sm text-muted">{note}</p>}
            {children}
            {href && <ArrowUpRight className="absolute end-4 top-4 h-4 w-4 text-muted" aria-hidden="true" />}
        </>
    );
    const cls = cn('relative block min-w-0 rounded-card border border-line bg-surface p-4 sm:p-5', href && 'transition-colors hover:border-edge', className);
    return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** A hairline panel with a heading row. */
export function Panel({ title, action, children, className, bodyClass, id }) {
    return (
        <Card className={cn('min-w-0', className)} aria-labelledby={id}>
            {(title || action) && (
                <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                    {title && <h2 id={id} className="font-display text-[19px] font-bold text-ink">{title}</h2>}
                    {action}
                </div>
            )}
            <div className={cn('p-5', bodyClass)}>{children}</div>
        </Card>
    );
}

const PILL = {
    draft: 'muted', upcoming: 'info', live: 'success', ended: 'neutral', cancelled: 'danger', postponed: 'warn',
    pending: 'warn', approved: 'success', going: 'success', attended: 'success', declined: 'muted', waitlisted: 'info',
    requested: 'warn', refunded: 'neutral', rejected: 'muted', paid: 'success', in_transit: 'info', failed: 'danger',
    published: 'success', scheduled: 'info',
};

export function StatusPill({ status, label }) {
    return <Tag tone={PILL[status] ?? 'neutral'}>{label ?? statusLabel(status)}</Tag>;
}

export function statusLabel(status) {
    return {
        draft: t('Draft'), upcoming: t('Upcoming'), live: t('Live now'), ended: t('Ended'), cancelled: t('Cancelled'), postponed: t('Postponed'),
        pending: t('Pending'), approved: t('Approved'), going: t('Going'), attended: t('Attended'), declined: t('Declined'), waitlisted: t('Waitlist'),
        requested: t('Requested'), refunded: t('Refunded'), rejected: t('Rejected'), paid: t('Paid'), in_transit: t('On its way'), failed: t('Failed'),
        published: t('Published'), scheduled: t('Scheduled'),
    }[status] ?? status;
}

/** A responsive table: real `<table>` from sm up, stacked rows below. */
export function Table({ columns, rows, rowKey = (r) => r.id, empty, caption, onRowClick, activeKey }) {
    if (!rows?.length) return empty ?? null;
    return (
        <div className="-mx-5 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-full border-collapse text-[15px]">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead className="hidden sm:table-header-group">
                    <tr className="border-b border-line text-start">
                        {columns.map((c) => (
                            <th key={c.key} scope="col" className={cn('px-3 py-2.5 text-start font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted', c.className, c.align === 'end' && 'text-end')}>{c.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const key = rowKey(row);
                        return (
                            <tr
                                key={key}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={cn('block border-b border-line px-5 py-3 last:border-0 sm:table-row sm:px-0 sm:py-0', onRowClick && 'cursor-pointer hover:bg-raised/60', activeKey === key && 'bg-tint/50')}
                            >
                                {columns.map((c) => (
                                    <td key={c.key} className={cn('block py-0.5 align-middle sm:table-cell sm:px-3 sm:py-3', c.align === 'end' && 'sm:text-end', c.cellClass)}>
                                        {c.label && !c.hideLabel && <span className="me-2 font-mono text-[11px] uppercase tracking-wider text-muted sm:hidden">{c.label}</span>}
                                        {c.render ? c.render(row) : row[c.key]}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/** Confirm before something that cannot be taken back. */
export function ConfirmDialog({ open, onClose, title, children, confirmLabel, onConfirm, busy, tone = 'danger', disabled }) {
    return (
        <Modal open={open} onClose={onClose} title={title} footer={(
            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>{t('Keep it')}</Button>
                <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={busy} disabled={disabled} onClick={onConfirm}>{confirmLabel}</Button>
            </div>
        )}>
            <div className="space-y-3 text-[15px] text-body">{children}</div>
        </Modal>
    );
}

/** A price in the currency's own decimals, kept as minor units outside. */
export function MoneyInput({ value, onChange, currency = 'EUR', id, invalid, ...rest }) {
    const [text, setText] = useState(() => minorToInput(value, currency));
    const exp = currencyExponent(currency);
    return (
        <div className="relative">
            <input
                id={id}
                inputMode="decimal"
                className={cn(FIELD, 'pe-14 font-mono tabular-nums', invalid && 'border-danger')}
                value={text}
                onChange={(e) => { setText(e.target.value); onChange(inputToMinor(e.target.value, currency)); }}
                onBlur={() => setText(minorToInput(inputToMinor(text, currency), currency))}
                placeholder={(0).toFixed(exp)}
                aria-invalid={invalid || undefined}
                {...rest}
            />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">{currency}</span>
        </div>
    );
}

/** A wall-clock time in the event's zone, labelled with that zone. */
export function ZonedDateTime({ value, onChange, timeZone, id, invalid, ...rest }) {
    return (
        <div>
            <input
                id={id}
                type="datetime-local"
                className={cn(FIELD, 'font-mono tabular-nums', invalid && 'border-danger')}
                value={toZonedInput(value, timeZone)}
                onChange={(e) => onChange(fromZonedInput(e.target.value, timeZone))}
                aria-invalid={invalid || undefined}
                {...rest}
            />
            <p className="mt-1 font-mono text-xs text-muted">{timeZone}</p>
        </div>
    );
}

/** A small "why" line under a heading. */
export function Hint({ children }) {
    return (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{children}</span>
        </p>
    );
}

/** Wraps a field the AI was unsure of until the organizer edits it. */
export function DoubtMark({ doubtful, children }) {
    if (!doubtful) return children;
    return (
        <div className="rounded-sm bg-tint-2/60 p-2 ring-2 ring-warning/60">
            {children}
            <p className="mt-1.5 text-xs font-semibold text-on-tint-2">{t('Check this — the draft was not sure. Editing it clears the mark.')}</p>
        </div>
    );
}

export function ReadOnlyNotice({ children }) {
    return <Notice tone="info" className="mb-5">{children ?? t('Your role can see this but not change it.')}</Notice>;
}

/** An id helper for label/input pairs inside loops. */
export function useFieldId(prefix) {
    const id = useId();
    return (name) => `${prefix}-${name}-${id}`;
}
