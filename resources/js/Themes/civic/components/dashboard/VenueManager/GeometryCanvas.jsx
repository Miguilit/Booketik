import { useRef, useState } from 'react';
import { clamp, gridSnap, geometryErrors, moveGeometryItem, polygonFromPoints, shapeFromDrag, createRowSeats } from './geometry';

const drawTools = new Set(['rectangle', 'ellipse', 'freehand', 'row', 'curved']);

function pointOnCanvas(e, root) {
    const matrix = root.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = root.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(matrix.inverse());
    const box = root.viewBox.baseVal;
    return { x: clamp(Math.round(q.x * 10) / 10, 0, box.width), y: clamp(Math.round(q.y * 10) / 10, 0, box.height) };
}

function Graphic({ object, active }) {
    const common = { fill: object.color, fillOpacity: .15, stroke: active ? '#13201F' : object.color, strokeWidth: active ? 4 : 3 };
    if (object.shape === 'ellipse') return <ellipse cx={object.x + object.width / 2} cy={object.y + object.height / 2} rx={object.width / 2} ry={object.height / 2} {...common}/>;
    if (object.shape === 'polygon') return <polygon points={(object.points || []).map(([x,y]) => `${object.x + x * object.width},${object.y + y * object.height}`).join(' ')} {...common}/>;
    return <rect x={object.x} y={object.y} width={object.width} height={object.height} rx={object.kind === 'aisle' ? 3 : 8} {...common}/>;
}

export default function GeometryCanvas({ plan, tool, opts, selected, onSelect, onChange, onPaint, onPmr, polygonPoints, setPolygonPoints, zoom = 1, metricPreview = [], metricScale = null, metricDiameterM = 0.44, metricPreviewMode = null }) {
    const ref = useRef(null);
    const gesture = useRef(null);
    const [preview, setPreview] = useState(null);
    const w = plan.canvas.width, h = plan.canvas.height;
    const withSnap = p => opts.snap ? { x: clamp(gridSnap(p.x, true), 0, w), y: clamp(gridSnap(p.y, true), 0, h) } : p;
    const zones = Object.fromEntries((plan.zones || []).map(z => [z.id, z]));

    const beginMove = (e, item) => {
        if (tool !== 'select') return;
        e.preventDefault(); e.stopPropagation();
        const svg = ref.current;
        svg.setPointerCapture(e.pointerId);
        const start = pointOnCanvas(e, svg);
        gesture.current = { kind: 'move', target: item, start, end: start, pointer: e.pointerId };
        onSelect(item);
    };
    const start = e => {
        if (tool === 'select' || tool === 'paint' || tool === 'pmr') { onSelect(null); return; }
        const svg = ref.current;
        const p = pointOnCanvas(e, svg);
        if (tool === 'polygon') {
            if (polygonPoints.length < 48) setPolygonPoints(v => [...v, withSnap(p)]);
            return;
        }
        if (!drawTools.has(tool)) return;
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        const aligned = tool === 'freehand' ? p : withSnap(p);
        gesture.current = { kind: tool, start: aligned, end: aligned, points: [p], pointer: e.pointerId };
        setPreview(gesture.current);
    };
    const move = e => {
        const g = gesture.current;
        if (!g || e.pointerId !== g.pointer) return;
        const p = pointOnCanvas(e, ref.current);
        g.end = g.kind === 'freehand' ? p : withSnap(p);
        if (g.kind === 'freehand' && g.points.length < 800 && Math.hypot(p.x - g.points[g.points.length-1].x, p.y - g.points[g.points.length-1].y) >= 4) g.points.push(p);
        setPreview({ ...g, points: g.points.slice() });
    };
    const finish = e => {
        const g = gesture.current;
        if (!g || e.pointerId !== g.pointer) return;
        const raw = pointOnCanvas(e, ref.current);
        const p = g.kind === 'freehand' ? raw : withSnap(raw);
        gesture.current = null;
        setPreview(null);
        if (g.kind === 'move') {
            const dx = p.x - g.start.x, dy = p.y - g.start.y;
            if (Math.hypot(dx, dy) > 1) onChange(moveGeometryItem(plan, g.target, dx, dy, opts.snap));
        } else if (g.kind === 'row' || g.kind === 'curved') {
            const row = createRowSeats(g.start, p, opts.seatCount, opts.rowLabel, opts.zone_id, plan.seats, g.kind === 'curved', plan.canvas);
            if (row.length > 0) onChange({ ...plan, seats: [...plan.seats, ...row] });
        } else if (g.kind === 'freehand') {
            const points = [...g.points, p];
            const shape = polygonFromPoints(points, plan.canvas, opts);
            if (shape) onChange({ ...plan, geometry: { ...plan.geometry, objects: [...plan.geometry.objects, shape] } });
        } else {
            const shape = shapeFromDrag(g.start, p, plan.canvas, { ...opts, shape: g.kind === 'ellipse' ? 'ellipse' : 'rect' });
            if (shape) onChange({ ...plan, geometry: { ...plan.geometry, objects: [...plan.geometry.objects, shape] } });
        }
    };
    const seatDown = (e, seat) => {
        if (tool === 'paint') { e.preventDefault(); e.stopPropagation(); onPaint(seat); return; }
        if (tool === 'pmr') { e.preventDefault(); e.stopPropagation(); onPmr(seat); return; }
        if (tool === 'select') beginMove(e, { type: 'seat', id: seat.id });
    };
    const isSelected = (type, id) => selected?.type === type && selected?.id === id;
    const drag = (type, id) => preview?.kind === 'move' && preview?.target?.type === type && preview?.target?.id === id
        ? `translate(${preview.end.x - preview.start.x},${preview.end.y - preview.start.y})` : undefined;
    const p1 = preview?.start, p2 = preview?.end;
    const invalid = geometryErrors(plan).length > 0;
    const actualW = Math.max(350, Math.round(w * .65 * zoom));
    const metricRadius = Number.isFinite(metricScale) && metricScale > 0 ? clamp(metricScale * metricDiameterM / 2, 4, 17) : 17;
    const legendMetres = metricScale && metricScale > 0 ? (metricScale > 240 ? 0.5 : metricScale < 35 ? 5 : 1) : null;
    return <div className="overflow-x-auto rounded-xl border border-line bg-[#F5F7F4]" aria-label="Éditeur du plan de salle">
        <svg ref={ref} viewBox={`0 0 ${w} ${h}`} width={actualW} height={actualW * h / w}
            className="block max-w-none select-none" style={{ touchAction: 'none', cursor: tool === 'select' ? 'grab' : 'crosshair' }}
            onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={() => {gesture.current = null; setPreview(null);}}>
            <defs><pattern id="booketik-geo-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#DDE4DD" strokeWidth="1"/></pattern></defs>
            <rect width={w} height={h} fill="#F8FAF8"/>
            <rect width={w} height={h} fill="url(#booketik-geo-grid)"/>
            {plan.geometry?.objects?.map(o => <g key={o.id} transform={drag('shape', o.id)}
                onPointerDown={e => beginMove(e, {type:'shape',id:o.id})}>
                <Graphic object={o} active={isSelected('shape', o.id)}/>
                <text x={o.x+o.width/2} y={o.y+o.height/2} textAnchor="middle" dominantBaseline="central" fontSize="19" fill="#182925" pointerEvents="none">{o.label}</text>
            </g>)}
            <g transform={drag('stage', 'stage')} onPointerDown={e => beginMove(e, {type:'stage',id:'stage'})}>
                <rect x={plan.stage.x} y={plan.stage.y} width={plan.stage.width} height={plan.stage.height} rx="12" fill="#253F39" stroke={isSelected('stage', 'stage') ? '#EDA342' : '#253F39'} strokeWidth="5"/>
                <text x={plan.stage.x + plan.stage.width/2} y={plan.stage.y + plan.stage.height/2} textAnchor="middle" dominantBaseline="central" fontSize="23" fontWeight="700" fill="white" pointerEvents="none">{plan.stage.label}</text>
            </g>
            {plan.seats.map(seat => <g key={seat.id} transform={drag('seat', seat.id)} onPointerDown={e => seatDown(e, seat)}>
                <circle cx={seat.x} cy={seat.y} r={metricRadius} fill={zones[seat.zone_id]?.color || '#9BA9A5'} stroke={isSelected('seat', seat.id) ? '#12211E' : seat.accessible ? '#12211E' : 'white'} strokeWidth={isSelected('seat', seat.id) || seat.accessible ? 5 : 3}/>
                {seat.accessible && <circle cx={seat.x + 12} cy={seat.y - 13} r="6" fill="#12211E"/>}
                <title>{`Rangée ${seat.row} siège ${seat.number}${seat.accessible ? ' – PMR' : ''}`}</title>
            </g>)}
            {metricPreview.length > 0 && <g aria-label="Prévisualisation des places métriques" pointerEvents="none">
                {metricPreview.map((p,i)=><circle key={`${p.id||i}-metric`} cx={p.x} cy={p.y} r={metricRadius+2} fill="#0F766E" fillOpacity=".22" stroke="#0F766E" strokeWidth="2.5" strokeDasharray="5 4"/>) }
                {metricPreviewMode === 'align' && <text x="20" y="26" fontSize="16" fill="#075E54">Prévisualisation : repositionnement des sièges existants</text>}
            </g>}
            {legendMetres && <g transform={`translate(24,${h-34})`} pointerEvents="none">
                <rect x="-12" y="-26" width={legendMetres*metricScale + 130} height="45" fill="white" fillOpacity=".88" rx="7"/>
                <line x1="0" y1="0" x2={legendMetres*metricScale} y2="0" stroke="#263F37" strokeWidth="3"/>
                <line x1="0" y1="-7" x2="0" y2="7" stroke="#263F37" strokeWidth="3"/>
                <line x1={legendMetres*metricScale} y1="-7" x2={legendMetres*metricScale} y2="7" stroke="#263F37" strokeWidth="3"/>
                <text x={legendMetres*metricScale+12} y="6" fill="#263F37" fontSize="18">{legendMetres} m</text>
            </g>}
            {polygonPoints.length > 0 && <><polyline points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#F28742" strokeWidth="5" strokeDasharray="10 8"/>{polygonPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="8" fill="#F28742"/>)}</>}
            {preview && preview.kind !== 'move' && p1 && p2 && <g pointerEvents="none">
                {preview.kind === 'freehand' ? <polyline points={preview.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#D16F39" strokeWidth="5"/> : preview.kind === 'row' || preview.kind === 'curved' ? <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#D16F39" strokeWidth="5" strokeDasharray="12 7"/> : preview.kind === 'ellipse' ? <ellipse cx={(p1.x+p2.x)/2} cy={(p1.y+p2.y)/2} rx={Math.abs(p2.x-p1.x)/2} ry={Math.abs(p2.y-p1.y)/2} fill="#F2874222" stroke="#D16F39" strokeWidth="4" strokeDasharray="12 7"/> : <rect x={Math.min(p1.x,p2.x)} y={Math.min(p1.y,p2.y)} width={Math.abs(p2.x-p1.x)} height={Math.abs(p2.y-p1.y)} fill="#F2874222" stroke="#D16F39" strokeWidth="4" strokeDasharray="12 7"/>}
            </g>}
            {invalid && <text x={w-20} y={h-16} fill="#991B1B" fontSize="16" textAnchor="end">Géométrie à corriger</text>}
        </svg>
    </div>;
}
