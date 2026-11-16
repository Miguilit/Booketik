import { useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useMapPins } from '@/Core/discover';
import { t } from '@/Core/i18n';
import { Button, cn } from '../ui';
import { EventMini, EventRow } from '../events';
import MapView, { pinsFromEvents } from '../MapView';

/**
 * List beside map. Pins come from `/events/map?bbox=` for the visible area
 * (one per venue); before the first move, the loaded page's events stand in.
 */
export default function MapSplit({ events, filters, center }) {
    const { pins: venues, loading, load } = useMapPins(filters);
    const [selected, setSelected] = useState(null);

    const fromEvents = useMemo(() => pinsFromEvents(events), [events]);
    const usingVenues = venues.length > 0;

    const pins = usingVenues
        ? venues.map((v) => ({ id: v.venue_id, lat: v.lat, lng: v.lng, label: v.name, badge: String(v.event_count), active: selected?.id === v.venue_id, venue: v }))
        : fromEvents.map((p) => ({ ...p, active: selected?.id === p.id }));

    const start = center ?? (fromEvents[0] ? [fromEvents[0].lat, fromEvents[0].lng] : undefined);

    const select = (pin) => setSelected(pin.venue
        ? { id: pin.id, name: pin.venue.name, city: pin.venue.city, events: pin.venue.events }
        : { id: pin.id, name: pin.event?.venue?.name ?? pin.label, city: pin.event?.venue?.city, events: null, event: pin.event });

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
            <div className="order-2 lg:order-1">
                {selected ? (
                    <div className="rounded-card border-key border-edge bg-surface p-4 shadow-key" aria-live="polite">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 font-semibold text-ink"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{selected.name}</span></p>
                                {selected.city && <p className="text-sm text-muted">{selected.city}</p>}
                            </div>
                            <button type="button" onClick={() => setSelected(null)} aria-label={t('Close')} className="rounded-chip p-1.5 text-muted hover:bg-raised hover:text-ink">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mt-3 divide-y divide-line">
                            {selected.events
                                ? selected.events.map((e) => <EventMini key={e.slug} event={e} />)
                                : selected.event && <EventRow event={selected.event} />}
                        </div>
                    </div>
                ) : (
                    <p className="mb-2 text-sm text-muted">{loading ? t('Loading the map…') : t('Move the map to search that area. Pick a pin to see what is on there.')}</p>
                )}

                <div className="mt-4 max-h-none divide-y divide-line rounded-card border border-line bg-surface px-4 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto">
                    {events.length ? events.map((e) => <EventRow key={e.id} event={e} />) : (
                        <p className="py-6 text-center text-sm text-muted">{t('No events match these filters.')}</p>
                    )}
                </div>
            </div>

            <div className="order-1 lg:order-2">
                <div className="lg:sticky lg:top-24">
                    <MapView
                        pins={pins}
                        center={start}
                        zoom={12}
                        onSelect={select}
                        onMove={({ bbox }) => load(bbox)}
                        className={cn('h-[360px] lg:h-[calc(100vh-180px)]')}
                        label={t('Map of events')}
                    />
                    {selected && (
                        <Button variant="link" size="sm" className="mt-2 lg:hidden" onClick={() => setSelected(null)}>{t('Back to all pins')}</Button>
                    )}
                </div>
            </div>
        </div>
    );
}
