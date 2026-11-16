/*
 | Maps: OpenStreetMap raster tiles through Leaflet, loaded only
 | when a map is on screen. Markup-free: a theme hands over a container ref
 | and the HTML for its pins; this owns the map, the tiles, the attribution,
 | fitting the pins, keyboard focus and the "moved" callback.
 |
 | Tiles: https://tile.openstreetmap.org (usage policy: attribution, a real
 | User-Agent, no heavy use). Operators with traffic should point
 | `window.EVENTGOO_TILES` at their own tile server or a provider.
 */
import { useEffect, useRef, useState } from 'react';

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let leaflet = null;

export function loadLeaflet() {
    if (!leaflet) leaflet = import('leaflet').then((m) => m.default ?? m);
    return leaflet;
}

export function reducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * @param containerRef  ref to an empty div with a height
 * @param opts {
 *   center: [lat, lng], zoom, pins: [{ id, lat, lng, label, html, active }],
 *   pinClass: string, onSelect(pin), onMove({ bbox, center, zoom }), interactive, fit
 * }
 * @returns {{ ready, error, bbox }}
 */
export function useLeafletMap(containerRef, { center, zoom = 13, pins = [], pinClass = '', onSelect, onMove, interactive = true, fit = true } = {}) {
    const mapRef = useRef(null);
    const layerRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);
    const handlers = useRef({ onSelect, onMove });
    handlers.current = { onSelect, onMove };

    useEffect(() => {
        let cancelled = false;
        let observer = null;

        // Leaflet and its tiles load when the map nears the viewport, so a map
        // below the fold never competes with the cover image for bandwidth.
        const start = () => loadLeaflet().then((L) => {
            if (cancelled || !containerRef.current || mapRef.current) return;
            const map = L.map(containerRef.current, {
                center: center ?? [52.52, 13.405],
                zoom,
                zoomControl: interactive,
                dragging: interactive,
                scrollWheelZoom: false,
                keyboard: interactive,
                attributionControl: true,
                zoomAnimation: !reducedMotion(),
                fadeAnimation: !reducedMotion(),
            });
            L.tileLayer(window.EVENTGOO_TILES || OSM_TILES, { attribution: window.EVENTGOO_TILE_ATTRIBUTION || OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
            map.attributionControl.setPrefix(false);
            layerRef.current = L.layerGroup().addTo(map);
            map.on('moveend', () => {
                const b = map.getBounds();
                handlers.current.onMove?.({
                    bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => n.toFixed(4)).join(','),
                    center: [map.getCenter().lat, map.getCenter().lng],
                    zoom: map.getZoom(),
                });
            });
            mapRef.current = map;
            setReady(true);
        }).catch((e) => setError(e));

        if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
            observer = new IntersectionObserver((entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    observer.disconnect();
                    start();
                }
            }, { rootMargin: '200px' });
            observer.observe(containerRef.current);
        } else {
            start();
        }

        return () => {
            cancelled = true;
            observer?.disconnect();
            mapRef.current?.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pinKey = pins.map((p) => `${p.id}:${p.lat}:${p.lng}:${p.active ? 1 : 0}:${p.label}`).join('|');

    useEffect(() => {
        if (!ready) return;
        loadLeaflet().then((L) => {
            const layer = layerRef.current;
            const map = mapRef.current;
            if (!layer || !map) return;
            layer.clearLayers();
            const points = [];
            for (const pin of pins) {
                if (pin.lat == null || pin.lng == null) continue;
                const icon = L.divIcon({
                    className: `${pinClass}${pin.active ? ' is-active' : ''}`,
                    html: pin.html ?? '',
                    iconSize: null,
                    iconAnchor: [0, 0],
                });
                const marker = L.marker([pin.lat, pin.lng], { icon, title: pin.label, alt: pin.label, keyboard: true, riseOnHover: true });
                marker.on('click', () => handlers.current.onSelect?.(pin));
                marker.on('keypress', (e) => {
                    if (e.originalEvent?.key === 'Enter') handlers.current.onSelect?.(pin);
                });
                marker.addTo(layer);
                points.push([pin.lat, pin.lng]);
            }
            if (fit && points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 15, animate: !reducedMotion() });
            else if (points.length === 1) map.setView(points[0], Math.max(map.getZoom(), 14), { animate: !reducedMotion() });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, pinKey]);

    return { ready, error, map: mapRef };
}

/** A static OSM link for "Open in maps" when a venue has no directions URL. */
export function osmLink(lat, lng, zoom = 17) {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}
