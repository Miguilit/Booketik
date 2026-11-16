import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CalendarClock, CircleSlash, LayoutList, Mail, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { t } from '@/Core/i18n';
import { useAction, useDashboard } from '@/Core/dashboard';
import { Panel } from './kit';
import { Button, Field, Input, Notice, Tag } from '../ui';

/*
 | The organizer's per-event AI cards: pricing hints, the
 | post-event recap and the agenda builder. Each produces a draft or a
 | suggestion; nothing is published, created or sent until the organizer
 | presses the button that says so. Without a provider each says
 | "AI unavailable" instead of failing when pressed.
 */

export function useAiAvailable() {
    const { frame } = useDashboard();
    return frame?.ai?.available !== false;
}

export function AiUnavailableNotice({ children }) {
    return (
        <Notice tone="warn" icon={CircleSlash}>
            <span className="font-semibold">{t('AI unavailable')}</span>
            {' — '}{children ?? t('No AI provider is set up for this site. Everything else keeps working.')}
        </Notice>
    );
}

function fmtLocal(iso, timeZone) {
    if (!iso) return '';
    try {
        return new Intl.DateTimeFormat(undefined, { timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    } catch {
        return iso;
    }
}

/** Pricing and capacity hints — only rendered with enough history (`ready`). */
export function PricingHintsCard({ event, readiness }) {
    const { api, can } = useDashboard();
    const { run, busy } = useAction();
    const [hints, setHints] = useState(null);

    if (!readiness?.ready || !can.edit) return null;

    const load = () => run(() => api.org.post(`/events/${event.id}/ai/pricing`, {}), { key: 'pricing' }).then((d) => d && setHints(d));

    return (
        <Panel title={t('Pricing suggestion')} action={<Tag tone="neutral">{t('Suggestion')}</Tag>}>
            {!hints ? (
                <div className="flex flex-wrap items-center gap-3">
                    <p className="flex-1 text-sm text-body">{t('Compare your tiers with what sold at your past events and similar ones nearby. You decide the prices.')}</p>
                    <Button variant="secondary" icon={ReceiptText} loading={busy === 'pricing'} onClick={load}>{t('Show suggestion')}</Button>
                </div>
            ) : !hints.available ? (
                <p className="text-sm text-muted">{hints.needed}</p>
            ) : (
                <div className="space-y-4 text-sm">
                    <p className="text-xs text-muted">{hints.basis === 'own' ? t('Based on :n of your past events.', { n: hints.sample }) : t('Based on :n similar events in this city and category.', { n: hints.sample })}</p>
                    {hints.tiers?.length > 0 ? (
                        <ul className="divide-y divide-line rounded-sm border border-line">
                            {hints.tiers.map((tier) => (
                                <li key={tier.ticket_type_id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
                                    <span className="font-semibold text-ink">{tier.name}</span>
                                    <span className="text-body">
                                        {t('Now :now · suggested :suggested', { now: tier.current?.formatted, suggested: tier.suggested?.formatted })}
                                        {tier.typical_fill !== null && <span className="text-muted"> · {t('similar tiers filled :pct%', { pct: Math.round(tier.typical_fill * 100) })}</span>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-muted">{t('Not enough sales at comparable tiers to suggest prices yet.')}</p>}
                    {hints.early_bird_note && <p className="text-body">{hints.early_bird_note}</p>}
                    {hints.capacity?.suggestion && <p className="text-body">{hints.capacity.suggestion}</p>}
                    <p className="text-xs text-muted">{hints.disclaimer}</p>
                </div>
            )}
        </Panel>
    );
}

/** The recap of an event that has ended: themes, best photos, the thank-you draft and a next date. */
export function RecapCard({ event, recap: initial, ended }) {
    const { api, path, can } = useDashboard();
    const available = useAiAvailable();
    const { run, busy } = useAction();
    const [recap, setRecap] = useState(initial ?? null);

    if (!ended || !can.edit) return null;

    const build = () => run(() => api.org.post(`/events/${event.id}/ai/recap`, {}), { key: 'recap' }).then((d) => d && setRecap(d));
    const useDraft = () => {
        const q = new URLSearchParams({ compose: 'going', subject: recap.thank_you?.subject ?? '', body: recap.thank_you?.body ?? '' });
        router.visit(`${path(`/events/${event.id}/announce`)}?${q.toString()}`);
    };

    return (
        <Panel title={t('Recap')} action={recap && available ? <Button size="sm" variant="ghost" loading={busy === 'recap'} onClick={build}>{t('Draft again')}</Button> : null}>
            {!recap ? (
                available ? (
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="flex-1 text-sm text-body">{t('Read the reviews and questions into themes, pick the best photos and draft a thank-you email. Nothing is sent.')}</p>
                        <Button variant="secondary" icon={Mail} loading={busy === 'recap'} onClick={build}>{t('Draft the recap')}</Button>
                    </div>
                ) : <AiUnavailableNotice />
            ) : (
                <div className="space-y-5 text-sm">
                    <p className="text-xs text-muted">
                        {recap.reviews?.count > 0 ? t(':n reviews, average :avg', { n: recap.reviews.count, avg: recap.reviews.average }) : t('No reviews yet')}
                        {' · '}{t(':n questions', { n: recap.questions ?? 0 })}
                    </p>
                    {recap.themes?.length > 0 && (
                        <ul className="grid gap-3 sm:grid-cols-2">
                            {recap.themes.map((th) => (
                                <li key={th.title} className="rounded-sm border border-line p-3">
                                    <p className="flex items-center justify-between gap-2 font-semibold text-ink">{th.title}<Tag tone={th.sentiment === 'complaint' ? 'danger' : th.sentiment === 'praise' ? 'success' : 'neutral'}>{t(th.sentiment)}</Tag></p>
                                    <p className="mt-1 text-body">{th.summary}</p>
                                    {th.mentions > 0 && <p className="mt-1 text-xs text-muted">{t(':n mentions', { n: th.mentions })}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                    {recap.photos?.length > 0 && (
                        <div>
                            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{t('Best photos')}</h3>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                {recap.photos.map((p) => p.image && <img key={p.id} src={p.image.url} alt={p.caption || t('Event photo')} loading="lazy" className="aspect-square w-full rounded-sm object-cover" />)}
                            </div>
                            <p className="mt-1 text-xs text-muted">{t('Photos from guests who opted out of being featured are never picked.')}</p>
                        </div>
                    )}
                    {recap.thank_you && (
                        <div className="rounded-sm border border-line p-3">
                            <h3 className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{t('Thank-you email — draft')}</h3>
                            <p className="font-semibold text-ink">{recap.thank_you.subject}</p>
                            <p className="mt-1 whitespace-pre-line text-body">{recap.thank_you.body}</p>
                            <Button className="mt-3" size="sm" variant="secondary" icon={Mail} onClick={useDraft}>{t('Edit and send in Announce')}</Button>
                        </div>
                    )}
                    {recap.next_date && (
                        <div className="flex flex-wrap items-center gap-3 rounded-sm bg-tint px-3 py-2 text-on-tint">
                            <CalendarClock className="h-4 w-4" aria-hidden="true" />
                            <p className="flex-1"><span className="font-semibold">{t('Suggested next date')}: {fmtLocal(recap.next_date.starts_at, event.timezone)}</span> — {recap.next_date.reason}</p>
                            <Button size="sm" variant="ghost" href={path('/events/new')}>{t('Plan it')}</Button>
                        </div>
                    )}
                </div>
            )}
        </Panel>
    );
}

/** The agenda builder: rooms in, an editable draft out, applied only on confirm. */
export function AgendaBuilder({ event }) {
    const { api, can } = useDashboard();
    const available = useAiAvailable();
    const { run, busy } = useAction();
    const [rooms, setRooms] = useState([{ name: t('Main stage'), capacity: 300 }, { name: t('Room B'), capacity: 80 }]);
    const [includeUndecided, setIncludeUndecided] = useState(false);
    const [draft, setDraft] = useState(null);

    if (!can.edit) return null;

    const build = () => run(() => api.org.post(`/events/${event.id}/ai/agenda`, {
        rooms: rooms.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), capacity: r.capacity ? Number(r.capacity) : null })),
        include_undecided: includeUndecided,
    }), { key: 'build' }).then((d) => d && setDraft(d));

    const apply = () => run(() => api.org.post(`/events/${event.id}/ai/agenda/apply`, { tracks: draft.tracks, sessions: draft.sessions }), {
        key: 'apply', success: (d) => t(':n sessions added to the agenda', { n: d.sessions }), reload: ['data', 'event'],
    }).then((d) => d && setDraft(null));

    const edit = (i, patch) => setDraft((d) => ({ ...d, sessions: d.sessions.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
    const trackName = (key) => draft?.tracks?.find((tr) => tr.key === key)?.name ?? '';

    return (
        <Panel title={t('Build the agenda from submissions')}>
            {!available ? <AiUnavailableNotice /> : !draft ? (
                <div className="space-y-3 text-sm">
                    <p className="text-body">{t('Groups the accepted talks into tracks and proposes a schedule that respects speaker availability and room sizes. You get an editable draft; nothing is added until you apply it.')}</p>
                    {rooms.map((r, i) => (
                        <div key={i} className="flex flex-wrap items-end gap-2">
                            <Field label={t('Room')} htmlFor={`room-${i}`} className="min-w-[160px] flex-1"><Input id={`room-${i}`} value={r.name} onChange={(e) => setRooms(rooms.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
                            <Field label={t('Seats')} htmlFor={`cap-${i}`} className="w-28"><Input id={`cap-${i}`} type="number" min="1" value={r.capacity ?? ''} onChange={(e) => setRooms(rooms.map((x, j) => (j === i ? { ...x, capacity: e.target.value } : x)))} /></Field>
                            <Button variant="ghost" icon={Trash2} aria-label={t('Remove room')} onClick={() => setRooms(rooms.filter((_, j) => j !== i))} disabled={rooms.length < 2} />
                        </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="ghost" size="sm" icon={Plus} onClick={() => setRooms([...rooms, { name: '', capacity: '' }])}>{t('Add a room')}</Button>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={includeUndecided} onChange={(e) => setIncludeUndecided(e.target.checked)} /> {t('Include submissions not decided yet')}</label>
                    </div>
                    <Button variant="primary" icon={LayoutList} loading={busy === 'build'} onClick={build}>{t('Draft the schedule')}</Button>
                </div>
            ) : (
                <div className="space-y-4 text-sm">
                    <div className="flex flex-wrap gap-2">{draft.tracks.map((tr) => <span key={tr.key} className="inline-flex items-center gap-1.5 rounded-chip border border-line px-2.5 py-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: tr.color }} aria-hidden="true" />{tr.name}</span>)}</div>
                    {draft.conflicts?.length > 0 && <Notice tone="danger">{draft.conflicts.map((c) => c.message).join(' ')}</Notice>}
                    <div className="overflow-x-auto">
                        <table className="w-full text-start">
                            <caption className="sr-only">{t('Draft schedule')}</caption>
                            <thead><tr className="text-xs text-muted"><th className="py-1 pe-2">{t('Session')}</th><th className="pe-2">{t('Track')}</th><th className="pe-2">{t('Room')}</th><th>{t('When')}</th></tr></thead>
                            <tbody className="divide-y divide-line">
                                {draft.sessions.map((s, i) => (
                                    <tr key={s.submission_id ?? i}>
                                        <td className="py-2 pe-2"><Input aria-label={t('Session title')} value={s.title} onChange={(e) => edit(i, { title: e.target.value })} /><span className="text-xs text-muted">{s.speaker}</span></td>
                                        <td className="pe-2">{trackName(s.track_key)}</td>
                                        <td className="pe-2"><select aria-label={t('Room')} className="rounded-sm border border-line bg-surface px-2 py-1" value={s.room} onChange={(e) => edit(i, { room: e.target.value })}>{draft.rooms.map((r) => <option key={r.name}>{r.name}</option>)}</select></td>
                                        <td className="whitespace-nowrap">{fmtLocal(s.starts_at, draft.timezone)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {draft.unscheduled?.length > 0 && <p className="text-muted">{t('Not placed')}: {draft.unscheduled.map((u) => `${u.title} (${u.reason})`).join('; ')}</p>}
                    <div className="flex flex-wrap gap-2">
                        <Button variant="primary" loading={busy === 'apply'} onClick={apply}>{t('Add these sessions to the agenda')}</Button>
                        <Button variant="ghost" onClick={() => setDraft(null)}>{t('Discard the draft')}</Button>
                    </div>
                </div>
            )}
        </Panel>
    );
}
