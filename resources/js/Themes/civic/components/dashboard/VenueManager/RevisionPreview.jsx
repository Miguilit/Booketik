import { useId } from 'react';

export function comparePlans(a, b) {
    const old = new Map((a.seats || []).map(seat => [seat.id, seat]));
    const cur = new Map((b.seats || []).map(seat => [seat.id, seat]));
    let added = 0, removed = 0, moved = 0, zones = 0, pmr = 0;
    for (const [id, seat] of cur) {
        const before = old.get(id);
        if (!before) { added++; continue; }
        if (Math.hypot(Number(seat.x)-Number(before.x), Number(seat.y)-Number(before.y)) > .5) moved++;
        if (seat.zone_id !== before.zone_id) zones++;
        if (Boolean(seat.accessible) !== Boolean(before.accessible)) pmr++;
    }
    for (const id of old.keys()) if (!cur.has(id)) removed++;
    return { added, removed, moved, zones, pmr,
        geometry: JSON.stringify(a.geometry || {}) !== JSON.stringify(b.geometry || {}),
        stage: JSON.stringify(a.stage || {}) !== JSON.stringify(b.stage || {}) };
}

export default function RevisionPreview({ plan, title }) {
    const id = useId().replace(/:/g, '');
    const canvas = plan?.canvas;
    if (!canvas?.width || !canvas?.height || !Array.isArray(plan?.seats)) return <p className="text-sm text-muted">Aperçu indisponible.</p>;
    const zones = Object.fromEntries((plan.zones || []).map(z => [z.id, z]));
    return <div className="overflow-auto rounded-xl border border-line bg-[#F8FAF8]">
        <svg role="img" aria-label={title} viewBox={`0 0 ${canvas.width} ${canvas.height}`} className="block h-auto w-full" style={{ minWidth: 250, maxHeight: 430 }}>
            <defs><pattern id={id} width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0L0 0 0 50" fill="none" stroke="#E1E6E1"/></pattern></defs>
            <rect width={canvas.width} height={canvas.height} fill="#F8FAF8"/><rect width={canvas.width} height={canvas.height} fill={`url(#${id})`}/>
            {(plan.geometry?.objects || []).map(o => <g key={o.id} fill={o.color || '#D4A847'} fillOpacity=".16" stroke={o.color || '#D4A847'} strokeWidth="3">
                {o.shape === 'ellipse' ? <ellipse cx={o.x+o.width/2} cy={o.y+o.height/2} rx={o.width/2} ry={o.height/2}/> : o.shape === 'polygon' ? <polygon points={(o.points || []).map(([x,y])=>`${o.x+x*o.width},${o.y+y*o.height}`).join(' ')}/> : <rect x={o.x} y={o.y} width={o.width} height={o.height}/>}
                <text x={o.x+o.width/2} y={o.y+o.height/2} fill="#162B27" fillOpacity="1" stroke="none" textAnchor="middle" fontSize="16">{o.label}</text>
            </g>)}
            {plan.stage && <g><rect x={plan.stage.x} y={plan.stage.y} width={plan.stage.width} height={plan.stage.height} fill="#253F39" rx="8"/><text x={plan.stage.x+plan.stage.width/2} y={plan.stage.y+plan.stage.height/2} dominantBaseline="central" textAnchor="middle" fontSize="20" fill="white">{plan.stage.label || 'SCÈNE'}</text></g>}
            {plan.seats.map(s=><circle key={s.id} cx={s.x} cy={s.y} r="7" fill={zones[s.zone_id]?.color || '#76998D'} stroke={s.accessible ? '#172A26' : 'white'} strokeWidth="2"><title>{`Rangée ${s.row}, siège ${s.number}`}</title></circle>)}
        </svg>
    </div>;
}
