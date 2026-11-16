import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, Ticket } from 'lucide-react';
import { contrast, downloadDraft, starterTicket } from '../core/model';

function TicketPreview({ design }) {
    const poster = design.layout === 'poster';
    return <article className="mx-auto max-w-[420px] overflow-hidden rounded-xl border border-line shadow-lg" style={{background:design.background, color:design.foreground}}>
        <header className="p-6" style={{background:poster ? design.accent : design.background,color:poster ? '#FFFFFF' : design.foreground,borderBottom:`5px solid ${design.accent}`}}>
            <span className="text-xs font-bold uppercase tracking-widest">{design.heading}</span><h3 className="mt-3 text-2xl font-extrabold">Festival BOOKETIK</h3><p className="mt-2 text-sm">Samedi 14 novembre · 20:00</p>
        </header>
        <div className="grid gap-3 p-6 sm:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold uppercase" style={{color:design.accent}}>VIP</p><p className="mt-3 text-sm">Salle de démonstration</p><p className="mt-2 text-sm">Exemple Client</p>{design.show_seat && <p className="mt-3 font-bold">Rang A · Place 12</p>}{design.show_gate && <p className="text-sm">Porte Nord</p>}</div><div className="grid h-32 w-32 place-items-center border-2 border-dashed border-slate-400 bg-white p-3 text-center text-xs font-bold text-slate-900">EMPLACEMENT QR NON VALIDE</div></div><p className="bg-amber-100 p-3 text-center text-xs text-amber-900">Aperçu de design uniquement</p>
    </article>;
}

export default function TicketStudio({ initialDesign = starterTicket, eventId = 'demo-event', urls = {}, designRevision = 0 }) {
    const [design, setDesign] = useState(() => JSON.parse(JSON.stringify(initialDesign)));
    const set = (key, value) => setDesign(v => ({ ...v,[key]:value }));
    const ratio = contrast(design.foreground,design.background);
    const valid = ratio >= 4.5 && /^#[0-9a-fA-F]{6}$/.test(design.accent) && (design.layout !== 'poster' || contrast('#FFFFFF', design.accent) >= 4.5);
    return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-bold text-ink"><Ticket className="h-5 w-5"/>Ticket Studio</h2><span className="text-xs text-muted">QR et ticketing inchangés</span></div>
        <div className="grid gap-5 lg:grid-cols-[minmax(230px,1fr)_minmax(0,1.5fr)]"><div className="space-y-4 rounded-xl border border-line bg-surface p-4">
            <label className="block text-sm font-semibold text-ink">Présentation<select className="mt-1 w-full rounded-lg border border-line bg-surface p-2 text-ink" value={design.layout} onChange={e => set('layout',e.target.value)}><option value="classic">Classique</option><option value="poster">Affiche</option><option value="minimal">Minimaliste</option></select></label>
            <label className="block text-sm font-semibold text-ink">Titre du billet<input maxLength={80} className="mt-1 w-full rounded-lg border border-line bg-surface p-2 text-ink" value={design.heading} onChange={e => set('heading',e.target.value)}/></label>
            {[['accent','Accent'],['background','Fond'],['foreground','Texte']].map(([key,label]) => <label key={key} className="flex items-center justify-between text-sm text-ink">{label}<input type="color" aria-label={label} value={design[key]} onChange={e => set(key,e.target.value)}/></label>)}
            <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={design.show_seat} onChange={e => set('show_seat',e.target.checked)}/>Afficher le siège</label>
            <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={design.show_gate} onChange={e => set('show_gate',e.target.checked)}/>Afficher la porte</label>
            <p className="text-xs text-muted">Contraste texte/fond : {ratio.toFixed(2)}:1</p>{!valid && <p role="alert" className="text-xs font-semibold text-red-700">Contraste insuffisant : minimum 4,5:1 (texte et en-tête)</p>}
            {urls.saveDesign && <button type="button" disabled={!valid} className="w-full rounded-lg bg-ink px-3 py-2 text-white disabled:opacity-40" onClick={() => router.post(urls.saveDesign, {design,expected_revision:designRevision}, {preserveScroll:true})}>Enregistrer le modèle (brouillon)</button>}
            <button type="button" disabled={!valid} className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink disabled:opacity-40" onClick={() => downloadDraft('booketik-ticket-design.json',{event_id:eventId,design})}><Download className="h-4 w-4"/>Exporter le modèle</button>
        </div><TicketPreview design={design}/></div>
    </div>;
}
