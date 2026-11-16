// BOOKETIK S5D — physical geometry only. No prices, holds, stock or event mapping.
// Distances are derived from a user-supplied real canvas width; they are not certified measurements.
export const METRIC_DEFAULTS = Object.freeze({
    seatPitchM: 0.55, rowPitchM: 0.90, seatDiameterM: 0.44,
    boundaryMarginM: 0.20, aisleClearanceM: 0.45,
    layout: 'straight', mode: 'add', zoneId: '',
});
const finite = value => typeof value === 'number' && Number.isFinite(value);
const round = n => Math.round(n * 10) / 10;
const segmentDistance = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
    return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
};
const vertices = shape => (shape.points || []).map(([x, y]) => ({
    x: shape.x + x * shape.width, y: shape.y + y * shape.height,
}));
function insidePolygon(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
}
export function pointInShape(shape, point, clearance = 0) {
    if (!shape || !finite(point?.x) || !finite(point?.y) || !finite(clearance)) return false;
    const p = point, margin = Math.max(0, clearance);
    if (shape.shape === 'rect') return p.x >= shape.x + margin && p.x <= shape.x + shape.width - margin
        && p.y >= shape.y + margin && p.y <= shape.y + shape.height - margin;
    if (shape.shape === 'ellipse') {
        const rx = shape.width / 2 - margin, ry = shape.height / 2 - margin;
        if (rx <= 0 || ry <= 0) return false;
        const dx = (p.x - (shape.x + shape.width / 2)) / rx;
        const dy = (p.y - (shape.y + shape.height / 2)) / ry;
        return dx * dx + dy * dy <= 1;
    }
    if (shape.shape === 'polygon') {
        const poly = vertices(shape);
        if (poly.length < 3 || !insidePolygon(p, poly)) return false;
        return poly.every((a, i) => segmentDistance(p, a, poly[(i + 1) % poly.length]) >= margin - 0.0001);
    }
    return false;
}
// Inclusive exclusion: if a seat center lies inside or close to an aisle/staircase, reject it.
function intersectsObstacle(shape, point, clearance) {
    if (pointInShape(shape, point)) return true;
    const e = clearance;
    if (shape.shape === 'rect') {
        const dx = Math.max(shape.x - point.x, 0, point.x - shape.x - shape.width);
        const dy = Math.max(shape.y - point.y, 0, point.y - shape.y - shape.height);
        return Math.hypot(dx, dy) < e;
    }
    if (shape.shape === 'ellipse') {
        const cx = shape.x + shape.width / 2, cy = shape.y + shape.height / 2;
        const rx = shape.width / 2 + e, ry = shape.height / 2 + e;
        const dx = (point.x - cx) / rx, dy = (point.y - cy) / ry;
        return dx * dx + dy * dy <= 1;
    }
    if (shape.shape === 'polygon') {
        const poly = vertices(shape);
        return poly.some((a, i) => segmentDistance(point, a, poly[(i + 1) % poly.length]) < e);
    }
    return false;
}
function metricConfig(plan, shape, input) {
    const widthM = Number(input.canvasWidthM);
    if (!finite(widthM) || widthM < 2 || widthM > 500) return {error:'Renseignez la largeur réelle du plan (2 à 500 m).'};
    if (!shape || !['boundary','section'].includes(shape.kind) || !['rect','ellipse','polygon'].includes(shape.shape)) return {error:'Sélectionnez un contour ou une section pour répartir les sièges.'};
    const {seatPitchM, rowPitchM, seatDiameterM, boundaryMarginM, aisleClearanceM} = Object.fromEntries(
        ['seatPitchM','rowPitchM','seatDiameterM','boundaryMarginM','aisleClearanceM'].map(k => [k, Number(input[k])])
    );
    if (![seatPitchM,rowPitchM,seatDiameterM,boundaryMarginM,aisleClearanceM].every(finite)
        || seatDiameterM < 0.3 || seatDiameterM > 1.5
        || seatPitchM < seatDiameterM || seatPitchM > 5
        || rowPitchM < seatDiameterM || rowPitchM > 5
        || boundaryMarginM < 0 || boundaryMarginM > 5 || aisleClearanceM < 0 || aisleClearanceM > 5)
        return {error:'Espacements incohérents : les pas doivent être au moins égaux au diamètre du siège.'};
    if (!['straight','curved','staggered','radial'].includes(input.layout)) return {error:'Mode de disposition invalide.'};
    if (!['add','align'].includes(input.mode)) return {error:'Action invalide.'};
    const zoneId = shape.kind === 'section' ? shape.zone_id : (input.zoneId || plan.zones[0]?.id);
    if (!plan.zones.some(z => z.id === zoneId)) return {error:'Choisissez une zone valide.'};
    const scale = plan.canvas.width / widthM;
    return {
        config:{widthM,scale,zoneId,seatPitch:seatPitchM*scale,rowPitch:rowPitchM*scale,
            diameter:seatDiameterM*scale,margin:(boundaryMarginM+seatDiameterM/2)*scale,
            aisle:(aisleClearanceM+seatDiameterM/2)*scale,layout:input.layout,mode:input.mode},
    };
}
function rowsForShape(shape, config) {
    const {seatPitch,rowPitch,margin,layout} = config;
    const left = shape.x + margin, right = shape.x + shape.width - margin;
    const top = shape.y + margin, bottom = shape.y + shape.height - margin;
    if (left > right || top > bottom) return [];
    const rows = [];
    const add = (x,y,index) => { if (rows[index] && rows[index].length < 3000) rows[index].push({x,y,rowIndex:index}); };
    if (layout === 'radial') {
        const cx = shape.x + shape.width/2, cy = shape.y + shape.height/2;
        const maxRadius = Math.hypot(shape.width/2,shape.height/2);
        for (let radius=rowPitch,index=0;radius <= maxRadius && index<600;radius+=rowPitch,index++) {
            rows[index]=[];
            const count = Math.min(3000,Math.floor((2*Math.PI*radius)/seatPitch));
            if (count < 3) continue;
            for (let i=0;i<count;i++) {
                const theta = 2*Math.PI*i/count-Math.PI/2;
                add(cx+radius*Math.cos(theta),cy+radius*Math.sin(theta),index);
            }
        }
        return rows;
    }
    for (let y=top,index=0;y<=bottom+.0001&&index<600;y+=rowPitch,index++) {
        rows[index]=[];
        const shift = layout === 'staggered' && index%2 ? seatPitch/2 : 0;
        const xStart = left+shift;
        const span = Math.max(seatPitch,right-left);
        for (let x=xStart;x<=right+.0001 && rows[index].length<3000;x+=seatPitch) {
            const t = Math.max(0,Math.min(1,(x-left)/span));
            const arch = layout === 'curved' ? Math.sin(Math.PI*t)*rowPitch*.35 : 0;
            add(x,y+arch,index);
        }
    }
    return rows;
}
function seatBuckets(seats, scale) {
    const cell = Math.max(1,scale);
    const buckets = new Map();
    const key = (x,y) => `${Math.floor(x/cell)}:${Math.floor(y/cell)}`;
    const add = p => { const k=key(p.x,p.y); if(!buckets.has(k))buckets.set(k,[]); buckets.get(k).push(p); };
    seats.forEach(add);
    const near = (point, threshold) => {
        const x0=Math.floor((point.x-threshold)/cell),x1=Math.floor((point.x+threshold)/cell);
        const y0=Math.floor((point.y-threshold)/cell),y1=Math.floor((point.y+threshold)/cell);
        for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
            const list=buckets.get(`${x}:${y}`)||[];
            for(const q of list)if(Math.hypot(q.x-point.x,q.y-point.y)<threshold-1e-6)return true;
        }
        return false;
    };
    return {near,add};
}
function inStage(point, stage, margin) {
    return point.x >= stage.x-margin && point.x <= stage.x+stage.width+margin
        && point.y >= stage.y-margin && point.y <= stage.y+stage.height+margin;
}
const numericSeatOrder = (a,b) => String(a.number).localeCompare(String(b.number),'fr',{numeric:true});
function makeUniqueSeatPrefix(seats) {
    const known = new Set(seats.map(s=>s.id));
    let prefix;
    do {prefix=`auto_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;} while (known.has(`${prefix}_1`));
    return prefix;
}
function makeUniqueRowPrefix(seats) {
    const known = new Set(seats.map(s=>String(s.row||'')));
    for(let n=1;n<1000;n++){
        const candidate=`M${n}_`;
        if(![...known].some(k=>k.startsWith(candidate)))return candidate;
    }
    return 'M_';
}
export function buildAutoSeatingPreview(plan, shapeId, input) {
    const shape=(plan.geometry?.objects||[]).find(o=>o.id===shapeId);
    const checked=metricConfig(plan,shape,input);
    if (checked.error) return {error:checked.error};
    const cfg=checked.config;
    if (shape.width * shape.height / (cfg.seatPitch * cfg.rowPitch) > 12000)
        return {error:'La surface dépasse la limite de prévisualisation. Divisez la salle en sections plus petites.'};
    const toMove = cfg.mode === 'align' ? plan.seats.filter(s=>s.zone_id===cfg.zoneId && pointInShape(shape,s)) : [];
    if(cfg.mode==='align'&&!toMove.length)return {error:'Aucun siège existant de cette zone dans la forme. Utilisez « Ajouter » ou déplacez d’abord les sièges dans la section.'};
    const movedIds = new Set(toMove.map(s=>s.id));
    const occupied=seatBuckets(plan.seats.filter(s=>!movedIds.has(s.id)),cfg.seatPitch);
    const obstacles=(plan.geometry?.objects||[]).filter(o=>o.kind==='aisle'||o.kind==='stairs');
    const rowCandidates=rowsForShape(shape,cfg);
    let attempted=0,excluded=0;
    const placed=[];
    const rows=[];
    for(let rowIndex=0;rowIndex<rowCandidates.length;rowIndex++){
        const row=[];
        for(const p of rowCandidates[rowIndex]){
            attempted++;
            const legal=p.x>=cfg.margin&&p.x<=plan.canvas.width-cfg.margin
                &&p.y>=cfg.margin&&p.y<=plan.canvas.height-cfg.margin
                &&pointInShape(shape,p,cfg.margin)
                &&!inStage(p,plan.stage,cfg.margin)
                &&!obstacles.some(o=>intersectsObstacle(o,p,cfg.aisle))
                &&!occupied.near(p,Math.max(cfg.diameter,Math.min(cfg.seatPitch,cfg.rowPitch)));
            if(!legal){excluded++;continue;}
            const rounded={x:round(p.x),y:round(p.y),rowIndex};
            occupied.add(rounded);row.push(rounded);placed.push(rounded);
            if(placed.length>3000)return {error:'La prévisualisation dépasse 3 000 places. Divisez le plan en plusieurs sections.'};
        }
        if(row.length)rows.push(row);
    }
    if(!placed.length)return {error:'Aucune place ne respecte les distances et obstacles. Ajustez la forme, l’échelle ou les espacements.'};
    if(cfg.mode==='align'){
        const groups=new Map();
        for(const seat of toMove){if(!groups.has(seat.row))groups.set(seat.row,[]);groups.get(seat.row).push(seat);}
        const orderedGroups=[...groups.values()].map(group=>group.sort(numericSeatOrder))
            .sort((a,b)=>a.reduce((n,s)=>n+s.y,0)/a.length-b.reduce((n,s)=>n+s.y,0)/b.length);
        const mapped=[];let nextRow=0;
        for(const group of orderedGroups){
            const idx=rows.findIndex((r,i)=>i>=nextRow&&r.length>=group.length);
            if(idx<0)return {error:`Impossible de réaligner les ${toMove.length} places en conservant les rangées et les distances. Agrandissez la forme ou réduisez les espacements.`};
            const candidates=rows[idx];
            for(let i=0;i<group.length;i++){
                const index=Math.floor((i+.5)*candidates.length/group.length);
                mapped.push({id:group[i].id,x:candidates[index].x,y:candidates[index].y,zone_id:group[i].zone_id});
            }
            nextRow=idx+1;
        }
        return {mode:'align',zoneId:cfg.zoneId,scale:cfg.scale,widthM:cfg.widthM,
            placements:mapped,count:mapped.length,attempted,excluded,shapeLabel:shape.label};
    }
    if(plan.seats.length+placed.length>20000)return {error:'La limite de 20 000 sièges par plan serait dépassée.'};
    const prefix=makeUniqueSeatPrefix(plan.seats),rowPrefix=makeUniqueRowPrefix(plan.seats);
    let counter=0;
    const generated=rows.flatMap((row,i)=>row.map((p,j)=>({
        id:`${prefix}_${++counter}`,row:`${rowPrefix}${i+1}`,number:String(j+1),
        x:p.x,y:p.y,zone_id:cfg.zoneId,accessible:false,
    })));
    return {mode:'add',zoneId:cfg.zoneId,scale:cfg.scale,widthM:cfg.widthM,
        placements:generated,count:generated.length,attempted,excluded,shapeLabel:shape.label};
}
export function applyAutoSeatingPreview(plan, preview) {
    if(!preview||preview.error||!Array.isArray(preview.placements)||!preview.placements.length)throw new Error('Prévisualisation absente');
    const measurement={version:1,unit:'m',canvas_width_m:preview.widthM};
    if(preview.mode==='add'){
        const ids=new Set(plan.seats.map(s=>s.id));
        if(preview.placements.some(s=>ids.has(s.id))||plan.seats.length+preview.placements.length>20000)throw new Error('Doublon ou capacité dépassée');
        return {...plan,measurement,seats:[...plan.seats,...preview.placements]};
    }
    if(preview.mode==='align'){
        const moves=new Map(preview.placements.map(s=>[s.id,s]));
        if(moves.size!==preview.placements.length||preview.placements.some(s=>!plan.seats.some(p=>p.id===s.id)))throw new Error('Siège introuvable');
        return {...plan,measurement,seats:plan.seats.map(s=>moves.has(s.id)?{...s,x:moves.get(s.id).x,y:moves.get(s.id).y}:s)};
    }
    throw new Error('Action non prise en charge');
}
