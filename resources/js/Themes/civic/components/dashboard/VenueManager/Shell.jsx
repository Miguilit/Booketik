import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, Building2, CalendarDays, ChevronDown, DoorOpen, Gauge, LayoutGrid, Menu, Monitor, Settings2, ShieldCheck, Share2, Users, UsersRound, X } from 'lucide-react';
import Wordmark from '@/Themes/civic/components/chrome/Wordmark';
import ModeToggle from '@/Themes/civic/components/chrome/ModeToggle';

const links = [
    { id: 'overview', title: "Vue d'ensemble", icon: Gauge },
    { id: 'rooms', title: 'Mes salles', icon: Building2 },
    { id: 'studio', title: 'Seating Studio', icon: LayoutGrid },
    { id: 'layouts', title: 'Configurations', icon: Monitor },
    { id: 'publications', title: 'Publication', icon: Share2 },
    { id: 'events', title: 'Événements', icon: CalendarDays, upcoming: true },
    { id: 'partners', title: 'Organisateurs', icon: UsersRound },
    { id: 'insights', title: 'Statistiques', icon: Activity },
    { id: 'team', title: 'Équipe', icon: Users, upcoming: true },
    { id: 'settings', title: 'Paramètres', icon: Settings2 },
];

export const tabs = links.map(({ id }) => id);

export function venueLink(current, tab, roomId) {
    const path = (current || '/fr/venue-provider/studio').split('?')[0];
    const q = new URLSearchParams();
    if (tab && tab !== 'overview') q.set('tab', tab);
    if (roomId) q.set('venue', roomId);
    const str = q.toString();
    return str ? `${path}?${str}` : path;
}

function Sidebar({ current, tab, roomId, provider, onClose }) {
    return <div className="flex h-full flex-col gap-5">
        <div className="flex min-h-12 items-center justify-between"><Wordmark size="sm"/>{onClose && <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-ink lg:hidden"><X/></button>}</div>
        <div className="rounded-xl border border-line bg-bg p-3">
            <span className="block font-mono text-[10px] uppercase tracking-[.2em] text-muted">Fournisseur de salle</span>
            <div className="mt-2 flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-bg"><DoorOpen className="h-5 w-5"/></span><span className="min-w-0 flex-1"><span className="block truncate font-display font-bold text-ink">{provider?.name || 'Nouvel espace'}</span><span className="block text-xs text-muted">{provider ? 'Gestion des lieux' : 'Configuration initiale'}</span></span><ChevronDown className="h-4 w-4 text-muted"/></div>
        </div>
        <nav aria-label="Navigation du gestionnaire de salles" className="space-y-1">
            {links.map(({ id, title, icon: Icon, upcoming }) => {
                const selected = id === tab;
                return <Link key={id} href={venueLink(current, id, roomId)} onClick={onClose} aria-current={selected ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14px] font-semibold transition ${selected ? 'bg-ink text-bg' : 'text-ink hover:bg-raised'}`}>
                    <Icon className="h-[18px] w-[18px] shrink-0"/><span className="flex-1">{title}</span>{upcoming && <span className={`text-[10px] ${selected ? 'text-bg/70' : 'text-muted'}`}>Bientôt</span>}
                </Link>;
            })}
        </nav>
        <div className="mt-auto border-t border-line pt-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4"/>Accès natif · Aucun abonnement</div>
            <div className="flex items-center justify-between"><Link href="/" className="text-sm font-semibold text-link hover:underline">Retour au site</Link><ModeToggle/></div>
        </div>
    </div>;
}

export default function VenueShell({ provider, tab, roomId, children }) {
    const page = usePage();
    const [drawer, setDrawer] = useState(false);
    const current = page.url;
    return <div className="min-h-screen bg-bg font-sans text-body">
        <Head title={`Gestion des salles · BOOKETIK`}><meta name="robots" content="noindex,nofollow"/></Head>
        <a href="#venue-main" className="skip-link">Aller au contenu</a>
        <aside className="fixed inset-y-0 start-0 hidden w-[272px] overflow-y-auto border-e border-line bg-surface px-4 pb-5 pt-3 lg:block"><Sidebar current={current} tab={tab} roomId={roomId} provider={provider}/></aside>
        {drawer && <div className="fixed inset-0 z-[80] lg:hidden"><button type="button" className="absolute inset-0 bg-black/50" aria-label="Fermer le menu" onClick={() => setDrawer(false)}/><aside className="absolute inset-y-0 start-0 w-[min(90vw,320px)] overflow-y-auto bg-surface p-4 shadow-xl"><Sidebar current={current} tab={tab} roomId={roomId} provider={provider} onClose={() => setDrawer(false)}/></aside></div>}
        <div className="lg:ms-[272px]">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-line bg-bg/95 px-4 backdrop-blur sm:px-8">
                <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setDrawer(true)} className="rounded-xl border border-line bg-surface p-2 lg:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5"/></button><div className="min-w-0"><span className="block truncate text-xs text-muted">BOOKETIK Pro / Gestion des salles</span><span className="block truncate text-sm font-bold text-ink">{links.find(x => x.id === tab)?.title || "Vue d'ensemble"}</span></div></div>
                <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1 text-xs font-medium text-muted sm:inline-flex"><span className="h-2 w-2 rounded-full bg-emerald-500"/>{provider ? 'Espace actif' : 'À configurer'}</span>
            </header>
            <main id="venue-main" className="mx-auto w-full max-w-[1380px] px-4 pb-20 pt-7 sm:px-8 sm:pt-10">{children}</main>
        </div>
    </div>;
}
