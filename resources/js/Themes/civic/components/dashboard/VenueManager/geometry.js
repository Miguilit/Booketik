// BOOKETIK S5C — geometry is physical decoration, never ticket inventory.
export const emptyGeometry = () => ({ version: 1, objects: [] });
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const finite = x => typeof x === 'number' && Number.isFinite(x);
export const gridSnap = (n, enabled) => enabled ? Math.round(n / 10) * 10 : Math.round(n * 10) / 10;
export const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const distanceToLine = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, mag = dx * dx + dy * dy;
    const t = mag ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / mag, 0, 1) : 0;
    return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
};

export function simplifyStroke(points, tolerance = 7) {
    if (!Array.isArray(points) || points.length < 3) return points || [];
    const result = [0];
    const visit = (a, b) => {
        let index = -1, best = tolerance;
        for (let i = a + 1; i < b; i++) {
            const d = distanceToLine(points[i], points[a], points[b]);
            if (d > best) { best = d; index = i; }
        }
        if (index !== -1) { visit(a, index); result.push(index); visit(index, b); }
    };
    visit(0, points.length - 1);
    result.push(points.length - 1);
    return result.sort((a, b) => a - b).map(i => points[i]);
}

export function polygonFromPoints(raw, canvas, options) {
    if (!Array.isArray(raw) || raw.length < 3) return null;
    // Drop repeated terminal point and oversampling; normalize to a scalable object.
    let points = simplifyStroke(raw.filter(p => finite(p?.x) && finite(p?.y)), 5);
    if (points.length > 48) points = points.filter((_, i) => i % Math.ceil(points.length / 48) === 0);
    if (points.length < 3) return null;
    const minX = clamp(Math.min(...points.map(p => p.x)), 0, canvas.width);
    const minY = clamp(Math.min(...points.map(p => p.y)), 0, canvas.height);
    const maxX = clamp(Math.max(...points.map(p => p.x)), 0, canvas.width);
    const maxY = clamp(Math.max(...points.map(p => p.y)), 0, canvas.height);
    if (maxX - minX < 12 || maxY - minY < 12) return null;
    const width = maxX - minX, height = maxY - minY;
    const normalized = points.map(p => [clamp((p.x - minX) / width, 0, 1), clamp((p.y - minY) / height, 0, 1)]);
    return { ...shapeBase('polygon', minX, minY, width, height, options), points: normalized };
}

function shapeBase(shape, x, y, width, height, opts) {
    return { id: uid('geo'), kind: opts.kind, shape, label: opts.label?.trim() || 'Élément',
        color: opts.color, zone_id: opts.kind === 'section' ? opts.zone_id : null,
        x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10,
        width: Math.round(width * 10) / 10, height: Math.round(height * 10) / 10,
        points: [] };
}

export function shapeFromDrag(start, end, canvas, opts) {
    const x = clamp(Math.min(start.x, end.x), 0, canvas.width);
    const y = clamp(Math.min(start.y, end.y), 0, canvas.height);
    const width = clamp(Math.max(start.x, end.x), 0, canvas.width) - x;
    const height = clamp(Math.max(start.y, end.y), 0, canvas.height) - y;
    if (width < 12 || height < 12) return null;
    return shapeBase(opts.shape, x, y, width, height, opts);
}

export function createRowSeats(start, end, count, row, zoneId, existing = [], curved = false, canvas = {width:1200,height:780}) {
    const n = clamp(Number(count) || 1, 1, 50);
    const dx = end.x - start.x, dy = end.y - start.y, length = Math.hypot(dx, dy);
    if (length < 30) return [];
    const normalX = -dy / length, normalY = dx / length;
    const bend = curved ? Math.min(75, length * 0.17) : 0;
    const existingIds = new Set(existing.map(s => s.id));
    const prefix = uid('seat');
    return Array.from({length:n}, (_, i) => {
        const t = n === 1 ? .5 : i / (n - 1);
        const bow = Math.sin(Math.PI * t) * bend;
        let id = `${prefix}-${i+1}`;
        while (existingIds.has(id)) id += '-x';
        return { id, row: String(row || 'R1').slice(0, 12), number: String(i + 1),
            x: Math.round(clamp(start.x + t * dx + normalX * bow, 0, canvas.width) * 10) / 10,
            y: Math.round(clamp(start.y + t * dy + normalY * bow, 0, canvas.height) * 10) / 10,
            zone_id: zoneId, accessible: false };
    });
}

export function moveGeometryItem(plan, target, dx, dy, snap = false) {
    const canvas = plan.canvas;
    const shift = (x, y, width = 0, height = 0) => ({
        x: clamp(gridSnap(x + dx, snap), 0, Math.max(0, canvas.width - width)),
        y: clamp(gridSnap(y + dy, snap), 0, Math.max(0, canvas.height - height)),
    });
    if (target.type === 'shape') return { ...plan, geometry: { ...plan.geometry,
        objects: plan.geometry.objects.map(o => o.id === target.id ? { ...o, ...shift(o.x, o.y, o.width, o.height) } : o) } };
    if (target.type === 'seat') return { ...plan, seats: plan.seats.map(s => s.id === target.id ? { ...s, ...shift(s.x, s.y) } : s) };
    if (target.type === 'stage') return { ...plan, stage: { ...plan.stage, ...shift(plan.stage.x, plan.stage.y, plan.stage.width, plan.stage.height) } };
    return plan;
}

export function geometryErrors(plan) {
    const messages = [];
    const geo = plan?.geometry;
    if (!geo) return messages;
    const w = plan.canvas.width, h = plan.canvas.height;
    if (geo.version !== 1 || !Array.isArray(geo.objects) || geo.objects.length > 500) return ['Géométrie non conforme'];
    const ids = new Set(), zones = new Set(plan.zones.map(z => z.id));
    geo.objects.forEach((o, i) => {
        if (!o || !/^geo-[A-Za-z0-9-]{1,60}$/.test(o.id) || ids.has(o.id)) messages.push(`Identifiant forme ${i+1} invalide`);
        ids.add(o?.id);
        if (!['section', 'boundary', 'aisle', 'stairs'].includes(o.kind) || !['rect', 'ellipse', 'polygon'].includes(o.shape)) messages.push(`Type de forme ${i+1} inconnu`);
        if (!finite(o.x) || !finite(o.y) || !finite(o.width) || !finite(o.height) || o.x < 0 || o.y < 0 || o.width < 1 || o.height < 1 || o.x + o.width > w + .01 || o.y + o.height > h + .01) messages.push(`Forme ${i+1} hors du plan`);
        if (o.kind === 'section' && !zones.has(o.zone_id)) messages.push(`Zone de forme ${i+1} inconnue`);
        if (typeof o.label !== 'string' || !o.label.trim() || o.label.length > 80) messages.push(`Libellé de forme ${i+1} invalide`);
        if (!/^#[0-9a-fA-F]{6}$/.test(o.color || '')) messages.push(`Couleur de forme ${i+1} invalide`);
        if (o.shape === 'polygon' && (!Array.isArray(o.points) || o.points.length < 3 || o.points.length > 48 || o.points.some(p => !Array.isArray(p) || p.length !== 2 || p.some(v => !finite(v) || v < 0 || v > 1)))) messages.push(`Polygone ${i+1} invalide`);
    });
    return messages.slice(0, 20);
}
