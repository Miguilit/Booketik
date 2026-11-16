import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Armchair, Download } from 'lucide-react';
import SeatCanvas from './SeatCanvas';
import { asEuro, downloadDraft, starterPlan, starterTypes } from '../core/model';

export default function OrganizerSeating({ plan = starterPlan, ticketTypes = starterTypes, eventId = 'demo-event', venueId = 'demo-venue-1', hasVenueAccess = false, urls = {}, layoutRevisionId = null, initialMapping = {} }) {
    const initial = Object.fromEntries(plan.zones.map((z,i) => [z.id, ticketTypes[Math.min(i, ticketTypes.length - 1)]?.id || '']));
    const [mapping, setMapping] = useState({...initial, ...initialMapping});
    const [selected, setSelected] = useState([]);
    const types = useMemo(() => Object.fromEntries(ticketTypes.map(t => [t.id, t])), [ticketTypes]);
    const ready = hasVenueAccess && plan.zones.every(z => types[mapping[z.id]]);
    const select = seat => setSelected(v => v.includes(seat.id) ? v.filter(id => id !== seat.id) : [...v, seat.id]);
    const total = selected.reduce((sum, id) => { const seat = plan.seats.find(s => s.id === id); return sum + (types[mapping[seat?.zone_id]]?.amount || 0); }, 0);
    return <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-xl font-bold text-ink"><Armchair className="h-5 w-5"/>Placement de l'événement</h2><span className="text-xs text-muted">Aperçu sans réservation ni paiement</span></div>
        {!hasVenueAccess && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">Cet organisateur ne dispose pas d'une autorisation de salle.</p>}
        <div className="grid gap-3 md:grid-cols-3">{plan.zones.map(z => <label key={z.id} className="rounded-xl border border-line bg-surface p-3 text-sm text-ink"><span className="mb-2 flex items-center gap-2 font-semibold"><i className="h-3 w-3 rounded-full" style={{backgroundColor:z.color}}/>{z.label}</span><select disabled={!hasVenueAccess} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink" value={mapping[z.id] || ''} onChange={e => setMapping(v => ({ ...v,[z.id]:e.target.value }))}><option value="">Choisir un tarif</option>{ticketTypes.map(t => <option key={t.id} value={t.id}>{t.name} · {asEuro(t.amount, t.currency)}</option>)}</select></label>)}</div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]"><SeatCanvas plan={plan} readOnly={!ready} activeIds={selected} onPick={select}/><aside className="rounded-xl border border-line bg-surface p-4"><h3 className="font-bold text-ink">Sélection simulée</h3><p className="mt-2 text-sm text-muted">{selected.length} places</p><p className="mt-3 text-2xl font-bold text-ink">{asEuro(total)}</p><p className="mt-2 break-words text-xs text-muted">{selected.join(' · ') || 'Aucune place'}</p><button type="button" disabled={!ready} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink disabled:opacity-40" onClick={() => downloadDraft('booketik-event-seat-mapping.json', {schema:'booketik.event-seating.v1',event_id:eventId,venue_id:venueId, zone_ticket_types:mapping})}><Download className="h-4 w-4"/>Exporter le mapping</button>{urls.saveMapping && <button type="button" disabled={!ready || !layoutRevisionId} className="mt-3 w-full rounded-lg bg-ink px-3 py-2 text-sm text-white disabled:opacity-50" onClick={() => router.post(urls.saveMapping, {layout_revision_id:layoutRevisionId, zone_ticket_types:mapping}, {preserveScroll:true})}>Enregistrer les tarifs par zone</button>}<p className="mt-3 text-xs text-muted">L'export ne vend aucune place. Les prix restent dans les types de billets existants.</p></aside></div>
    </div>;
}
