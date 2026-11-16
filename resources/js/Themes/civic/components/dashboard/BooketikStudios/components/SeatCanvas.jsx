import { useMemo, useState } from 'react';

export default function SeatCanvas({ plan, availability = {}, onPick, activeIds = [], readOnly = false }) {
    const [zoom, setZoom] = useState(1);
    const [focused, setFocused] = useState(null);
    const zones = useMemo(() => Object.fromEntries((plan?.zones || []).map(z => [z.id, z])), [plan]);
    if (!plan?.canvas || !plan.stage) return <p>Plan indisponible</p>;
    const w = plan.canvas.width, h = plan.canvas.height;
    const choose = seat => { if (readOnly || availability[seat.id] && availability[seat.id] !== 'available') return; setFocused(seat.id); onPick?.(seat); };
    return (
        <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{plan.seats.length} places</span>
                <div className="flex gap-2">
                    <button type="button" aria-label="Dézoomer" onClick={() => setZoom(v => Math.max(.55, v - .2))} className="rounded-lg border border-line bg-surface px-3 py-1 text-ink">−</button>
                    <button type="button" onClick={() => setZoom(1)} className="rounded-lg border border-line bg-surface px-3 py-1 text-ink">{Math.round(zoom * 100)} %</button>
                    <button type="button" aria-label="Zoomer" onClick={() => setZoom(v => Math.min(3, v + .2))} className="rounded-lg border border-line bg-surface px-3 py-1 text-ink">+</button>
                </div>
            </div>
            <div className="overflow-auto rounded-xl border border-line bg-white" style={{ maxHeight: 620 }}>
                <svg width="100%" viewBox={`0 0 ${w / zoom} ${h / zoom}`} role="group" aria-label="Plan interactif de salle" style={{ minWidth: 340, display: 'block' }}>
                    <rect width={w} height={h} fill="#F5F8F8" />
                    <rect x={plan.stage.x} y={plan.stage.y} width={plan.stage.width} height={plan.stage.height} rx="14" fill="#203B38" />
                    <text x={plan.stage.x + plan.stage.width / 2} y={plan.stage.y + plan.stage.height / 2 + 9} textAnchor="middle" fill="#FFFFFF" fontWeight="700" fontSize="27">{plan.stage.label}</text>
                    {(plan.seats || []).map(seat => {
                        const status = availability[seat.id] || 'available';
                        const off = status !== 'available';
                        const selected = activeIds.includes(seat.id) || focused === seat.id;
                        const color = off ? status === 'held' ? '#E2AA50' : '#B6BFC3' : zones[seat.zone_id]?.color || '#32675A';
                        return (
                            <g key={seat.id} role="button" tabIndex={readOnly || off ? -1 : 0} aria-label={`Rang ${seat.row}, place ${seat.number} — ${zones[seat.zone_id]?.label || ''}${off ? ' — ' + status : ''}`} aria-disabled={readOnly || off}
                                onClick={() => choose(seat)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(seat); } }} style={{ cursor: readOnly || off ? 'default' : 'pointer' }}>
                                <circle cx={seat.x} cy={seat.y} r="17" fill={color} stroke={selected ? '#112923' : '#FFFFFF'} strokeWidth={selected ? 5 : 3} />
                                {seat.accessible && <text x={seat.x} y={seat.y + 5} fontSize="14" fill="#FFFFFF" fontWeight="700" textAnchor="middle">♿</text>}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
                {plan.zones.map(z => <span key={z.id} className="inline-flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: z.color }} />{z.label}</span>)}
                <span>Gris : indisponible</span>
            </div>
        </div>
    );
}
