import { useMemo, useReducer, useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, Accessibility, Check, Download, Grid3X3, Minus, MousePointer2, Plus, Redo2, RotateCcw, Ruler, Save, Trash2, Undo2, WandSparkles } from 'lucide-react';
import { downloadDraft, planErrors, starterPlan } from '@/Themes/civic/components/dashboard/BooketikStudios/core/model';
import GeometryCanvas from './GeometryCanvas';
import { emptyGeometry, geometryErrors, polygonFromPoints } from './geometry';
import { METRIC_DEFAULTS, buildAutoSeatingPreview, applyAutoSeatingPreview } from './autoSeating';
import { venueLink } from './Shell';
import { Empty, Panel, Status, inputClass, primaryClass, secondaryClass } from './ui';

const deep = value => JSON.parse(JSON.stringify(value));
const initialize = source => ({ plan: { ...deep(source || starterPlan), geometry: deep(source?.geometry || emptyGeometry()) }, past: [], future: [] });
function reducer(state, action) {
    if (action.type === 'reset') return initialize(action.plan);
    if (action.type === 'undo' && state.past.length) return { plan: state.past[state.past.length - 1], past: state.past.slice(0, -1), future: [state.plan, ...state.future].slice(0, 40) };
    if (action.type === 'redo' && state.future.length) return { plan: state.future[0], past: [...state.past, state.plan].slice(-40), future: state.future.slice(1) };
    if (action.type === 'change' && action.plan !== state.plan) return { plan: action.plan, past: [...state.past, state.plan].slice(-40), future: [] };
    return state;
}
const tools = [
    ['select', 'Déplacer / sélectionner'], ['paint', 'Peindre les sièges'], ['pmr', 'Accessibilité PMR'],
    ['rectangle', 'Rectangle'], ['ellipse', 'Ovale / cercle'], ['polygon', 'Polygone point par point'],
    ['freehand', 'Contour à main levée'], ['row', 'Rangée droite'], ['curved', 'Rangée courbe'],
];
const kinds = [['boundary', 'Contour de salle'], ['section', 'Section / zone'], ['aisle', 'Allée / passage'], ['stairs', 'Escalier']];
const kindColors = {boundary:'#A8BCB4',section:'#387FC4',aisle:'#E0B67F',stairs:'#C3A8D6'};
const clamp = (x,min,max) => Math.min(max,Math.max(min,x));
const freshRowLabel = label => { const m = /^(.*?)(\d+)$/.exec(label); return m ? `${m[1]}${Number(m[2])+1}`.slice(0,12) : label; };

export default function Studio({ venue, plan: initialPlan, revision = 0, urls = {}, current }) {
    const [state, dispatch] = useReducer(reducer, initialPlan, initialize);
    const {plan, past, future} = state;
    const [tool, setTool] = useState('select');
    const [kind, setKind] = useState('section');
    const [zoneId, setZoneId] = useState(plan.zones?.[0]?.id || 'vip');
    const [label, setLabel] = useState('Nouvelle section');
    const [seatCount, setSeatCount] = useState(10);
    const [rowLabel, setRowLabel] = useState('R1');
    const [snap, setSnap] = useState(true);
    const [selected, setSelected] = useState(null);
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [zoom, setZoom] = useState(1);
    const [autoConfig, setAutoConfig] = useState(() => ({...METRIC_DEFAULTS, canvasWidthM: initialPlan?.measurement?.canvas_width_m ? String(initialPlan.measurement.canvas_width_m) : ''}));
    const [autoPreviewEnabled, setAutoPreviewEnabled] = useState(false);
    const [autoError, setAutoError] = useState('');
    const [saving, setSaving] = useState(false);
    const [detail, setDetail] = useState({name:venue?.name || '',address_line1:venue?.address || ''});
    const [detailSaving, setDetailSaving] = useState(false);
    const base = useMemo(() => initialize(initialPlan).plan, [initialPlan]);
    const dirty = past.length > 0 || JSON.stringify(base) !== JSON.stringify(plan);
    const validation = useMemo(() => [...planErrors(plan), ...geometryErrors(plan), ...(plan.stage.x < 0 || plan.stage.y < 0 || plan.stage.x + plan.stage.width > plan.canvas.width || plan.stage.y + plan.stage.height > plan.canvas.height ? ['La scène doit rester à l’intérieur du plan'] : [])], [plan]);
    const options = {kind, zone_id:zoneId, color:kind === 'section' ? (plan.zones.find(z=>z.id===zoneId)?.color || '#387FC4') : kindColors[kind], label: label.trim() || 'Élément', seatCount:clamp(Number(seatCount)||1,1,50), rowLabel:rowLabel.trim().slice(0,12)||'R1', snap};
    const change = next => dispatch({type:'change',plan:next});
    const patch = fn => change(fn(plan));
    const selectedShape = selected?.type === 'shape' ? plan.geometry.objects.find(o=>o.id===selected.id) : null;
    const selectedSeat = selected?.type === 'seat' ? plan.seats.find(s=>s.id===selected.id) : null;
    const metricTarget = selectedShape && ['boundary','section'].includes(selectedShape.kind) ? selectedShape : null;
    const autoResult = useMemo(() => autoPreviewEnabled ? buildAutoSeatingPreview(plan, metricTarget?.id, autoConfig) : null,
        [autoPreviewEnabled, plan, metricTarget?.id, autoConfig]);
    const metricScale = Number(autoConfig.canvasWidthM) >= 2 && Number(autoConfig.canvasWidthM) <= 500
        ? plan.canvas.width / Number(autoConfig.canvasWidthM) : null;
    const autoCandidates = autoResult && !autoResult.error ? autoResult.placements : [];
    const setAutoField = (key, value) => { setAutoConfig(v => ({...v,[key]:value})); setAutoPreviewEnabled(false); setAutoError(''); };
    const previewMetric = () => { setTool('select'); setAutoError(''); setAutoPreviewEnabled(true); };
    const applyMetric = () => {
        if (!autoResult || autoResult.error || !autoResult.count || !metricTarget) return;
        if (autoResult.mode === 'align' && !window.confirm(`Réaligner ${autoResult.count} sièges existants en conservant leurs identifiants, rangées et numéros ? Vous pourrez annuler avant d’enregistrer.`)) return;
        try {
            patch(p => applyAutoSeatingPreview(p, autoResult));
            setAutoPreviewEnabled(false); setAutoError('');
        } catch (error) { setAutoError(error instanceof Error ? error.message : 'Impossible d’appliquer le placement'); }
    };

    const setMode = mode => {setTool(mode); setSelected(null); setAutoPreviewEnabled(false); if (mode !== 'polygon') setPolygonPoints([]);};
    const commitPolygon = () => {
        const object = polygonFromPoints(polygonPoints, plan.canvas, options);
        if (!object) return;
        if (plan.geometry.objects.length >= 500) return;
        patch(p => ({...p,geometry:{...p.geometry,objects:[...p.geometry.objects,object]}}));
        setPolygonPoints([]);
    };
    const remove = () => {
        if (!selected || selected.type === 'stage' || !window.confirm('Supprimer cet élément du brouillon ? Cette action pourra être annulée.')) return;
        if (selected.type === 'shape') patch(p => ({...p,geometry:{...p.geometry,objects:p.geometry.objects.filter(o=>o.id!==selected.id)}}));
        if (selected.type === 'seat') patch(p => ({...p,seats:p.seats.filter(s=>s.id!==selected.id)}));
        setSelected(null);
    };
    const stagePatch = fields => patch(p => ({...p,stage:{...p.stage,...fields}}));
    const shapePatch = fields => patch(p=>({...p,geometry:{...p.geometry,objects:p.geometry.objects.map(o=>o.id===selected?.id?{...o,...fields}:o)}}));
    const seatPatch = fields => patch(p=>({...p,seats:p.seats.map(s=>s.id===selected?.id?{...s,...fields}:s)}));
    const save = () => {
        if (saving || validation.length || !dirty || !urls.saveLayout) return;
        router.post(urls.saveLayout, {plan,expected_revision:revision}, {preserveScroll:true,onStart:()=>setSaving(true),onFinish:()=>setSaving(false)});
    };
    const addOrMove = next => {
        setAutoPreviewEnabled(false);
        if (next.seats.length > 20000 || next.geometry.objects.length > 500) return;
        change(next);
        if ((tool === 'row' || tool === 'curved') && next.seats.length > plan.seats.length) setRowLabel(v=>freshRowLabel(v));
    };
    if (!venue) return <Empty icon={MousePointer2} title="Choisissez une salle" text="Sélectionnez une salle pour dessiner sa configuration physique." action={<a href={venueLink(current,'rooms')} className={primaryClass}>Voir mes salles</a>}/>;
    return <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><a href={venueLink(current,'rooms')} className="inline-flex items-center gap-2 text-sm text-link"><ArrowLeft className="h-4 w-4"/>Mes salles</a><h1 className="mt-2 font-display text-3xl font-bold text-ink">{venue.name}</h1><p className="mt-2 text-sm text-muted">Geometry Studio · Plan physique, sections et places, sans prix ni réservation.</p></div><div className="flex flex-wrap gap-2"><Status tone={revision?'success':'attention'}>{revision?`Brouillon v${revision}`:'Nouveau plan'}</Status>{dirty&&<Status tone="attention">Modifications non enregistrées</Status>}</div></div>
        <div className="grid items-start gap-5 2xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-5">
                <Panel title="Outils de dessin" description="Dessinez par glissement, puis sélectionnez pour repositionner.">
                    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choisir un outil">{tools.map(([id,title])=><button type="button" key={id} onClick={()=>setMode(id)} aria-pressed={tool===id} className={`min-h-11 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${tool===id?'border-ink bg-ink text-bg':'border-line bg-bg text-ink hover:bg-raised'}`}>{title}</button>)}</div>
                    <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-ink">Élément<select value={kind} onChange={e=>setKind(e.target.value)} className={`mt-1 ${inputClass}`}>{kinds.map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label><label className="text-xs font-semibold text-ink">Zone<select value={zoneId} onChange={e=>setZoneId(e.target.value)} className={`mt-1 ${inputClass}`}>{plan.zones.map(z=><option key={z.id} value={z.id}>{z.label}</option>)}</select></label></div>
                    <label className="mt-3 block text-xs font-semibold text-ink">Libellé<input value={label} maxLength={80} onChange={e=>setLabel(e.target.value)} className={`mt-1 ${inputClass}`}/></label>
                    {(tool==='row'||tool==='curved')&&<div className="mt-3 grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-ink">Rangée<input value={rowLabel} maxLength={12} onChange={e=>setRowLabel(e.target.value)} className={`mt-1 ${inputClass}`}/></label><label className="text-xs font-semibold text-ink">Places<input type="number" min="1" max="50" value={seatCount} onChange={e=>setSeatCount(e.target.value)} className={`mt-1 ${inputClass}`}/></label></div>}
                    {tool==='polygon'&&<div className="mt-3 space-y-2"><p className="text-xs text-muted">Touchez chaque sommet, puis terminez le polygone (3 points minimum).</p><div className="flex flex-wrap gap-2"><button type="button" className={secondaryClass} onClick={commitPolygon} disabled={polygonPoints.length<3}>Terminer ({polygonPoints.length})</button><button type="button" className={secondaryClass} onClick={()=>setPolygonPoints([])}>Effacer</button></div></div>}
                    <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-ink"><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)} className="h-4 w-4"/><Grid3X3 className="h-4 w-4"/>Alignement sur grille (10 unités)</label>
                </Panel>
                <Panel title="Alignement métrique · Auto-Seating" description="Sélectionnez une section ou un contour sur le plan, indiquez ses dimensions réelles, puis prévisualisez un placement automatique.">
                    <div className="rounded-xl border border-line bg-raised p-3 text-sm">
                        <Ruler className="me-2 inline h-4 w-4"/>
                        {metricTarget ? <span>Forme sélectionnée : <strong>{metricTarget.label}</strong> · {metricTarget.shape === 'ellipse' ? 'ovale' : metricTarget.shape === 'polygon' ? 'polygone' : 'rectangle'}</span> : <span className="text-muted">Passez en mode « Déplacer / sélectionner », puis touchez une section ou un contour.</span>}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-ink">Largeur réelle du plan (m)
                            <input aria-label="Largeur réelle du plan en mètres" type="number" min="2" max="500" step="0.1" placeholder="Ex. 24" value={autoConfig.canvasWidthM} onChange={e=>setAutoField('canvasWidthM',e.target.value)} className={`mt-1 ${inputClass}`}/>
                        </label>
                        <div className="flex items-end pb-2 text-xs text-muted">{metricScale ? `Hauteur calculée : ${(plan.canvas.height/metricScale).toFixed(2)} m` : 'Renseignez une dimension mesurée, pas une estimation.'}</div>
                        {[
                            ['seatPitchM','Entre sièges (m)',.3,5],['rowPitchM','Entre rangées (m)',.3,5],
                            ['seatDiameterM','Diamètre du siège (m)',.3,1.5],['boundaryMarginM','Marge des contours (m)',0,5],
                            ['aisleClearanceM','Dégagement des allées (m)',0,5],
                        ].map(([key,title,min,max])=><label key={key} className="text-xs font-semibold text-ink">{title}<input type="number" min={min} max={max} step="0.05" value={autoConfig[key]} onChange={e=>setAutoField(key,e.target.value)} className={`mt-1 ${inputClass}`}/></label>)}
                        <label className="text-xs font-semibold text-ink">Disposition<select value={autoConfig.layout} onChange={e=>setAutoField('layout',e.target.value)} className={`mt-1 ${inputClass}`}>
                            <option value="straight">Droite</option><option value="curved">Courbe</option><option value="radial">Radiale</option><option value="staggered">Quinconce</option>
                        </select></label>
                        <label className="text-xs font-semibold text-ink">Opération<select value={autoConfig.mode} onChange={e=>setAutoField('mode',e.target.value)} className={`mt-1 ${inputClass}`}>
                            <option value="add">Ajouter de nouvelles places</option><option value="align">Réaligner les places existantes</option>
                        </select></label>
                        {metricTarget?.kind !== 'section' && <label className="text-xs font-semibold text-ink">Zone des sièges<select value={autoConfig.zoneId || plan.zones[0]?.id || ''} onChange={e=>setAutoField('zoneId',e.target.value)} className={`mt-1 ${inputClass}`}>
                            {plan.zones.map(z=><option key={z.id} value={z.id}>{z.label}</option>)}
                        </select></label>}
                    </div>
                    {autoConfig.mode==='align'&&<p className="mt-3 text-xs text-muted">Les places de la zone déjà présentes dans la forme seront réalignées. Identifiants, noms de rangées, numéros et attributs PMR restent inchangés.</p>}
                    <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={previewMetric} disabled={!metricTarget} className={secondaryClass}><WandSparkles className="h-4 w-4"/>Prévisualiser</button>
                        {autoResult && !autoResult.error && <button type="button" onClick={applyMetric} className={primaryClass}><Check className="h-4 w-4"/>Appliquer {autoResult.count} places</button>}
                        {autoPreviewEnabled && <button type="button" onClick={()=>setAutoPreviewEnabled(false)} className={secondaryClass}>Fermer l’aperçu</button>}
                    </div>
                    {autoResult?.error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{autoResult.error}</p>}
                    {autoError && <p role="alert" className="mt-3 text-xs text-red-700">{autoError}</p>}
                    {autoResult && !autoResult.error && <p role="status" className="mt-3 rounded-lg border border-line bg-raised p-3 text-xs text-ink"><strong>{autoResult.count} places</strong> dans « {autoResult.shapeLabel} » · {autoResult.excluded} positions exclues (limites, obstacles ou collisions). Aperçu seulement : aucune modification avant « Appliquer ».</p>}
                    <p className="mt-3 text-xs text-muted">Les espacements sont calculés centre à centre selon la largeur réelle que vous fournissez. Ne vaut pas certification de sécurité, d’accessibilité ou de conformité de la salle.</p>
                </Panel>
                <Panel title="Zones physiques" description="Les couleurs identifient les sections et les sièges, sans déterminer les tarifs."><div className="space-y-3">{plan.zones.map(z=><div key={z.id} className="flex items-center gap-3"><input type="color" value={z.color} aria-label={`Couleur ${z.label}`} className="h-10 w-10 shrink-0 rounded-lg border border-line" onChange={e=>patch(p=>({...p,zones:p.zones.map(x=>x.id===z.id?{...x,color:e.target.value}:x)}))}/><input aria-label={`Nom de la zone ${z.label}`} className={`${inputClass} !py-2`} maxLength={80} value={z.label} onChange={e=>patch(p=>({...p,zones:p.zones.map(x=>x.id===z.id?{...x,label:e.target.value}:x)}))}/></div>)}</div></Panel>
                <Panel title="Élément sélectionné" description="Sélectionne un siège, une forme ou la scène pour la modifier.">
                    {!selected&&<p className="text-sm text-muted">Passe en mode « Déplacer / sélectionner », puis touche un élément du plan.</p>}
                    {selectedShape&&<div className="space-y-3"><label className="block text-xs font-semibold">Libellé<input className={`mt-1 ${inputClass}`} maxLength={80} value={selectedShape.label} onChange={e=>shapePatch({label:e.target.value})}/></label><label className="block text-xs font-semibold">Couleur<input aria-label="Couleur de la forme" type="color" value={selectedShape.color} onChange={e=>shapePatch({color:e.target.value})} className="mt-1 h-10 w-16"/></label></div>}
                    {selectedSeat&&<div className="space-y-3"><p className="text-sm font-bold">Rangée {selectedSeat.row} · Place {selectedSeat.number}</p><label className="block text-xs font-semibold">Zone<select value={selectedSeat.zone_id} onChange={e=>seatPatch({zone_id:e.target.value})} className={`mt-1 ${inputClass}`}>{plan.zones.map(z=><option key={z.id} value={z.id}>{z.label}</option>)}</select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedSeat.accessible===true} onChange={e=>seatPatch({accessible:e.target.checked})}/>Accessible PMR</label></div>}
                    {selected?.type==='stage'&&<div className="space-y-3"><label className="block text-xs font-semibold">Nom de la scène<input className={`mt-1 ${inputClass}`} value={plan.stage.label} maxLength={80} onChange={e=>stagePatch({label:e.target.value})}/></label><div className="grid grid-cols-2 gap-3">{['width','height'].map(k=><label key={k} className="text-xs font-semibold">{k==='width'?'Largeur':'Hauteur'}<input type="number" min="1" max={k==='width'?plan.canvas.width-plan.stage.x:plan.canvas.height-plan.stage.y} value={plan.stage[k]} onChange={e=>stagePatch({[k]:Number(e.target.value)})} className={`mt-1 ${inputClass}`}/></label>)}</div></div>}
                    {(selectedShape||selectedSeat)&&<button type="button" onClick={remove} className={`mt-4 ${secondaryClass}`}><Trash2 className="h-4 w-4"/>Retirer l’élément</button>}
                </Panel>
            </div>
            <div className="min-w-0 space-y-5">
                <Panel title="Plan interactif" description={`${plan.seats.length} places · ${plan.geometry.objects.length} éléments · Glisser pour dessiner ou déplacer.`} action={<div className="flex gap-1"><button type="button" onClick={()=>setZoom(v=>clamp(v-.25,.65,2.5))} aria-label="Réduire le zoom" className={secondaryClass}><Minus className="h-4 w-4"/></button><button type="button" onClick={()=>setZoom(v=>clamp(v+.25,.65,2.5))} aria-label="Augmenter le zoom" className={secondaryClass}><Plus className="h-4 w-4"/></button></div>}>
                    <GeometryCanvas plan={plan} tool={tool} opts={options} selected={selected} onSelect={item=>{setSelected(item);setAutoPreviewEnabled(false);}} onChange={addOrMove} zoom={zoom} polygonPoints={polygonPoints} setPolygonPoints={setPolygonPoints} metricPreview={autoCandidates} metricScale={metricScale} metricDiameterM={Number(autoConfig.seatDiameterM)} metricPreviewMode={autoResult?.mode}
                        onPaint={seat=>{setSelected({type:'seat',id:seat.id});patch(p=>({...p,seats:p.seats.map(s=>s.id===seat.id?{...s,zone_id:zoneId}:s)}));}}
                        onPmr={seat=>{setSelected({type:'seat',id:seat.id});patch(p=>({...p,seats:p.seats.map(s=>s.id===seat.id?{...s,accessible:!s.accessible}:s)}));}}/>
                    <p className="mt-3 text-xs text-muted"><Accessibility className="me-1 inline h-4 w-4"/>Mode PMR : toucher une place pour activer/désactiver l'accessibilité. Les anciens plans et leurs révisions restent conservés.</p>
                    {validation.length>0&&<div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validation.join(' · ')}</div>}
                    <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={()=>{setAutoPreviewEnabled(false);dispatch({type:'undo'});}} disabled={!past.length} className={secondaryClass}><Undo2 className="h-4 w-4"/>Annuler</button><button type="button" onClick={()=>{setAutoPreviewEnabled(false);dispatch({type:'redo'});}} disabled={!future.length} className={secondaryClass}><Redo2 className="h-4 w-4"/>Rétablir</button><button type="button" onClick={()=>{if(!dirty||window.confirm('Annuler toutes les modifications locales ?')){dispatch({type:'reset',plan:initialPlan});setSelected(null);setPolygonPoints([]);setAutoPreviewEnabled(false);setAutoConfig(v=>({...v,canvasWidthM:initialPlan?.measurement?.canvas_width_m ? String(initialPlan.measurement.canvas_width_m):''}));}}} className={secondaryClass}><RotateCcw className="h-4 w-4"/>Réinitialiser</button></div>
                    <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={save} disabled={!dirty||validation.length>0||saving||!urls.saveLayout} className={primaryClass}><Save className="h-4 w-4"/>{saving?'Enregistrement…':'Enregistrer le brouillon'}</button><button type="button" onClick={()=>downloadDraft('booketik-geometry-draft.json',{venue,plan})} className={secondaryClass}><Download className="h-4 w-4"/>Exporter JSON</button></div>
                    <p className="mt-3 text-xs text-muted">Le serveur conserve une révision immuable par enregistrement. Les éléments géométriques sont informatifs : aucun changement du stock, des tickets ou des tarifs. Le rendu acheteur avancé sera raccordé dans une étape distincte.</p>
                </Panel>
                <Panel title="Informations du lieu" description="Le plan et les informations administratives sont sauvegardés séparément."><form onSubmit={e=>{e.preventDefault();if(!urls.saveVenue||detailSaving)return;router.post(urls.saveVenue,detail,{preserveScroll:true,onStart:()=>setDetailSaving(true),onFinish:()=>setDetailSaving(false)});}} className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Nom<input required maxLength={160} className={`mt-2 ${inputClass}`} value={detail.name} onChange={e=>setDetail(v=>({...v,name:e.target.value}))}/></label><label className="text-sm font-semibold text-ink">Adresse<input maxLength={255} className={`mt-2 ${inputClass}`} value={detail.address_line1} onChange={e=>setDetail(v=>({...v,address_line1:e.target.value}))}/></label><div className="sm:col-span-2"><button type="submit" disabled={detailSaving||!detail.name.trim()} className={secondaryClass}><Check className="h-4 w-4"/>Enregistrer les informations</button></div></form></Panel>
            </div>
        </div>
    </div>;
}
