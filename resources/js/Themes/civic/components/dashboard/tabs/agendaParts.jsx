/* The Agenda tab's forms: one form per kind (tracks, sessions, speakers, sponsors) and the call for speakers. */
import { useState } from 'react';
import { Check, Clock, Minus, Plus, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { useAvailability } from '@/Core/conference';
import { t } from '@/Core/i18n';
import { Button, Checkbox, cn, EmptyState, Field, Input, Select, Tag, Textarea } from '../../ui';
import { Panel, StatusPill, ZonedDateTime } from '../kit';
import { RELOAD, zonedLabel } from './shared';
import { AvailabilityFields } from '../../conference';

const FIELDS = {
    tracks: (f, set) => (
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label={t('Track name')} htmlFor="tr-name" required><Input id="tr-name" value={f.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label={t('Colour')} htmlFor="tr-color"><Input id="tr-color" type="color" value={f.color || '#0c5a52'} onChange={(e) => set('color', e.target.value)} className="h-[46px] p-1" /></Field>
        </div>
    ),
    speakers: (f, set) => (
        <>
            <Field label={t('Name')} htmlFor="sp-name" required><Input id="sp-name" value={f.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Headline')} htmlFor="sp-head"><Input id="sp-head" value={f.headline ?? ''} onChange={(e) => set('headline', e.target.value)} /></Field>
                <Field label={t('Company')} htmlFor="sp-co"><Input id="sp-co" value={f.company ?? ''} onChange={(e) => set('company', e.target.value)} /></Field>
            </div>
            <Field label={t('Bio')} htmlFor="sp-bio"><Textarea id="sp-bio" value={f.bio ?? ''} onChange={(e) => set('bio', e.target.value)} /></Field>
            <Field label={t('Link (optional)')} htmlFor="sp-link">
                <Input id="sp-link" type="url" placeholder="https://" value={f.links?.[0]?.url ?? ''} onChange={(e) => set('links', e.target.value ? [{ label: 'Website', url: e.target.value }] : [])} />
            </Field>
        </>
    ),
    sponsors: (f, set) => (
        <>
            <Field label={t('Sponsor name')} htmlFor="so-name" required><Input id="so-name" value={f.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Tier')} htmlFor="so-tier">
                    <Select id="so-tier" value={f.tier ?? 'partner'} onChange={(e) => set('tier', e.target.value)}>
                        {['platinum', 'gold', 'silver', 'partner'].map((x) => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}
                    </Select>
                </Field>
                <Field label={t('Website')} htmlFor="so-url"><Input id="so-url" type="url" placeholder="https://" value={f.url ?? ''} onChange={(e) => set('url', e.target.value)} /></Field>
            </div>
        </>
    ),
};

function SessionFields({ f, set, event, programme }) {
    return (
        <>
            <Field label={t('Session title')} htmlFor="se-title" required><Input id="se-title" value={f.title ?? ''} onChange={(e) => set('title', e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Starts')} htmlFor="se-start" required><ZonedDateTime id="se-start" value={f.starts_at} timeZone={event.timezone} onChange={(v) => set('starts_at', v)} /></Field>
                <Field label={t('Ends')} htmlFor="se-end" required><ZonedDateTime id="se-end" value={f.ends_at} timeZone={event.timezone} onChange={(v) => set('ends_at', v)} /></Field>
                <Field label={t('Track')} htmlFor="se-track">
                    <Select id="se-track" value={f.track_id ?? ''} onChange={(e) => set('track_id', e.target.value || null)}>
                        <option value="">{t('No track')}</option>
                        {programme.tracks.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                    </Select>
                </Field>
                <Field label={t('Room')} htmlFor="se-room"><Input id="se-room" value={f.room ?? ''} onChange={(e) => set('room', e.target.value)} /></Field>
            </div>
            <Field label={t('Abstract')} htmlFor="se-abs"><Textarea id="se-abs" value={f.abstract ?? ''} onChange={(e) => set('abstract', e.target.value)} /></Field>
            {programme.speakers.length > 0 && (
                <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-ink">{t('Speakers')}</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {programme.speakers.map((sp) => (
                            <Checkbox key={sp.id} label={sp.name} checked={(f.speaker_ids ?? []).includes(sp.id)}
                                onChange={(e) => set('speaker_ids', e.target.checked ? [...(f.speaker_ids ?? []), sp.id] : (f.speaker_ids ?? []).filter((x) => x !== sp.id))} />
                        ))}
                    </div>
                </fieldset>
            )}
        </>
    );
}

const KEEP = {
    tracks: ['name', 'color'],
    sessions: ['title', 'abstract', 'track_id', 'starts_at', 'ends_at', 'room', 'capacity', 'speaker_ids'],
    speakers: ['name', 'headline', 'company', 'bio', 'links'],
    sponsors: ['name', 'tier', 'url'],
};

/** Create or edit one tracks/sessions/speakers/sponsors item. */
export function ItemForm({ kind, item, event, programme, onClose }) {
    const { api } = useDashboard();
    const { run, busy, errors } = useAction();
    const [f, setF] = useState(() => item ?? (kind === 'sessions' ? { starts_at: event.starts_at, ends_at: event.starts_at, speaker_ids: [] } : {}));
    const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
    // Speakers: when they can be on stage (the agenda builder and the clash check read it).
    const availability = useAvailability(item?.availability ?? [], programme.days ?? []);

    const submit = async (e) => {
        e.preventDefault();
        if (kind === 'speakers' && !availability.valid) return;
        const body = Object.fromEntries(KEEP[kind].filter((k) => k in f).map((k) => [k, f[k] === '' ? null : f[k]]));
        if (kind === 'speakers') body.availability = availability.payload();
        const ok = await run(() => (item ? api.org.patch(`/events/${event.id}/${kind}/${item.id}`, body) : api.org.post(`/events/${event.id}/${kind}`, body)), { success: t('Saved'), reload: RELOAD });
        if (ok) onClose();
    };

    const firstError = Object.values(errors)[0];

    return (
        <form onSubmit={submit} className="space-y-4">
            {kind === 'sessions' ? <SessionFields f={f} set={set} event={event} programme={programme} /> : FIELDS[kind](f, set)}
            {kind === 'speakers' && (
                <AvailabilityFields availability={availability} idPrefix="sp-av" timezone={event.timezone} legend={t('When they can speak')}
                    error={availability.valid ? Object.entries(errors).find(([k]) => k.startsWith('availability'))?.[1] : t('Each time must end after it starts.')} />
            )}
            {firstError && <p className="text-sm font-medium text-danger" role="alert">{firstError}</p>}
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
                <Button type="submit" variant="primary" loading={!!busy}>{t('Save')}</Button>
            </div>
        </form>
    );
}

/** The call for speakers: the window, then the team's review of the submissions. */
const dayLabel = (days, date) => days.find((d) => d.date === date)?.label ?? date;

export function CallForSpeakers({ event, cfs, programmeDays = [] }) {
    const { api } = useDashboard();
    const { run, busy } = useAction();
    const call = cfs?.call;
    const [form, setForm] = useState({ instructions: call?.instructions ?? '', opens_at: call?.opens_at ?? null, closes_at: call?.closes_at ?? null, voting_enabled: call?.voting_enabled ?? true });
    const set = (k) => (v) => setForm((x) => ({ ...x, [k]: v }));
    const submissions = cfs?.submissions ?? [];

    const vote = (s, v) => run(() => api.org.post(`/events/${event.id}/submissions/${s.id}/vote`, { vote: s.my_vote === v ? 0 : v }), { key: `vote-${s.id}`, reload: RELOAD });
    const decide = (s, d) => run(() => api.org.post(`/events/${event.id}/submissions/${s.id}/${d}`, {}), { key: `decide-${s.id}`, success: d === 'accept' ? t('Accepted — added to speakers') : t('Rejected'), reload: RELOAD });

    return (
        <Panel title={t('Call for speakers')}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => api.org.put(`/events/${event.id}/call-for-speakers`, form), { key: 'cfs', success: t('Call for speakers saved'), reload: RELOAD }); }}>
                <Field label={t('Instructions for applicants')} htmlFor="cfs-ins"><Textarea id="cfs-ins" value={form.instructions} onChange={(e) => set('instructions')(e.target.value)} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('Opens')} htmlFor="cfs-open"><ZonedDateTime id="cfs-open" value={form.opens_at} timeZone={event.timezone} onChange={set('opens_at')} /></Field>
                    <Field label={t('Closes')} htmlFor="cfs-close"><ZonedDateTime id="cfs-close" value={form.closes_at} timeZone={event.timezone} onChange={set('closes_at')} /></Field>
                </div>
                <Checkbox label={t('Team voting on submissions')} checked={form.voting_enabled} onChange={(e) => set('voting_enabled')(e.target.checked)} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {call && <Tag tone={call.is_open ? 'success' : 'muted'}>{call.is_open ? t('Open now') : t('Closed')}</Tag>}
                    <Button type="submit" variant="primary" loading={busy === 'cfs'}>{call ? t('Save') : t('Open the call')}</Button>
                </div>
            </form>

            <h4 className="mb-3 mt-8 font-display text-lg font-bold text-ink">{t('Submissions')} <span className="font-mono text-sm text-muted">{submissions.length}</span></h4>
            {submissions.length === 0 ? <EmptyState title={t('No submissions yet')} body={t('Share the event page; applicants submit from there.')} /> : (
                <ul className="space-y-3">
                    {submissions.map((s) => (
                        <li key={s.id} className="rounded-sm border border-line p-4">
                            <div className="flex flex-wrap items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-ink">{s.title}</p>
                                    <p className="text-sm text-muted">{s.name} · {s.format} · {zonedLabel(s.submitted_at, event.timezone)}</p>
                                </div>
                                <StatusPill status={s.status === 'submitted' ? 'pending' : s.status === 'accepted' ? 'approved' : 'declined'} label={s.status} />
                            </div>
                            <p className="mt-2 text-[15px] text-body">{s.abstract}</p>
                            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                                <Clock className="h-4 w-4" aria-hidden="true" />
                                {s.availability?.length ? s.availability.map((w) => `${dayLabel(programmeDays, w.date)} ${w.from}–${w.until}`).join(' · ') : t('Any time')}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {call?.voting_enabled && (
                                    <div className="inline-flex items-center gap-1 rounded-chip border border-line p-0.5" role="group" aria-label={t('Your vote')}>
                                        {[[1, ThumbsUp, t('Vote for')], [0, Minus, t('No vote')], [-1, ThumbsDown, t('Vote against')]].map(([v, Icon, label]) => (
                                            <button key={v} type="button" aria-label={label} aria-pressed={s.my_vote === v} disabled={busy === `vote-${s.id}`}
                                                onClick={() => vote(s, v)} className={cn('flex h-8 w-8 items-center justify-center rounded-chip text-ink hover:bg-raised', s.my_vote === v && v !== 0 && 'bg-ink text-bg hover:bg-ink')}>
                                                <Icon className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <span className="font-mono text-sm text-ink">{t('Score :s from :n votes', { s: s.score > 0 ? `+${s.score}` : s.score, n: s.votes })}</span>
                                {s.status === 'submitted' && (
                                    <span className="ms-auto inline-flex gap-2">
                                        <Button size="sm" variant="ghost" icon={X} loading={busy === `decide-${s.id}`} onClick={() => decide(s, 'reject')}>{t('Reject')}</Button>
                                        <Button size="sm" variant="primary" icon={Check} loading={busy === `decide-${s.id}`} onClick={() => decide(s, 'accept')}>{t('Accept')}</Button>
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}

export { Plus };
