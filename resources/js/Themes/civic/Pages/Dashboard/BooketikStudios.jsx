import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { PageHead } from '@/Themes/civic/components/dashboard/kit';
import VenueProvider from '@/Themes/civic/components/dashboard/BooketikStudios/components/VenueProvider';
import OrganizerSeating from '@/Themes/civic/components/dashboard/BooketikStudios/components/OrganizerSeating';
import TicketStudio from '@/Themes/civic/components/dashboard/BooketikStudios/components/TicketStudio';
import VenueGovernance from '@/Themes/civic/components/dashboard/BooketikStudios/components/VenueGovernance';

const views = {
    venue_provider: [['venue', 'Mes salles']],
    organizer: [['seating', 'Plan de l’événement'], ['ticket', 'Ticket Studio']],
    superadmin: [['governance', 'Vérification des salles']],
};

export default function BooketikStudios({ audience = 'organizer', venue, plan, ticketTypes, ticketDesign, eventId, access = {}, governance = [], urls = {}, layoutRevisionId, initialMapping = {}, designRevision = 0 }) {
    const allowed = views[audience] || views.organizer;
    const [tab, setTab] = useState(allowed[0][0]);
    const current = allowed.some(([key]) => key === tab) ? tab : allowed[0][0];
    return <><Head title="BOOKETIK Studios"/><PageHead eyebrow="BOOKETIK Pro" title="Espaces de création" subtitle="Éditeur de salle et de billets — prévisualisation sans opérations en production"/>
        <nav aria-label="Espaces BOOKETIK" className="mb-6 flex flex-wrap gap-2">{allowed.map(([key,label]) => <button key={key} type="button" aria-current={current === key ? 'page' : undefined} onClick={() => setTab(key)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${current === key ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink'}`}>{label}</button>)}</nav>
        {current === 'venue' && <VenueProvider venue={venue ?? undefined} initialPlan={plan ?? undefined} urls={urls}/>}
        {current === 'seating' && !plan && <p role="alert" className="rounded-lg border border-line p-4 text-sm text-ink">Aucun plan de salle autorisé n'est associé à cet événement.</p>}
        {current === 'seating' && plan && <OrganizerSeating plan={plan ?? undefined} ticketTypes={ticketTypes ?? undefined} eventId={eventId} venueId={venue?.id} hasVenueAccess={access?.canUseVenue === true} urls={urls} layoutRevisionId={layoutRevisionId} initialMapping={initialMapping}/>}
        {current === 'ticket' && <TicketStudio initialDesign={ticketDesign ?? undefined} eventId={eventId} urls={urls} designRevision={designRevision}/>}
        {current === 'governance' && <VenueGovernance isSuperadmin={audience === 'superadmin'} requests={governance}/>}
    </>;
}

BooketikStudios.layout = dashLayout;
