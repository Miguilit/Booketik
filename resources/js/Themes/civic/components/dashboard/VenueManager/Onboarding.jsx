import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Building2, LayoutGrid, ShieldCheck } from 'lucide-react';
import { Panel, inputClass, primaryClass } from './ui';

export default function Onboarding({ url }) {
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = e => {
        e.preventDefault();
        if (!url || busy || !name.trim()) return;
        router.post(url, { name: name.trim() }, { onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    };
    return <div className="grid items-start gap-7 xl:grid-cols-[1.1fr_1fr]"><div><span className="font-mono text-xs uppercase tracking-[.2em] text-muted">Venue Manager · Configuration initiale</span><h1 className="mt-3 font-display text-4xl font-bold leading-tight text-ink">Un espace dédié à vos lieux.</h1><p className="mt-4 max-w-xl text-base leading-relaxed text-muted">Gestion multi-salles, plans de placement et collaboration avec les organisateurs depuis un tableau de bord commun.</p><div className="mt-8 space-y-5">{[[Building2,'Centralisez vos salles','Une salle physique, une identité stable.'],[LayoutGrid,'Dessinez vos plans','Les configurations restent indépendantes des tarifs des événements.'],[ShieldCheck,'Maîtrisez les accès','Chaque organisateur reçoit explicitement une autorisation.']].map(([Icon,title,desc]) => <div key={title} className="flex items-start gap-4"><span className="rounded-xl bg-surface p-3 text-ink"><Icon className="h-5 w-5"/></span><div><p className="font-bold text-ink">{title}</p><p className="mt-1 text-sm text-muted">{desc}</p></div></div>)}</div></div><Panel title="Créer mon espace fournisseur" description="Cette première étape associe votre compte à un profil fournisseur. Les informations légales seront complétées dans une étape dédiée."><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold text-ink">Nom de l'organisation ou du gestionnaire<input required maxLength={160} autoComplete="organization" placeholder="Ex. Brussels Event Spaces" className={`mt-2 ${inputClass}`} value={name} onChange={e => setName(e.target.value)}/></label><button type="submit" disabled={!name.trim() || busy} className={`w-full ${primaryClass}`}>{busy ? 'Création…' : 'Créer mon espace fournisseur'}</button><p className="text-xs leading-relaxed text-muted">Ce profil ne constitue pas une vérification juridique. Il ne donne accès qu'aux salles que vous créez.</p></form></Panel></div>;
}
