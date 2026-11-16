import { useRef } from 'react';
import { useLeafletMap } from '@/Core/map';
import { priceLabel } from '@/Core/events';
import { cn } from './ui';

function esc(text) {
    return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/**
 * An OSM map with sticker pins. `pins`: `[{ id, lat, lng, label, badge, active }]`.
 * The container sets the height; attribution stays visible (tile policy).
 */
export default function MapView({ pins = [], center, zoom = 13, onSelect, onMove, interactive = true, fit = true, className, label }) {
    const ref = useRef(null);
    useLeafletMap(ref, {
        center,
        zoom,
        interactive,
        fit,
        onSelect,
        onMove,
        pinClass: 'al-pin',
        pins: pins.map((p) => ({
            ...p,
            html: `<span class="al-pin__dot">${esc(p.badge ?? '')}</span>`,
        })),
    });

    return <div ref={ref} className={cn('isolate overflow-hidden rounded-card border border-line bg-raised', className)} role="region" aria-label={label} />;
}

/** Pins from EventSummaries (venue lat/lng; hidden venues have none). */
export function pinsFromEvents(events, activeId) {
    return (events ?? [])
        .filter((e) => e.venue?.lat != null && e.venue?.lng != null)
        .map((e) => ({ id: e.id, slug: e.slug, lat: e.venue.lat, lng: e.venue.lng, label: e.title, badge: priceLabel(e.price) ?? (e.external ? '?' : ''), active: e.id === activeId, event: e }));
}
