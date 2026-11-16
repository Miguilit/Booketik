import { ShieldCheck } from 'lucide-react';

export default function VenueGovernance({ requests = [], isSuperadmin = false }) {
    if (!isSuperadmin) return <p role="alert" className="text-sm text-muted">Accès superadmin requis.</p>;
    return <section className="space-y-4"><h2 className="flex items-center gap-2 text-xl font-bold text-ink"><ShieldCheck className="h-5 w-5"/>Gouvernance des salles</h2><p className="text-sm text-muted">Vérification des fournisseurs, litiges de propriété et doublons. Aucun tarif ni abonnement à administrer.</p>
        <div className="rounded-xl border border-line bg-surface p-4"><h3 className="font-semibold text-ink">Demandes à vérifier</h3>{requests.length ? <div className="mt-3 space-y-2">{requests.map(r => <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-2 text-sm text-ink" key={r.id}><strong>{r.venue_name}</strong><span>{r.kind}</span><span>{r.status}</span></div>)}</div> : <p className="mt-3 text-sm text-muted">Aucune demande transmise dans cet aperçu.</p>}</div>
        <p className="text-xs text-muted">Aucune action de modération n'est disponible avant l'API protégée et les journaux d'audit.</p>
    </section>;
}
