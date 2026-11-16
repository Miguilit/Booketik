import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Archive, CheckCircle2, FilePlus2, Pencil, RotateCcw } from 'lucide-react';
import { Empty, Panel, primaryClass, secondaryClass, inputClass } from './ui';

const VENUE = '00000000-0000-0000-0000-000000000000';
const CONFIG = '11111111-1111-1111-1111-111111111111';
const actionUrl = (pattern, venueId, configId) => (pattern || '').replace(VENUE, venueId).replace(CONFIG, configId || CONFIG);

export default function NamedConfigurations({ venue, current, urls = {}, items = [], status = {} }) {
    const [name, setName] = useState('');
    const [revision, setRevision] = useState('');
    const [archived, setArchived] = useState(false);
    const [busy, setBusy] = useState(false);
    const route = (pattern, item) => actionUrl(pattern, venue.id, item?.id);
    const submit = (pattern, item, payload, question) => {
        if (busy || !pattern || (question && !window.confirm(question))) return;
        router.post(route(pattern, item), payload, {
            preserveScroll: true,
            onStart: () => setBusy(true), onFinish: () => setBusy(false),
            onSuccess: () => { if (!item) { setName(''); setRevision(''); } },
        });
    };
    const target = item => `${current.split('?')[0]}?tab=studio&venue=${encodeURIComponent(venue.id)}&configuration=${encodeURIComponent(item.id)}`;
    const visible = (items || []).filter(c => archived || c.status === 'active');
    return <Panel title="Configurations nommées" description="Théâtre, conférence, cocktail… Chaque configuration possède ses propres brouillons. Une seule version est publiée à la fois pour les nouvelles utilisations de la salle.">
        <div className="space-y-5">
            <form className="flex flex-wrap items-end gap-3" onSubmit={event => {
                event.preventDefault();
                submit(urls.configCreatePattern, null, { name: name.trim(), source_revision: revision ? Number(revision) : null });
            }}>
                <label className="min-w-44 flex-1 text-sm font-semibold text-ink">Nom de la nouvelle configuration
                    <input required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} className={`mt-2 ${inputClass}`} placeholder="Ex. Conférence"/>
                </label>
                <label className="w-32 text-sm font-semibold text-ink">Copier la version
                    <input type="number" min="1" max="10000000" step="1" value={revision} onChange={e => setRevision(e.target.value)} className={`mt-2 ${inputClass}`} placeholder="Dernière"/>
                </label>
                <button type="submit" disabled={busy || name.trim().length < 2} className={primaryClass}><FilePlus2 className="h-4 w-4"/>Créer</button>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-xs text-muted">Créer copie un plan existant sans modifier le plan général ni la publication actuelle.</p>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archived} onChange={e => setArchived(e.target.checked)}/>Afficher les archives</label>
            </div>
            {visible.length ? <ul className="space-y-3">{visible.map(item => <li key={item.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-semibold text-ink">{item.name} {item.published && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-900">Publiée</span>}{item.status === 'archived' && <span className="ml-2 rounded-full bg-stone-100 px-2 py-1 text-xs">Archivée</span>}</p>
                        <p className="mt-1 text-xs text-muted">Brouillon v{item.revision} · {item.seat_count} sièges</p></div>
                    <div className="flex flex-wrap gap-2">
                        {item.status === 'active' && <>
                            <a href={target(item)} className={secondaryClass}><Pencil className="h-4 w-4"/>Éditer</a>
                            <button type="button" disabled={busy || (item.published && item.revision === item.published_configuration_revision)} className={primaryClass}
                                onClick={() => submit(urls.configPublishPattern, item, {
                                    expected_configuration_revision: item.revision, expected_event_id: status?.event_id ?? null,
                                }, `Publier « ${item.name} » v${item.revision} ? Les nouvelles utilisations prendront ce plan. Les événements existants conserveront leur version.`)}>
                                <CheckCircle2 className="h-4 w-4"/>Publier</button>
                            <button type="button" disabled={busy} className={secondaryClass} onClick={() => {
                                const next = window.prompt('Nouveau nom de la configuration', item.name);
                                if (next && next.trim() !== item.name) submit(urls.configRenamePattern, item, { name: next.trim() });
                            }}>Renommer</button>
                            <button type="button" disabled={busy || item.published} className={secondaryClass} onClick={() => submit(urls.configArchivePattern, item, {}, `Archiver « ${item.name} » ? Les plans restent conservés.`)}><Archive className="h-4 w-4"/>Archiver</button>
                        </>}
                        {item.status === 'archived' && <button type="button" disabled={busy} className={secondaryClass} onClick={() => submit(urls.configRestorePattern, item, {})}><RotateCcw className="h-4 w-4"/>Restaurer</button>}
                    </div>
                </div>
            </li>)}</ul> : <Empty icon={FilePlus2} title="Aucune configuration nommée" text="Créez une première disposition à partir d'un plan déjà enregistré."/>}
        </div>
    </Panel>;
}
