import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Activity, CalendarDays, Settings2, Users } from 'lucide-react';
import { Empty, Panel, Status, inputClass, primaryClass } from './ui';

export function Upcoming({ type }) {
    const info = {
        events: [CalendarDays, 'Calendrier des événements', 'Les réservations de dates, les occupations et les informations événementielles seront reliées aux permissions de chaque organisateur.'],
        team: [Users, 'Équipe et autorisations', 'Le partage sécurisé du compte fournisseur nécessitera des rôles de propriétaire, administrateur de salle et technicien de placement.'],
    }[type];
    const [Icon, title, text] = info;
    return <div className="space-y-6"><div className="flex items-center gap-3"><h1 className="font-display text-3xl font-bold text-ink">{title}</h1><Status>En préparation</Status></div><Empty icon={Icon} title="Cette section arrive dans une prochaine étape" text={text}/></div>;
}

export function Insights({ metrics }) {
    const items = [
        ['Salles actives', metrics?.venue_count],
        ['Salles archivées', metrics?.archived_count],
        ['Salles disposant d’un plan', metrics?.configured_venue_count],
        ['Sièges configurés', metrics?.seat_count],
        ['Accès organisateurs actifs', metrics?.partner_count],
    ];
    return <div className="space-y-6"><div><span className="font-mono text-xs uppercase tracking-widest text-muted">Données vérifiées</span><h1 className="mt-2 font-display text-3xl font-bold text-ink">Statistiques</h1><p className="mt-2 text-sm text-muted">Premières mesures calculées à partir des salles, plans enregistrés et autorisations réelles.</p></div><Panel title="Activité des salles"><div className="grid gap-4 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-xl border border-line p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{value ?? '—'}</p></div>)}</div><p className="mt-5 text-xs leading-relaxed text-muted">Les taux de remplissage et de fréquentation seront activés après raccordement des séances et des autorisations de consultation. Aucune donnée de recettes organisateur n'est exposée.</p></Panel></div>;
}

export function Settings({ provider, urls }) {
    const [name, setName] = useState(provider?.name || '');
    const [busy, setBusy] = useState(false);
    const submit = e => {
        e.preventDefault();
        if (!urls.updateProvider || busy || !name.trim()) return;
        router.post(urls.updateProvider, { name: name.trim() }, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    };
    return <div className="space-y-6"><h1 className="font-display text-3xl font-bold text-ink">Paramètres fournisseur</h1>
        <Panel title="Identité de l'espace" description="Les informations de l'entreprise ne modifient pas les données de facturation des organisateurs.">
            <form onSubmit={submit} className="space-y-4"><label className="block max-w-xl text-sm font-semibold text-ink">Nom du fournisseur<input className={`mt-2 ${inputClass}`} maxLength={160} required value={name} onChange={e => setName(e.target.value)}/></label><button disabled={busy || !name.trim() || name.trim() === provider?.name} type="submit" className={primaryClass}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></form>
            <dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between border-t border-line pt-4"><dt className="text-muted">État</dt><dd className="font-semibold text-ink">{provider?.status === 'active' ? 'Actif' : provider?.status || '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Fonctionnalités de salle</dt><dd className="font-semibold text-ink">Natives · Sans abonnement</dd></div></dl>
        </Panel><Empty icon={Settings2} title="Profil professionnel" text="La vérification légale, les coordonnées publiques et les rôles d'équipe feront l'objet d'une extension contrôlée."/>
    </div>;
}
