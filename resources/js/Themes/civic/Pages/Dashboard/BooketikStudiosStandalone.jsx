import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import VenueProvider from '@/Themes/civic/components/dashboard/BooketikStudios/components/VenueProvider';
import VenueGovernance from '@/Themes/civic/components/dashboard/BooketikStudios/components/VenueGovernance';

export default function BooketikStudiosStandalone({ audience = 'venue_provider', provider, venues = [], venue, plan, layoutRevision = 0, urls = {}, governance = [] }) {
    const [providerName, setProviderName] = useState('');
    const [venueName, setVenueName] = useState('');
    const [venueAddress, setVenueAddress] = useState('');
    const [venueCity, setVenueCity] = useState('');
    const {errors = {}, flash = {}} = usePage().props;
    const field = 'block w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink';
    return <main className="min-h-screen bg-bg px-4 py-8 font-sans text-body sm:px-8">
        <Head title={audience === 'superadmin' ? 'Vérification des salles' : 'Fournisseur de salles'} />
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold text-ink">BOOKETIK — {audience === 'superadmin' ? 'Gouvernance des salles' : 'Fournisseur de salles'}</h1><a className="text-sm font-semibold text-link" href="/">Retour au site</a></div>
            {flash.success && <p role="status" className="rounded-lg border border-line bg-surface p-3 text-sm text-ink">{flash.success}</p>}
            {Object.keys(errors).length > 0 && <p role="alert" className="rounded-lg border border-red-200 p-3 text-sm text-red-700">{Object.values(errors).join(' · ')}</p>}
            {audience === 'superadmin' ? <VenueGovernance requests={governance} isSuperadmin/> : !provider ?
                <form className="max-w-lg space-y-3 rounded-xl border border-line bg-surface p-5" onSubmit={e => {e.preventDefault();router.post(urls.register, {name:providerName});}}>
                    <h2 className="text-lg font-bold text-ink">Enregistrer mon espace fournisseur</h2>
                    <label className="block text-sm font-semibold text-ink">Nom du fournisseur<input required maxLength={160} className={field} value={providerName} onChange={e => setProviderName(e.target.value)}/></label>
                    <button className="rounded-lg bg-ink px-4 py-2 font-semibold text-white" type="submit">Créer mon espace</button>
                </form> : <>
                    <p className="text-sm text-muted">{provider.name} · Capacité native, sans abonnement.</p>
                    <form className="grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-4" onSubmit={e => {e.preventDefault();router.post(urls.createVenue, {name:venueName,address_line1:venueAddress,city:venueCity,timezone:'Europe/Brussels'});}}>
                        <label className="text-sm text-ink">Salle<input required maxLength={160} className={field} value={venueName} onChange={e => setVenueName(e.target.value)}/></label>
                        <label className="text-sm text-ink">Adresse<input maxLength={255} className={field} value={venueAddress} onChange={e => setVenueAddress(e.target.value)}/></label>
                        <label className="text-sm text-ink">Ville<input maxLength={160} className={field} value={venueCity} onChange={e => setVenueCity(e.target.value)}/></label>
                        <div className="flex items-end"><button className="w-full rounded-lg bg-ink px-4 py-2 text-white" type="submit">Ajouter une salle</button></div>
                    </form>
                    {!!venues.length && <nav aria-label="Mes salles" className="flex flex-wrap gap-2">{venues.map(v => <a key={v.id} href={`?venue=${encodeURIComponent(v.id)}`} aria-current={v.id === venue?.id ? 'page' : undefined} className="rounded-lg border border-line px-3 py-2 text-sm text-ink">{v.name}</a>)}</nav>}
                    {venue && <VenueProvider key={venue.id} venue={venue} initialPlan={plan ?? undefined} layoutRevision={layoutRevision} urls={urls}/>}
                </>}
        </div>
    </main>;
}
