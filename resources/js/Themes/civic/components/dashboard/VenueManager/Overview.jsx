import { Building2, LayoutGrid, Plus, Ticket, UsersRound } from 'lucide-react';
import { ActionLink, Empty, Panel, RoomRow, Status, primaryClass } from './ui';
import { venueLink } from './Shell';

function Metric({ icon: Icon, value, label, hint }) {
    return <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6"><div className="mb-5 flex items-center justify-between text-muted"><span className="text-sm font-medium">{label}</span><Icon className="h-5 w-5"/></div><strong className="font-display text-3xl font-bold tabular-nums text-ink">{value}</strong><p className="mt-2 text-xs text-muted">{hint}</p></div>;
}

export default function Overview({ provider, rooms, metrics, current, selectedRoom }) {
    const stats = metrics || {};
    return <div className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><span className="font-mono text-xs font-semibold uppercase tracking-[.2em] text-muted">Venue Manager</span><h1 className="mt-2 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">Gérez vos lieux, simplement.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Les salles, leur capacité et leurs configurations, réunies dans un seul espace.</p></div><a href={venueLink(current, 'rooms')} className={primaryClass}><Plus className="h-4 w-4"/>Gérer mes salles</a></div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric icon={Building2} label="Salles" value={stats.venue_count ?? '—'} hint="Espaces enregistrés"/>
            <Metric icon={LayoutGrid} label="Plans créés" value={stats.configured_venue_count ?? '—'} hint="Salles avec plan enregistré"/>
            <Metric icon={Ticket} label="Sièges configurés" value={stats.seat_count ?? '—'} hint="Sur les dernières révisions"/>
            <Metric icon={UsersRound} label="Autorisations" value={stats.partner_count ?? '—'} hint="Accès organisateurs actifs"/>
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Panel title="Mes salles" description="Accédez à la configuration de chaque lieu." action={<ActionLink href={venueLink(current, 'rooms')}>Tout afficher</ActionLink>}>
                {rooms.length ? <div className="space-y-3">{rooms.slice(0, 6).map(room => <RoomRow key={room.id} room={room} href={venueLink(current, 'studio', room.id)} selected={room.id === selectedRoom}/>)}</div> : <Empty icon={Building2} title="Votre première salle" text="Ajoutez un lieu, puis construisez son premier plan de placement." action={<a href={venueLink(current, 'rooms')} className={primaryClass}>Ajouter une salle</a>}/>}
            </Panel>
            <div className="space-y-5">
                <section className="rounded-2xl bg-ink p-6 text-bg"><span className="font-mono text-[11px] uppercase tracking-[.18em] text-bg/70">À construire ensemble</span><h2 className="mt-4 font-display text-2xl font-bold">Des plans fidèles à vos salles.</h2><p className="mt-3 text-sm leading-relaxed text-bg/80">Scène, rangées, sièges et zones. La tarification restera sous le contrôle de l'organisateur.</p><a href={venueLink(current, 'studio', selectedRoom)} className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-bg px-4 py-2 text-sm font-bold text-ink">Ouvrir le Seating Studio</a></section>
                <Panel title="Mise en place"><ol className="space-y-4 text-sm"><li className="flex items-center justify-between gap-3"><span>1. Espace fournisseur</span><Status tone="success">{provider ? 'Terminé' : 'À faire'}</Status></li><li className="flex items-center justify-between gap-3"><span>2. Première salle</span><Status tone={rooms.length ? 'success' : 'attention'}>{rooms.length ? 'Terminé' : 'À faire'}</Status></li><li className="flex items-center justify-between gap-3"><span>3. Plan de placement</span><Status tone={(stats.configured_venue_count || 0) ? 'success' : 'attention'}>{(stats.configured_venue_count || 0) ? 'En cours' : 'À faire'}</Status></li><li className="flex items-center justify-between gap-3"><span>4. Événement avec placement</span><Status>Non activé</Status></li></ol></Panel>
            </div>
        </div>
    </div>;
}
