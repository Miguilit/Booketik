import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { GitCompareArrows, History, RotateCcw, ScanEye } from 'lucide-react';
import { Empty, Panel, RoomRow, secondaryClass } from './ui';
import { venueLink } from './Shell';
import RevisionPreview, { comparePlans } from './RevisionPreview';
import NamedConfigurations from './NamedConfigurations';

const VENUE_MARKER = '00000000-0000-0000-0000-000000000000';
const revisionUrl = (pattern, venueId, number) => (pattern || '').replace(VENUE_MARKER, venueId).replace('999999999', String(number));
async function fetchJSON(url) {
    const res = await fetch(url, {credentials:'same-origin', cache:'no-store', headers:{Accept:'application/json','X-Requested-With':'XMLHttpRequest'}});
    if (!res.ok) throw Error(`L’historique n’est pas accessible (HTTP ${res.status}).`);
    return res.json();
}

function HistoryForVenue({ venue, urls, published }) {
    const [items, setItems] = useState([]);
    const [latest, setLatest] = useState(0);
    const [serverPublished, setServerPublished] = useState(undefined);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selected, setSelected] = useState(null);
    const [compare, setCompare] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [restoring, setRestoring] = useState(false);
    const address = (number) => `${revisionUrl(urls.revisionIndexPattern,venue.id)}?page=${number}`;
    useEffect(() => {
        let active = true;
        setBusy(true);setError('');setItems([]);setSelected(null);setCompare(null);setPage(1);
        fetchJSON(address(1)).then(data => {if(!active)return;setItems(data.items);setLatest(data.latest_revision);setServerPublished(data.published_revision);setHasMore(data.has_more);})
            .catch(e => {if(active)setError(e.message);}).finally(() => {if(active)setBusy(false);});
        return () => {active = false;};
    }, [venue.id, urls.revisionIndexPattern]);
    const refresh = async (number=1) => {
        setBusy(true);setError('');
        try {const data=await fetchJSON(address(number));setItems(old=>number===1?data.items:[...old,...data.items]);setPage(number);setLatest(data.latest_revision);setServerPublished(data.published_revision);setHasMore(data.has_more);}
        catch(e){setError(e.message);}finally{setBusy(false);}
    };
    const open = async (version, withComparison=false) => {
        setBusy(true);setError('');
        try {
            const a=await fetchJSON(revisionUrl(urls.revisionDetailPattern,venue.id,version));
            if(withComparison){const b=await fetchJSON(revisionUrl(urls.revisionDetailPattern,venue.id,latest));setCompare({revision:b.revision,plan:b.plan,summary:comparePlans(a.plan,b.plan)});}else setCompare(null);
            setSelected(a);
        }catch(e){setError(e.message);}finally{setBusy(false);}
    };
    const displayedPublished = serverPublished === undefined ? published : serverPublished;
    const restore = version => {
        if (restoring || busy || version===latest || !window.confirm(`Restaurer v${version} dans un nouveau brouillon ? La publication v${displayedPublished || '—'} ne changera pas.`)) return;
        router.post(revisionUrl(urls.revisionRestorePattern,venue.id,version),{expected_revision:latest},{
            preserveScroll:true,onStart:()=>setRestoring(true),
            onSuccess:()=>{setSelected(null);setCompare(null);refresh(1);},
            onFinish:()=>setRestoring(false),
        });
    };
    return <Panel title={`Historique — ${venue.name}`} description="Chaque révision est immuable ; restaurer crée un nouveau brouillon. Le plan publié ne change pas.">
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted"><span>Dernière version : <strong>v{latest}</strong> · Publiée : <strong>{displayedPublished ? `v${displayedPublished}` : 'aucune'}</strong></span>
                <button type="button" className={secondaryClass} disabled={busy} onClick={()=>refresh(1)}>Actualiser</button></div>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {items.length ? <ol className="space-y-2">{items.map(r=><li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <div className="min-w-40 flex-1"><p className="font-semibold text-ink">Plan v{r.revision} {r.published && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">Publié</span>}</p>
                    <p className="mt-1 text-xs text-muted">{r.seat_count} sièges · {r.zone_count} zones · {r.shape_count} formes · {r.created_at}</p></div>
                <button type="button" className={secondaryClass} disabled={busy} onClick={()=>open(r.revision)}><ScanEye className="h-4 w-4"/>Aperçu</button>
                {r.revision!==latest && <button type="button" className={secondaryClass} disabled={busy} onClick={()=>open(r.revision,true)}><GitCompareArrows className="h-4 w-4"/>Comparer</button>}
                {r.revision!==latest && <button type="button" className={secondaryClass} disabled={restoring||busy} onClick={()=>restore(r.revision)}><RotateCcw className="h-4 w-4"/>Restaurer</button>}
            </li>)}</ol> : !busy && <Empty icon={History} title="Aucune version enregistrée" text="Enregistrez un brouillon dans Seating Studio."/>}
            {hasMore && <button type="button" className={secondaryClass} disabled={busy} onClick={()=>refresh(page+1)}>15 versions suivantes</button>}
            {busy && <p role="status" className="text-sm text-muted">Chargement…</p>}
            {selected && <section className="space-y-4 border-t border-line pt-5"><h3 className="font-display text-lg font-bold">Aperçu en lecture seule — v{selected.revision}</h3>
                <div className="grid gap-4 xl:grid-cols-2"><div><RevisionPreview plan={selected.plan} title={`Plan historique v${selected.revision}`}/></div>
                    {compare && <div><p className="mb-2 text-sm font-semibold">Dernière version v{compare.revision}</p><RevisionPreview plan={compare.plan} title={`Dernier plan v${compare.revision}`}/></div>}</div>
                {compare && <div className="grid gap-2 rounded-xl border border-line p-4 text-sm sm:grid-cols-3"><span>Sièges ajoutés : <strong>{compare.summary.added}</strong></span><span>Retirés : <strong>{compare.summary.removed}</strong></span><span>Déplacés : <strong>{compare.summary.moved}</strong></span>
                    <span>Zones modifiées : <strong>{compare.summary.zones}</strong></span><span>PMR modifiés : <strong>{compare.summary.pmr}</strong></span><span>Formes : <strong>{compare.summary.geometry?'Modifiées':'Identiques'}</strong></span><span>Scène : <strong>{compare.summary.stage?'Modifiée':'Identique'}</strong></span></div>}
                <button type="button" className={secondaryClass} onClick={()=>{setSelected(null);setCompare(null);}}>Fermer l’aperçu</button>
            </section>}
        </div>
    </Panel>;
}

export default function Layouts({rooms=[],current,selectedRoom,urls={},publications={},namedConfigurations={}}) {
    const available=rooms.filter(r=>!r.archived&&r.layout_revision);
    const selected=available.find(r=>r.id===selectedRoom)||available[0];
    return <div className="space-y-6"><div><span className="font-mono text-xs uppercase tracking-widest text-muted">Configurations des lieux</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Configurations et versions</h1><p className="mt-2 text-sm text-muted">Gérez plusieurs dispositions indépendantes pour une même salle et consultez l’historique du plan général.</p></div>
        <Panel title="Salles configurées"><div className="space-y-3">{available.length?available.map(room=><RoomRow key={room.id} room={room} href={venueLink(current,'layouts',room.id)} selected={room.id===selected?.id}/>)
            :<Empty icon={History} title="Aucun plan" text="Enregistrez un brouillon dans Seating Studio."/>}</div></Panel>
        {selected && <NamedConfigurations venue={selected} current={current} urls={urls} items={namedConfigurations[selected.id] || []} status={publications[selected.id] || {}}/>}
        {selected&&urls.revisionIndexPattern&&<HistoryForVenue key={selected.id} venue={selected} urls={urls} published={publications[selected.id]?.published_revision}/>}
    </div>;
}
