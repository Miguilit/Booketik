/*
 | Dashboard charts, plain SVG/HTML: a funnel, a bar list and the sales
 | velocity line. Colours are the validated pair in theme.css (.cv-chart);
 | text stays in ink tokens; thin marks, recessive grid, one axis, a hover
 | read-out on every mark and a table view for every chart.
 */
import { useMemo, useState } from 'react';
import { t } from '@/Core/i18n';
import { formatCount } from '@/Core/format';
import { cn } from '../ui';

/** Views → checkout → paid → tickets → checked in, each with its step conversion (`noRate` for a step that is not a subset of the one before, like tickets per order). */
export function Funnel({ steps, className }) {
    const max = Math.max(1, ...steps.map((s) => s.value));
    return (
        <ol className={cn('cv-chart space-y-2.5', className)} aria-label={t('Funnel')}>
            {steps.map((s, i) => {
                const prev = i > 0 ? steps[i - 1].value : null;
                const ratio = prev && !s.noRate ? s.value / prev : null;
                // Over 100% means the earlier step was not counted for every guest (app sales skip the web page view) — no rate then.
                const rate = ratio !== null && ratio <= 1 ? ratio : null;
                return (
                    <li key={s.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3" title={`${s.label}: ${formatCount(s.value)}${rate !== null ? ` (${Math.round(rate * 100)}%)` : ''}`}>
                        <span className="truncate text-sm font-semibold text-ink">{s.label}</span>
                        <span className="h-3 rounded-e-[4px] bg-raised" aria-hidden="true">
                            <span className="block h-3 rounded-e-[4px]" style={{ width: `${Math.max(1.5, (s.value / max) * 100)}%`, background: 'var(--chart-1)' }} />
                        </span>
                        <span className="w-24 text-end font-mono text-sm tabular-nums text-ink">
                            {formatCount(s.value)}
                            {rate !== null && <span className="ms-1.5 text-muted">{Math.round(rate * 100)}%</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

/** Labelled horizontal bars (attribution, revenue by tier). */
export function BarList({ items, format = formatCount, empty, label }) {
    if (!items?.length) return <p className="text-sm text-muted">{empty ?? t('Nothing to show yet.')}</p>;
    const max = Math.max(1, ...items.map((i) => i.value));
    return (
        <ul className="cv-chart space-y-2" aria-label={label}>
            {items.map((item) => (
                <li key={item.label} className="group" title={`${item.label}: ${format(item.value)}`}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-ink">{item.label}</span>
                        <span className="font-mono tabular-nums text-ink">{format(item.value)}</span>
                    </div>
                    <span className="mt-1 block h-2 rounded-e-[4px] bg-raised" aria-hidden="true">
                        <span className="block h-2 rounded-e-[4px] transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(1.5, (item.value / max) * 100)}%`, background: 'var(--chart-1)' }} />
                    </span>
                </li>
            ))}
        </ul>
    );
}

/**
 * Cumulative tickets by day before the start: this event (solid) against
 * the mean of the organizer's last past events (dashed). Hover or focus
 * moves a crosshair with both values; "Show table" lists every day.
 */
export function VelocityChart({ velocity }) {
    const [hover, setHover] = useState(null);
    const [table, setTable] = useState(false);
    const { days = [], this_event: mine = [], previous } = velocity ?? {};
    const W = 640;
    const H = 220;
    const pad = { l: 40, r: 12, t: 12, b: 26 };

    const max = useMemo(() => Math.max(4, ...mine.filter((v) => v !== null), ...(previous ?? [])), [mine, previous]);
    const x = (i) => pad.l + (i / Math.max(1, days.length - 1)) * (W - pad.l - pad.r);
    const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
    const path = (values) => values.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(' ');
    const ticks = [0, Math.round(max / 2), max];

    if (!days.length) return null;

    return (
        <div className="cv-chart">
            <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-ink">
                <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5" style={{ background: 'var(--chart-1)' }} aria-hidden="true" />{t('This event')}</span>
                {previous && (
                    <span className="inline-flex items-center gap-2">
                        <svg width="20" height="4" aria-hidden="true"><line x1="0" y1="2" x2="20" y2="2" stroke="var(--chart-2)" strokeWidth="2" strokeDasharray="4 3" /></svg>
                        {t('Your last :count events (average)', { count: velocity.previous_count })}
                    </span>
                )}
                <button type="button" onClick={() => setTable((v) => !v)} className="ms-auto text-sm font-semibold text-link hover:underline">{table ? t('Show chart') : t('Show table')}</button>
            </div>
            {table ? (
                <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-start font-mono text-[11px] uppercase tracking-wider text-muted"><th className="py-1 text-start">{t('Day')}</th><th className="text-end">{t('This event')}</th>{previous && <th className="text-end">{t('Previous')}</th>}</tr></thead>
                        <tbody>{days.map((d, i) => (
                            <tr key={d} className="border-t border-line"><td className="py-1 font-mono">{d === 0 ? t('Event day') : t(':n days before', { n: -d })}</td><td className="text-end font-mono">{mine[i] ?? '—'}</td>{previous && <td className="text-end font-mono">{previous[i]}</td>}</tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : (
                <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t('Tickets sold over time, compared with your previous events')}
                    onMouseLeave={() => setHover(null)}
                    onMouseMove={(e) => {
                        const box = e.currentTarget.getBoundingClientRect();
                        const px = ((e.clientX - box.left) / box.width) * W;
                        setHover(Math.max(0, Math.min(days.length - 1, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (days.length - 1)))));
                    }}>
                    {ticks.map((v) => (
                        <g key={v}>
                            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" strokeWidth="1" />
                            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" className="fill-[rgb(var(--s-muted))] font-mono text-[11px]">{v}</text>
                        </g>
                    ))}
                    {[0, Math.floor(days.length / 2), days.length - 1].map((i) => (
                        <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'} className="fill-[rgb(var(--s-muted))] font-mono text-[11px]">
                            {days[i] === 0 ? t('Event day') : t(':n days before', { n: -days[i] })}
                        </text>
                    ))}
                    {previous && <polyline points={path(previous)} fill="none" stroke="var(--chart-2)" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />}
                    <polyline points={path(mine)} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" />
                    {hover !== null && (
                        <g>
                            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgb(var(--s-edge))" strokeWidth="1" />
                            {mine[hover] !== null && <circle cx={x(hover)} cy={y(mine[hover])} r="4" fill="var(--chart-1)" stroke="rgb(var(--s-surface))" strokeWidth="2" />}
                            {previous && <circle cx={x(hover)} cy={y(previous[hover])} r="4" fill="var(--chart-2)" stroke="rgb(var(--s-surface))" strokeWidth="2" />}
                        </g>
                    )}
                </svg>
            )}
            {!table && hover !== null && (
                <p className="mt-1 font-mono text-sm text-ink" aria-live="polite">
                    {days[hover] === 0 ? t('Event day') : t(':n days before', { n: -days[hover] })}: {t('this event')} {mine[hover] ?? '—'}{previous ? ` · ${t('previous')} ${previous[hover]}` : ''}
                </p>
            )}
        </div>
    );
}
