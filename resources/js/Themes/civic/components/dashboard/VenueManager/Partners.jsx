import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Search, ShieldCheck, UsersRound } from 'lucide-react';
import { Empty, Panel, Status, inputClass, primaryClass, secondaryClass } from './ui';
import { venueLink } from './Shell';

export default function Partners({ rooms, venue, urls, current }) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const grants = venue?.access || [];
    const lookup = async e => {
        e.preventDefault();
        if (!urls.organizerSearch || search.trim().length < 2 || searching) return;
        setError(''); setSearching(true); setResults([]);
        try {
            const r = await fetch(`${urls.organizerSearch}?q=${encodeURIComponent(search.trim())}`, { credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            if (!r.ok) throw Error('Recherche momentanément indisponible.');
            const data = await r.json();
            setResults(Array.isArray(data.items) ? data.items : []);
        } catch (err) { setError(err.message || 'Recherche impossible.'); }
        finally { setSearching(false); }
    };
    const doGrant = (id, enabled) => {
        if (!urls.grant || busy || !venue) return;
        if (!enabled && typeof window !== 'undefined' && !window.confirm('Révoquer cet accès organisateur ?')) return;
        router.post(urls.grant, { organizer_id: id, enabled }, {
            preserveScroll: true, onStart: () => setBusy(true),
            onSuccess: () => { setResults([]); setSearch(''); },
            onFinish: () => setBusy(false),
        });
    };
    return <div className="space-y-6">
        <div><span className="font-mono text-xs uppercase tracking-widest text-muted">Partage sécurisé</span><h1 className="mt-2 font-display text-3xl font-bold text-ink">Organisateurs autorisés</h1><p className="mt-2 max-w-2xl text-sm text-muted">Le fournisseur autorise un organisateur à utiliser une salle, mais ne contrôle ni ses prix ni ses ventes.</p></div>
        {rooms.filter(r => !r.archived).length > 0 && <Panel title="Salle concernée" description="Les droits sont propres à chaque salle."><div className="flex flex-wrap gap-2">{rooms.filter(r => !r.archived).map(room => <a key={room.id} href={venueLink(current, 'partners', room.id)} aria-current={room.id === venue?.id ? 'page' : undefined} className={`${secondaryClass} ${room.id === venue?.id ? 'border-ink' : ''}`}>{room.name}</a>)}</div></Panel>}
        {!venue ? <Empty icon={UsersRound} title="Aucune salle sélectionnée" text="Choisissez une salle active pour gérer les organisateurs autorisés."/> : <>
            <Panel title={`Accès · ${venue.name}`} description="Les révocations sont immédiates et conservées dans l'historique des autorisations."><div className="space-y-3">{grants.length ? grants.map(g => <div key={g.organizer_id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-4"><span className="rounded-xl bg-raised p-3"><UsersRound className="h-5 w-5 text-ink"/></span><div className="min-w-0 flex-1"><p className="font-bold text-ink">{g.organizer_name}</p><p className="text-xs text-muted">Accès au plan, sans accès aux ventes</p></div><Status tone={g.status === 'granted' ? 'success' : 'neutral'}>{g.status === 'granted' ? 'Autorisé' : 'Révoqué'}</Status><button type="button" disabled={busy} className={secondaryClass} onClick={() => doGrant(g.organizer_id, g.status !== 'granted')}>{g.status === 'granted' ? 'Révoquer' : 'Réautoriser'}</button></div>) : <Empty icon={ShieldCheck} title="Aucune autorisation" text="Aucun organisateur n'est actuellement autorisé à utiliser cette salle."/>}</div></Panel>
            <Panel title="Inviter un organisateur existant" description="Recherchez son nom ; aucun identifiant technique n'est nécessaire."><form onSubmit={lookup} className="flex flex-wrap items-end gap-3"><label className="min-w-[220px] flex-1 text-sm font-semibold text-ink">Nom de l'organisateur<input className={`mt-2 ${inputClass}`} maxLength={80} value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans BOOKETIK"/></label><button type="submit" disabled={searching || search.trim().length < 2} className={secondaryClass}><Search className="h-4 w-4"/>{searching ? 'Recherche…' : 'Rechercher'}</button></form>
                {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
                <div className="mt-4 space-y-2" aria-live="polite">{results.map(o => { const allowed = grants.find(g => g.organizer_id === o.id)?.status === 'granted'; return <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"><span className="font-semibold text-ink">{o.name}</span><button type="button" className={primaryClass} disabled={allowed || busy} onClick={() => doGrant(o.id, true)}>{allowed ? 'Déjà autorisé' : 'Autoriser'}</button></div>; })}</div>
            </Panel>
        </>}
    </div>;
}
