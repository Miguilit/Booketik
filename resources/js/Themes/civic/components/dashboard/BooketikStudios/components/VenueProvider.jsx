import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Building2, Download, RotateCcw } from 'lucide-react';
import SeatCanvas from './SeatCanvas';
import { downloadDraft, generateRows, planErrors, starterPlan, starterVenue } from '../core/model';

export default function VenueProvider({ venue = starterVenue, initialPlan = starterPlan, urls = {}, layoutRevision = 0 }) {
    const [draft, setDraft] = useState(() => ({ ...JSON.parse(JSON.stringify(venue)), access: venue.access || [] }));
    const [plan, setPlan] = useState(() => JSON.parse(JSON.stringify(initialPlan)));
    const [activeZone, setActiveZone] = useState(plan.zones[0]?.id);
    const [rows, setRows] = useState(7);
    const [perRow, setPerRow] = useState(10);
    const [invite, setInvite] = useState('');
    const [selected, setSelected] = useState(null);
    const errors = planErrors(plan);
    const field = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink';
    const update = (key, value) => setDraft(v => ({ ...v, [key]: value }));
    const paint = seat => { setSelected(seat); setPlan(p => ({ ...p, seats: p.seats.map(s => s.id === seat.id ? { ...s, zone_id: activeZone } : s) })); };
    const color = (zoneId, value) => setPlan(p => ({ ...p, zones: p.zones.map(z => z.id === zoneId ? { ...z, color: value } : z) }));
    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-bold text-ink"><Building2 className="h-5 w-5" /> Gestionnaire de salle</h2>
                <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">Brouillon · enregistrable sur le serveur</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm font-semibold text-ink">Nom de la salle<input className={field} value={draft.name} onChange={e => update('name', e.target.value)} maxLength={120}/></label>
                <label className="text-sm font-semibold text-ink">Adresse<input className={field} value={draft.address} onChange={e => update('address', e.target.value)} maxLength={200}/></label>
                <label className="text-sm font-semibold text-ink">Visibilité<select disabled className={field} value={draft.visibility} onChange={e => update('visibility', e.target.value)}><option value="private">Privée</option><option disabled value="listed">Référencée (à venir)</option></select></label>
            </div>
            <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
                    <h3 className="font-bold text-ink">Configuration</h3>
                    <label className="block text-sm text-ink">Rangées<input type="number" min="1" max="30" value={rows} onChange={e => setRows(e.target.value)} className={field}/></label>
                    <label className="block text-sm text-ink">Sièges par rangée<input type="number" min="1" max="35" value={perRow} onChange={e => setPerRow(e.target.value)} className={field}/></label>
                    <button type="button" className="w-full rounded-lg bg-ink px-3 py-2 text-white" onClick={() => { setPlan(generateRows(rows, perRow, plan.zones)); setSelected(null); }}>Générer les rangées</button>
                    <label className="block text-sm text-ink">Zone à appliquer<select className={field} value={activeZone} onChange={e => setActiveZone(e.target.value)}>{plan.zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}</select></label>
                    {plan.zones.map(z => <label key={z.id} className="flex items-center justify-between gap-2 text-sm text-ink"><span>{z.label}</span><input type="color" aria-label={`Couleur ${z.label}`} value={z.color} onChange={e => color(z.id, e.target.value)} /></label>)}
                    {selected && <p className="text-xs text-muted">Sélection : {selected.row} · {selected.number}</p>}
                    {errors.length > 0 && <p role="alert" className="text-sm text-red-700">{errors.join(' · ')}</p>}
                    <button type="button" disabled={errors.length > 0} className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink disabled:opacity-40" onClick={() => downloadDraft('booketik-venue-draft.json', { venue: draft, plan })}><Download className="h-4 w-4"/>Exporter le brouillon JSON</button>
                    <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink" onClick={() => { setPlan(JSON.parse(JSON.stringify(initialPlan))); setDraft(JSON.parse(JSON.stringify(venue))); }}><RotateCcw className="h-4 w-4"/>Réinitialiser</button>
                    {urls.saveLayout && <button type="button" disabled={errors.length > 0} className="w-full rounded-lg bg-ink px-3 py-2 text-white disabled:opacity-50" onClick={() => router.post(urls.saveLayout, {plan, expected_revision: layoutRevision}, {preserveScroll:true})}>Enregistrer le plan (brouillon)</button>}
                    {urls.saveVenue && <button type="button" className="w-full rounded-lg border border-line px-3 py-2 text-ink" onClick={() => router.post(urls.saveVenue, {name:draft.name, address_line1:draft.address}, {preserveScroll:true})}>Enregistrer les informations de salle</button>}
                </div>
                <SeatCanvas plan={plan} onPick={paint} />
            </div>
            <section className="rounded-xl border border-line bg-surface p-4">
                <h3 className="font-bold text-ink">Organisateurs autorisés à utiliser la salle</h3>
                <div className="mt-3 space-y-2">{draft.access.map((a,i) => <p key={`${a.organizer_id}-${i}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 text-sm text-ink"><span>{a.organizer_name}</span><span className="text-muted">{a.status}</span>{urls.grant && <button type="button" className="rounded border border-line px-2 py-1 text-ink" onClick={() => router.post(urls.grant, {organizer_id:a.organizer_id, enabled:a.status !== 'granted'}, {preserveScroll:true})}>{a.status === 'granted' ? 'Révoquer' : 'Autoriser'}</button>}</p>)}</div>
                <div className="mt-4 flex flex-wrap gap-2"><input className={`${field} max-w-sm`} value={invite} onChange={e => setInvite(e.target.value)} placeholder="Identifiant de l'organisateur" maxLength={100}/><button type="button" disabled={!urls.grant || !invite.trim()} onClick={() => { if (urls.grant) router.post(urls.grant, {organizer_id: invite.trim(), enabled: true}, {preserveScroll: true}); setInvite(''); }} className="rounded-lg border border-line px-4 py-2 text-ink disabled:opacity-40">Autoriser cet organisateur</button></div>
                <p className="mt-2 text-xs text-muted">Une autorisation donne accès au plan pour les événements de cet organisateur. Elle ne vend aucun billet.</p>
            </section>
        </div>
    );
}
