import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { timeZones } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { Button, Field, Input, Select, Textarea, Toggle } from '../../ui';
import { ZonedDateTime } from '../kit';
import RichTextEditor from '../RichTextEditor';
import { CopyHelper, CoverUpload, TagInput, VenuePicker } from './basicsParts';
import { Section, textToHtml, useEventSave } from './shared';

const MODULES = [
    ['tickets', 'Tickets', 'Tiers, checkout and the door.'],
    ['agenda', 'Agenda', 'Tracks and sessions — makes this a conference.'],
    ['speakers', 'Speakers', 'Speaker pages and the call for speakers.'],
    ['sponsors', 'Sponsors', 'A sponsor wall on the event page.'],
    ['networking', 'Networking', 'Attendees can find each other.'],
    ['qna', 'Q&A', 'Questions to the organizer on the event page.'],
    ['album', 'Album', 'Guests share photos after the event.'],
];

function initial(event) {
    return {
        title: event.title ?? '',
        summary: event.summary ?? '',
        description_html: event.description_html ?? '',
        category_slug: event.category_slug ?? '',
        tags: event.tags ?? [],
        format: event.format,
        timezone: event.timezone,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        doors_at: event.doors_at,
        venue: event.venue,
        venue_hidden_until_rsvp: event.venue_hidden_until_rsvp,
        online_url: event.online_url ?? '',
        online_reveal_minutes: event.online_reveal_minutes ?? 30,
        modules: event.modules ?? {},
        age_min: event.age_min ?? '',
        refund_policy: event.refund_policy ?? '',
        visibility: event.visibility,
    };
}

export default function Basics({ event, data }) {
    const { save, busy, errors } = useEventSave(event);
    const start = useMemo(() => initial(event), [event]);
    const [form, setForm] = useState(start);
    const [venueChange, setVenueChange] = useState(undefined);
    const [editorKey, setEditorKey] = useState(0);
    const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
    const zones = useMemo(() => timeZones(form.timezone), [form.timezone]);
    const online = form.format !== 'in_person';

    const changes = () => {
        const out = {};
        for (const key of Object.keys(start)) {
            if (key === 'venue') continue;
            if (JSON.stringify(form[key]) !== JSON.stringify(start[key])) out[key] = form[key];
        }
        if ('category_slug' in out) {
            out.category = out.category_slug ? { slug: out.category_slug } : null;
            delete out.category_slug;
        }
        if ('age_min' in out) out.age_min = out.age_min === '' ? null : Number(out.age_min);
        if ('online_reveal_minutes' in out) out.online_reveal_minutes = Number(out.online_reveal_minutes) || 0;
        for (const key of ['summary', 'refund_policy', 'online_url']) if (key in out && out[key] === '') out[key] = null;
        if (venueChange !== undefined) out.venue = venueChange;
        return out;
    };

    const submit = async (e) => {
        e.preventDefault();
        const diff = changes();
        if (!Object.keys(diff).length) return;
        const ok = await save(diff, { success: t('Saved') });
        if (ok) setVenueChange(undefined);
    };

    const err = (k) => errors[k];

    return (
        <form onSubmit={submit} noValidate>
            <Section title={t('What it is')} description={t('The name, the one-line summary and the full description on the event page.')}>
                <Field label={t('Title')} htmlFor="title" required error={err('title')}>
                    <Input id="title" value={form.title} onChange={(e) => set('title')(e.target.value)} maxLength={140} invalid={!!err('title')} />
                </Field>
                <Field label={t('Summary')} htmlFor="summary" error={err('summary')} hint={<CopyHelper eventId={event.id} purpose="summary" onAccept={(text) => set('summary')(text.slice(0, 255))} />}>
                    <Textarea id="summary" value={form.summary} onChange={(e) => set('summary')(e.target.value)} maxLength={255} className="min-h-[72px]" />
                </Field>
                <Field label={t('Description')} htmlFor="description" error={err('description_html')} hint={<CopyHelper eventId={event.id} purpose="description" onAccept={(text) => { set('description_html')(textToHtml(text)); setEditorKey((k) => k + 1); }} />}>
                    <RichTextEditor key={editorKey} id="description" label={t('Description')} value={form.description_html} onChange={set('description_html')} placeholder={t('What happens, who it is for, what to bring.')} />
                </Field>
            </Section>

            <Section title={t('Cover')} description={t('Shown on cards, the event page and the share image.')}>
                <CoverUpload cover={event.cover} onUploaded={(media) => media && save({ cover_media_id: Number(media.id) }, { success: t('Cover updated'), key: 'cover' })} />
            </Section>

            <Section title={t('Category and tags')}>
                <Field label={t('Category')} htmlFor="category">
                    <Select id="category" value={form.category_slug} onChange={(e) => set('category_slug')(e.target.value)}>
                        <option value="">{t('No category')}</option>
                        {(data?.categories ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    </Select>
                </Field>
                <Field label={t('Tags')} htmlFor="tags-input" error={err('tags')}>
                    <TagInput value={form.tags} onChange={set('tags')} suggestions={data?.tag_suggestions ?? []} />
                </Field>
            </Section>

            <Section title={t('When')} description={t('Times are in the event’s own time zone; guests elsewhere see their own time too.')}>
                <Field label={t('Time zone')} htmlFor="timezone">
                    <Select id="timezone" value={form.timezone} onChange={(e) => set('timezone')(e.target.value)}>
                        {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                    </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label={t('Starts')} htmlFor="starts_at" required error={err('starts_at')}>
                        <ZonedDateTime id="starts_at" value={form.starts_at} timeZone={form.timezone} onChange={set('starts_at')} invalid={!!err('starts_at')} />
                    </Field>
                    <Field label={t('Ends')} htmlFor="ends_at" error={err('ends_at')}>
                        <ZonedDateTime id="ends_at" value={form.ends_at} timeZone={form.timezone} onChange={set('ends_at')} invalid={!!err('ends_at')} />
                    </Field>
                    <Field label={t('Doors')} htmlFor="doors_at" error={err('doors_at')}>
                        <ZonedDateTime id="doors_at" value={form.doors_at} timeZone={form.timezone} onChange={set('doors_at')} />
                    </Field>
                </div>
            </Section>

            <Section title={t('Where')}>
                <Field label={t('Format')} htmlFor="format">
                    <Select id="format" value={form.format} onChange={(e) => set('format')(e.target.value)}>
                        <option value="in_person">{t('In person')}</option>
                        <option value="online">{t('Online')}</option>
                        <option value="hybrid">{t('Hybrid')}</option>
                    </Select>
                </Field>
                {form.format !== 'online' && (
                    <>
                        <VenuePicker venue={form.venue} venues={data?.venues ?? []} country={data?.country_code}
                            onPick={(payload, shown) => { setVenueChange(payload); setForm((f) => ({ ...f, venue: shown ?? (payload ? { ...payload } : null) })); }} />
                        {err('venue.name') && <p className="text-sm font-medium text-danger">{err('venue.name')}</p>}
                        <Toggle checked={form.venue_hidden_until_rsvp} onChange={set('venue_hidden_until_rsvp')} label={t('Hide the address until people register')} description={t('The page shows the area; guests see the exact place once they are in.')} />
                    </>
                )}
                {online && (
                    <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                        <Field label={t('Online link')} htmlFor="online_url" error={err('online_url')}>
                            <Input id="online_url" type="url" value={form.online_url} onChange={(e) => set('online_url')(e.target.value)} placeholder="https://" invalid={!!err('online_url')} />
                        </Field>
                        <Field label={t('Reveal (minutes before)')} htmlFor="reveal">
                            <Input id="reveal" type="number" min={0} value={form.online_reveal_minutes} onChange={(e) => set('online_reveal_minutes')(e.target.value)} />
                        </Field>
                    </div>
                )}
            </Section>

            <Section title={t('Modules')} description={t('Switch on what this event needs. An agenda makes it a conference.')}>
                <div className="divide-y divide-line">
                    {MODULES.map(([key, label, description]) => (
                        <Toggle key={key} checked={Boolean(form.modules?.[key])} onChange={(on) => set('modules')({ ...form.modules, [key]: on })} label={t(label)} description={t(description)} />
                    ))}
                </div>
            </Section>

            <Section title={t('Details')}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('Visibility')} htmlFor="visibility">
                        <Select id="visibility" value={form.visibility} onChange={(e) => set('visibility')(e.target.value)}>
                            <option value="public">{t('Public — listed and searchable')}</option>
                            <option value="unlisted">{t('Unlisted — only with the link')}</option>
                            <option value="private">{t('Private — invite only')}</option>
                        </Select>
                    </Field>
                    <Field label={t('Minimum age')} htmlFor="age_min" error={err('age_min')}>
                        <Input id="age_min" type="number" min={0} max={99} value={form.age_min} onChange={(e) => set('age_min')(e.target.value)} />
                    </Field>
                </div>
                <Field label={t('Refund policy')} htmlFor="refund_policy">
                    <Input id="refund_policy" value={form.refund_policy} onChange={(e) => set('refund_policy')(e.target.value)} maxLength={255} placeholder={t('e.g. Refunds up to 7 days before the event')} />
                </Field>
            </Section>

            <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-line bg-bg/95 px-4 py-3 sm:mx-0 sm:px-0">
                <Button type="button" variant="ghost" onClick={() => { setForm(start); setVenueChange(undefined); setEditorKey((k) => k + 1); }}>{t('Undo changes')}</Button>
                <Button type="submit" variant="primary" icon={Save} loading={busy === 'save'}>{t('Save')}</Button>
            </div>
        </form>
    );
}
