/* The Basics tab's pieces: cover upload, tag chips, the venue picker and the copy helper. */
import { useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ImageUp, MapPin, PenLine, Search, X } from 'lucide-react';
import { errorMessage, useAction, useDashboard, useGeocode } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { Button, Chip, cn, Field, Img, Input, Modal, Notice, Select } from '../../ui';

/** Upload a cover through the org media endpoint, then hand back `{ id, image }`. */
export function CoverUpload({ cover, onUploaded }) {
    const { org, user } = useDashboard();
    const input = useRef(null);
    const [busy, setBusy] = useState(false);

    const upload = async (file) => {
        if (!file) return;
        setBusy(true);
        try {
            const body = new FormData();
            body.append('cover', file);
            const res = await axios.post(`/api/v1/org/${org.slug}/media/cover`, body, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${user?.token}` },
            });
            onUploaded(res.data?.data);
        } catch (error) {
            const err = error?.response?.data?.error;
            toast.error(err?.fields?.cover?.[0] ?? err?.message ?? t('That image could not be uploaded.'));
        } finally {
            setBusy(false);
            if (input.current) input.current.value = '';
        }
    };

    return (
        <div className="space-y-3">
            <div className="relative aspect-[3/2] w-full max-w-md overflow-hidden rounded-card border border-line bg-raised">
                {cover?.image ? <Img image={cover.image} alt={t('Cover')} className="absolute inset-0 !h-full !w-full" /> : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">{t('No cover yet')}</div>
                )}
            </div>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t('Image file')} tabIndex={-1} onChange={(e) => upload(e.target.files?.[0])} />
            <Button variant="secondary" size="sm" icon={ImageUp} loading={busy} onClick={() => input.current?.click()}>
                {cover ? t('Replace cover') : t('Upload a cover')}
            </Button>
            <p className="text-xs text-muted">{t('JPEG, PNG or WebP. 3:2 works best; 1800 × 1200 or larger.')}</p>
        </div>
    );
}

/** Free-text tags as chips; Enter or comma adds, suggestions add on click. */
export function TagInput({ value, onChange, suggestions = [] }) {
    const [draft, setDraft] = useState('');
    const add = (raw) => {
        const name = raw.trim().replace(/,$/, '');
        if (name.length < 2 || value.some((v) => v.toLowerCase() === name.toLowerCase()) || value.length >= 12) return;
        onChange([...value, name]);
    };
    const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 10);

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {value.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-chip bg-ink px-3 py-1.5 text-sm font-semibold text-bg">
                        {tag}
                        <button type="button" onClick={() => onChange(value.filter((v) => v !== tag))} aria-label={t('Remove :tag', { tag })} className="rounded-full p-0.5 hover:bg-bg/20">
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                    </span>
                ))}
            </div>
            <Input
                id="tags-input"
                value={draft}
                placeholder={t('Type a tag and press Enter')}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        add(draft);
                        setDraft('');
                    }
                }}
            />
            {unused.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {unused.map((s) => <button key={s} type="button" onClick={() => add(s)} className="rounded-chip border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:border-edge">+ {s}</button>)}
                </div>
            )}
        </div>
    );
}

/** Pick one of the organizer's venues, or search OpenStreetMap — on a button press, never per keystroke. */
export function VenuePicker({ venue, venues = [], country, onPick }) {
    const { api } = useDashboard();
    const geo = useGeocode(api);
    const [q, setQ] = useState('');

    return (
        <div className="space-y-3">
            {venue ? (
                <div className="flex items-start gap-3 rounded-sm border border-line bg-raised p-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{venue.name}</p>
                        <p className="text-sm text-muted">{[venue.address, venue.postal_code, venue.city].filter(Boolean).join(', ') || t('No address yet')}</p>
                        {venue.lat !== null && venue.lat !== undefined && <p className="font-mono text-xs text-muted">{Number(venue.lat).toFixed(5)}, {Number(venue.lng).toFixed(5)}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => onPick(null)}>{t('Clear')}</Button>
                </div>
            ) : <Notice tone="info">{t('No venue chosen.')}</Notice>}

            {venues.length > 0 && (
                <Field label={t('One of your venues')} htmlFor="known-venue">
                    <Select id="known-venue" value="" onChange={(e) => e.target.value && onPick({ id: e.target.value }, venues.find((v) => v.id === e.target.value))}>
                        <option value="">{t('Choose…')}</option>
                        {venues.map((v) => <option key={v.id} value={v.id}>{v.name}{v.city ? ` — ${v.city}` : ''}</option>)}
                    </Select>
                </Field>
            )}

            <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); geo.search(q, country); }}>
                <label htmlFor="venue-search" className="text-sm font-semibold text-ink">{t('Find a place')}</label>
                <div className="flex gap-2">
                    <Input id="venue-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Venue name and city, or an address')} />
                    <Button type="submit" variant="secondary" icon={Search} loading={geo.busy} disabled={q.trim().length < 3}>{t('Search')}</Button>
                </div>
                <p className="text-xs text-muted">{t('Search powered by OpenStreetMap Nominatim. © OpenStreetMap contributors.')}</p>
            </form>

            {geo.results && (
                geo.results.length === 0 ? <p className="text-sm text-muted">{t('No places found. Try adding the city.')}</p> : (
                    <ul className="divide-y divide-line rounded-sm border border-line">
                        {geo.results.map((r) => (
                            <li key={r.osm_id}>
                                <button
                                    type="button"
                                    className="flex w-full items-start gap-2 px-3 py-2.5 text-start hover:bg-raised"
                                    onClick={() => {
                                        onPick({ name: r.name, address: r.address, city: r.city, postal_code: r.postal_code, lat: r.lat, lng: r.lng, place_id: r.osm_id }, r);
                                        geo.clear();
                                    }}
                                >
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                                    <span className="min-w-0"><span className="block font-semibold text-ink">{r.name}</span><span className="block truncate text-sm text-muted">{r.display}</span></span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )
            )}
        </div>
    );
}

const TONES = [['friendly', 'Friendly'], ['professional', 'Professional'], ['hype', 'Hype']];

/** The copy studio: draft a description or summary, preview, accept. */
export function CopyHelper({ eventId, purpose, onAccept, label }) {
    const { api, org } = useDashboard();
    const { run, busy } = useAction();
    const [open, setOpen] = useState(false);
    const [tone, setTone] = useState('friendly');
    const [result, setResult] = useState(null);

    const write = async () => {
        const data = await run(() => api.post('/ai/describe', { purpose, event_id: eventId, org: org.slug, tone }), { key: 'describe' });
        if (data) setResult(data);
    };

    return (
        <>
            <Button size="sm" variant="ghost" icon={PenLine} onClick={() => setOpen(true)}>{label ?? t('Write it for me')}</Button>
            <Modal open={open} onClose={() => setOpen(false)} title={purpose === 'summary' ? t('Draft a summary') : t('Draft a description')} size="lg">
                <div className="space-y-4">
                    <p className="text-sm text-muted">{t('Written from this event’s details. Nothing changes until you accept it. Uses one AI credit.')}</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t('Tone')}>
                        {TONES.map(([key, name]) => <Chip key={key} active={tone === key} onClick={() => setTone(key)}>{t(name)}</Chip>)}
                    </div>
                    <Button variant="primary" icon={PenLine} loading={busy === 'describe'} onClick={write}>{result ? t('Write another') : t('Write it')}</Button>
                    {result && (
                        <div className="space-y-3">
                            <div className={cn('max-h-72 overflow-y-auto whitespace-pre-line rounded-sm border border-line bg-raised p-4 text-[15px] text-body')}>{result.text}</div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setOpen(false)}>{t('Discard')}</Button>
                                <Button variant="primary" onClick={() => { onAccept(result.text); setOpen(false); setResult(null); toast.success(t('Added — review it, then save.')); }}>{t('Use this')}</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}

export { errorMessage };
