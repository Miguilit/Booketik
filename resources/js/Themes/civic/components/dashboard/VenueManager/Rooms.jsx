import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Archive, Building2, MapPin, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import { Empty, Panel, Status, inputClass, primaryClass, secondaryClass } from './ui';
import { venueLink } from './Shell';

const empty = { name: '', address_line1: '', city: '', timezone: 'Europe/Brussels' };
const routeFor = (pattern, id) => pattern?.replace('00000000-0000-0000-0000-000000000000', id);

export default function Rooms({ rooms, urls, current }) {
    const [create, setCreate] = useState(rooms.length === 0);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null);
    const [archive, setArchive] = useState(null);
    const [confirmation, setConfirmation] = useState('');
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const visible = rooms.filter(r => (showArchived || !r.archived) && `${r.name} ${r.city || ''} ${r.address || ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const submit = (url, data, callback) => {
        if (!url || busy) return;
        router.post(url, data, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onSuccess: () => callback?.(),
            onFinish: () => setBusy(false),
        });
    };
    const change = (field, value) => setForm(f => ({ ...f, [field]: value }));
    const startEdit = room => {
        setCreate(false);
        setArchive(null);
        setEditing(room.id);
        setForm({ name: room.name, address_line1: room.address || '', city: room.city || '', timezone: room.timezone || 'Europe/Brussels' });
    };
    const close = () => { setCreate(false); setEditing(null); setArchive(null); setConfirmation(''); setForm(empty); };
    return <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div><span className="font-mono text-xs uppercase tracking-widest text-muted">Patrimoine des lieux</span><h1 className="mt-2 font-display text-3xl font-bold text-ink">Mes salles</h1><p className="mt-2 text-sm text-muted">Fiches, configurations et archivage sans perte d'historique.</p></div>
            <button type="button" className={primaryClass} onClick={() => { close(); setCreate(true); }}><Plus className="h-4 w-4"/>Nouvelle salle</button>
        </div>
        {(create || editing) && <Panel title={editing ? 'Modifier la salle' : 'Créer une salle'} description="Identité du lieu, indépendante des prix des événements.">
            <form onSubmit={e => { e.preventDefault(); submit(editing ? routeFor(urls.venueUpdatePattern, editing) : urls.createVenue, form, close); }} className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">Nom<input required maxLength={160} className={`mt-2 ${inputClass}`} value={form.name} onChange={e => change('name', e.target.value)}/></label>
                <label className="text-sm font-semibold text-ink">Adresse<input maxLength={255} className={`mt-2 ${inputClass}`} value={form.address_line1} onChange={e => change('address_line1', e.target.value)}/></label>
                <label className="text-sm font-semibold text-ink">Ville<input maxLength={160} className={`mt-2 ${inputClass}`} value={form.city} onChange={e => change('city', e.target.value)}/></label>
                <label className="text-sm font-semibold text-ink">Fuseau horaire<input required className={`mt-2 ${inputClass}`} value={form.timezone} onChange={e => change('timezone', e.target.value)}/></label>
                <div className="flex flex-wrap gap-3 sm:col-span-2"><button type="submit" disabled={busy || !form.name.trim()} className={primaryClass}>{busy ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Créer la salle'}</button><button type="button" className={secondaryClass} onClick={close}><X className="h-4 w-4"/>Annuler</button></div>
            </form>
        </Panel>}
        <Panel title={`${rooms.filter(r => !r.archived).length} salles actives`} description="Les salles archivées conservent leurs plans et leurs historiques." action={<div className="flex flex-wrap gap-3"><input className={inputClass} value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une salle" aria-label="Rechercher une salle"/><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)}/>Voir les archives</label></div>}>
            {visible.length ? <div className="grid gap-3 xl:grid-cols-2">{visible.map(room => <div key={room.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tint-2 font-display text-lg font-bold text-on-tint-2">{(room.name || 'S').slice(0,1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-ink">{room.name}</p><p className="mt-1 truncate text-xs text-muted">{[room.address, room.city].filter(Boolean).join(', ') || 'Adresse à compléter'}</p><p className="mt-2 text-xs text-muted">{room.seat_count || 0} sièges · {room.layout_revision ? `Plan v${room.layout_revision}` : 'Aucun plan'}</p></div><Status tone={room.archived ? 'attention' : 'success'}>{room.archived ? 'Archivée' : 'Active'}</Status></div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">{room.archived ? <button type="button" disabled={busy} onClick={() => submit(routeFor(urls.venueRestorePattern, room.id), {}, close)} className={secondaryClass}><RotateCcw className="h-4 w-4"/>Restaurer</button> : <><a className={secondaryClass} href={venueLink(current, 'studio', room.id)}>Ouvrir le Studio</a><button type="button" className={secondaryClass} onClick={() => startEdit(room)}><Pencil className="h-4 w-4"/>Modifier</button><button type="button" className={secondaryClass} onClick={() => { close(); setArchive(room); }}><Archive className="h-4 w-4"/>Archiver</button></>}</div>
            </div>)}</div> : <Empty icon={rooms.length ? MapPin : Building2} title="Aucune salle à afficher" text="Créez une salle ou modifiez vos filtres."/>}
        </Panel>
        {archive && <Panel title={`Archiver « ${archive.name} »`} description="Cette action est réversible. Elle révoque les autorisations actives et conserve les plans. Elle est refusée si des événements utilisent la salle.">
            <div className="space-y-4"><label className="block text-sm font-semibold text-ink">Saisissez le nom exact de la salle pour confirmer<input className={`mt-2 ${inputClass}`} value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off"/></label><div className="flex flex-wrap gap-3"><button type="button" className={primaryClass} disabled={busy || confirmation !== archive.name} onClick={() => submit(routeFor(urls.venueArchivePattern, archive.id), {}, close)}><Archive className="h-4 w-4"/>Confirmer l'archivage</button><button type="button" className={secondaryClass} onClick={close}>Annuler</button></div></div>
        </Panel>}
    </div>;
}
