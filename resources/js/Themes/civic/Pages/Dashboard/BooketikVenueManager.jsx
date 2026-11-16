import { usePage } from '@inertiajs/react';
import VenueShell, { tabs } from '@/Themes/civic/components/dashboard/VenueManager/Shell';
import Overview from '@/Themes/civic/components/dashboard/VenueManager/Overview';
import Rooms from '@/Themes/civic/components/dashboard/VenueManager/Rooms';
import Studio from '@/Themes/civic/components/dashboard/VenueManager/Studio';
import Partners from '@/Themes/civic/components/dashboard/VenueManager/Partners';
import Layouts from '@/Themes/civic/components/dashboard/VenueManager/Layouts';
import Publication from '@/Themes/civic/components/dashboard/VenueManager/Publication';
import Onboarding from '@/Themes/civic/components/dashboard/VenueManager/Onboarding';
import { Insights, Settings, Upcoming } from '@/Themes/civic/components/dashboard/VenueManager/InfoPages';

export default function BooketikVenueManager({ provider = null, venues = [], venue = null, plan = null, layoutRevision = 0, overview = null, publications = {}, namedConfigurations = {}, activeConfiguration = null, urls = {} }) {
    const page = usePage();
    const q = new URLSearchParams((page.url || '').split('?')[1] || '');
    const tabValue = q.get('tab') || 'overview';
    const tab = tabs.includes(tabValue) ? tabValue : 'overview';
    const roomId = venue?.id || q.get('venue') || null;
    const rooms = overview?.rooms || venues.map(v => ({ ...v, address: v.address_line1, seat_count: 0, layout_revision: 0, partner_count: 0 }));
    const metrics = overview?.metrics || null;
    const errors = page.props?.errors || {};
    const flash = page.props?.flash || {};
    const current = page.url || '/fr/venue-provider/studio';

    return <VenueShell provider={provider} tab={tab} roomId={roomId}>
        <div className="space-y-5">
            {flash.success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{flash.success}</div>}
            {flash.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{flash.error}</div>}
            {Object.keys(errors).length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{Object.values(errors).filter(x => typeof x === 'string').join(' · ')}</div>}
            {!provider ? <Onboarding url={urls.register}/> : <>
                {tab === 'overview' && <Overview provider={provider} rooms={rooms} metrics={metrics} current={current} selectedRoom={roomId}/>}
                {tab === 'rooms' && <Rooms rooms={rooms} urls={urls} current={current} selectedRoom={roomId}/>}
                {tab === 'studio' && <>
                    {activeConfiguration && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                        <span>Configuration : <strong>{activeConfiguration.name}</strong> · brouillon v{activeConfiguration.revision} (indépendant du plan général)</span>
                        <a className="underline" href={`${current.split('?')[0]}?tab=layouts&venue=${roomId}`}>Voir les configurations</a>
                    </div>}
                    <Studio key={`${roomId}-${activeConfiguration?.id || 'base'}-${layoutRevision}`} venue={venue} plan={plan} revision={layoutRevision} urls={urls} current={current}/>
                </>}
                {tab === 'layouts' && <Layouts rooms={rooms} current={current} selectedRoom={roomId} urls={urls} publications={publications} namedConfigurations={namedConfigurations}/>}
                {tab === 'publications' && <Publication rooms={rooms} publications={publications} selectedRoom={roomId} urls={urls} current={current}/>}
                {tab === 'partners' && <Partners rooms={rooms} venue={venue} urls={urls} current={current}/>}
                {tab === 'insights' && <Insights metrics={metrics}/>}
                {tab === 'settings' && <Settings provider={provider} urls={urls}/>}
                {(tab === 'events' || tab === 'team') && <Upcoming type={tab}/>}
            </>}
        </div>
    </VenueShell>;
}
