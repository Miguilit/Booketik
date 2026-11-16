import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, Clock3, FileCheck2, History, ShieldAlert } from 'lucide-react';
import { Empty, Panel, Status, secondaryClass, primaryClass } from './ui';
import { venueLink } from './Shell';

const UUID_HOLDER = '00000000-0000-0000-0000-000000000000';
const actionUrl = (pattern, venueId) => (pattern || '').replace(UUID_HOLDER, venueId);

export default function Publication({ rooms = [], publications = {}, urls = {}, selectedRoom, current }) {
    const available = rooms.filter(r => !r.archived);
    const selected = available.find(r => r.id === selectedRoom) || available[0] || null;
    const status = selected ? publications[selected.id] : null;
    const [busy, setBusy] = useState(false);

    const send = (action) => {
        if (!selected || !status || busy) return;
        const isWithdraw = action === 'withdraw';
        const confirmation = isWithdraw
            ? `Retirer le plan publié de « ${selected.name} » ? Les événements déjà liés garderont leur version.`
            : `Publier la révision ${status.latest_revision} de « ${selected.name} » pour les organisateurs autorisés ?`;
        if (typeof window !== 'undefined' && !window.confirm(confirmation)) return;
        const url = actionUrl(isWithdraw ? urls.withdrawPattern : urls.publishPattern, selected.id);
        if (!url) return;
        router.post(url, isWithdraw
            ? { expected_event_id: status.event_id }
            : { expected_revision: status.latest_revision, expected_event_id: status.event_id }, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
        });
    };

    return <div className="space-y-6">
        <div><span className="font-mono text-xs uppercase tracking-widest text-muted">Catalogue des plans</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Publication des configurations</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Enregistrer une révision dans le Studio crée un brouillon. Seule une révision explicitement publiée devient accessible aux organisateurs autorisés. Les événements conservent les versions déjà associées.</p>
        </div>
        {available.length > 0 && <Panel title="Choisir une salle" description="Chaque salle possède son propre historique de publication.">
            <div className="flex flex-wrap gap-2">{available.map(room => <a key={room.id} href={venueLink(current, 'publications', room.id)}
                aria-current={room.id === selected?.id ? 'page' : undefined}
                className={`${secondaryClass} ${room.id === selected?.id ? 'border-ink' : ''}`}>{room.name}</a>)}</div>
        </Panel>}
        {!selected ? <Empty icon={FileCheck2} title="Aucune salle active" text="Créez ou restaurez une salle pour publier son plan."/> : <>
            <Panel title={`Plan de « ${selected.name} »`} description="La publication ne change pas les catégories tarifaires, le stock de billets ni les paiements.">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-line p-4"><p className="text-xs text-muted">Dernier brouillon</p><p className="mt-2 font-display text-2xl font-bold text-ink">{status?.latest_revision ? `v${status.latest_revision}` : '—'}</p><p className="text-xs text-muted">{status?.latest_seat_count ?? 0} sièges</p></div>
                    <div className="rounded-xl border border-line p-4"><p className="text-xs text-muted">Plan publié</p><p className="mt-2 font-display text-2xl font-bold text-ink">{status?.published_revision ? `v${status.published_revision}` : '—'}</p><p className="text-xs text-muted">{status?.published_seat_count ?? 0} sièges</p></div>
                    <div className="rounded-xl border border-line p-4"><p className="text-xs text-muted">État actuel</p><div className="mt-3"><Status tone={status?.status === 'published' ? 'success' : 'neutral'}>{status?.status === 'published' ? 'Publié' : 'Non publié'}</Status></div></div>
                </div>
                {status?.has_newer_draft && <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-ink"><Clock3 className="h-4 w-4"/>Une révision plus récente est en brouillon. Les organisateurs continuent à voir la version publiée.</p>}
                <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" disabled={busy || !status?.latest_revision || (status?.status === 'published' && !status?.has_newer_draft)}
                        className={primaryClass} onClick={() => send('publish')}><CheckCircle2 className="h-4 w-4"/> {busy ? 'En cours…' : 'Publier le dernier brouillon'}</button>
                    <button type="button" disabled={busy || status?.status !== 'published'} className={secondaryClass}
                        onClick={() => send('withdraw')}><ShieldAlert className="h-4 w-4"/>Retirer du catalogue</button>
                    <a href={venueLink(current, 'studio', selected.id)} className={secondaryClass}>Ouvrir le Seating Studio</a>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted">Le retrait bloque les nouvelles utilisations du plan, sans effacer le plan physique ni les versions associées aux événements. Les permissions organisateurs sont gérées dans « Organisateurs ».</p>
            </Panel>
            <Panel title="Historique de publication" description="Journal des publications et retraits. Les révisions restent immuables.">
                <PublicationHistory key={selected.id} selected={selected} urls={urls}/>
            </Panel>
        </>}
    </div>;
}

function PublicationHistory({ selected, urls }) {
    // The complete immutable log is available from the authenticated detail endpoint.
    // S6A shows publication status directly in Inertia props; details are fetched on demand.
    const [items, setItems] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const getHistory = async () => {
        if (loading || !selected || !urls.publicationDetailPattern) return;
        setLoading(true); setError('');
        try {
            const response = await fetch(actionUrl(urls.publicationDetailPattern, selected.id), {
                credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!response.ok) throw Error('Historique temporairement indisponible.');
            const body = await response.json();
            setItems(Array.isArray(body.history) ? body.history : []);
        } catch (err) { setError(err.message || 'Impossible de consulter l’historique.'); }
        finally { setLoading(false); }
    };
    return <div className="space-y-4">
        <button type="button" disabled={loading} className={secondaryClass} onClick={getHistory}><History className="h-4 w-4"/>{loading ? 'Chargement…' : 'Afficher l’historique'}</button>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {items && (items.length ? <ol className="space-y-2">{items.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-line p-3 text-sm">
            <span className="font-semibold text-ink">{item.action === 'published' ? `Publication du plan v${item.revision}` : 'Retrait du catalogue'}</span>
            <span className="text-muted">{item.created_at}</span>
        </li>)}</ol> : <p className="text-sm text-muted">Aucune publication enregistrée.</p>)}
    </div>;
}
