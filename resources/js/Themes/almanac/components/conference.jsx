/*
 | Almanac's conference tools, set like a printed programme: serif titles,
 | hairline rules between entries, times in italic (italic means when), the
 | one action in terracotta. Logic: @/Core/conference.
 */
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { CalendarCheck, CalendarClock, Check, Clock, Footprints, Handshake, MapPin, Mic, Plus, RefreshCcw, Trash2, UserRound, Users, X } from 'lucide-react';
import {
    durationLabel, formatCopy, meetingStatusLabel, minutesLabel, submissionStatusLabel,
    useCallForSpeakers, useItinerary, useNetworkingProfile, usePeopleToMeet,
} from '@/Core/conference';
import { eventPath } from '@/Core/events';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { Avatar, Button, Card, cn, EmptyState, Field, Input, Notice, Select, Skeleton, Tag, Textarea, Toggle } from './ui';

function errorFor(errors, prefix) {
    const key = Object.keys(errors ?? {}).find((k) => k === prefix || k.startsWith(`${prefix}.`));
    return key ? errors[key] : null;
}

/* ── Topics (interests) ─────────────────────────────────────────────── */

function TopicInput({ id, label, hint, values, draft, setDraft, onAdd, onRemove, max = 12 }) {
    return (
        <Field label={label} htmlFor={id} hint={hint}>
            {values.length > 0 && (
                <ul className="mb-2 flex flex-wrap gap-2" aria-label={label}>
                    {values.map((v) => (
                        <li key={v} className="inline-flex h-9 items-center gap-1 rounded-chip border border-edge bg-surface ps-3 pe-1 text-sm text-ink">
                            {v}
                            <button type="button" onClick={() => onRemove(v)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface/60" aria-label={t('Remove :topic', { topic: v })}>
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex gap-2">
                <Input
                    id={id}
                    value={draft}
                    maxLength={40}
                    disabled={values.length >= max}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(); } }}
                    placeholder={t('design systems, hiring, research')}
                />
                <Button variant="secondary" icon={Plus} onClick={() => onAdd()} disabled={!draft.trim()}>{t('Add')}</Button>
            </div>
        </Field>
    );
}

/* ── Availability ───────────────────────────────────────────────────── */

export function AvailabilityFields({ availability, idPrefix = 'av', error, timezone, legend }) {
    const { rows, days } = availability;
    return (
        <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-ink">{legend ?? t('When you can speak')}</legend>
            <p className="text-sm text-muted">
                {rows.length === 0 ? t('Any time during the event. Add times to limit when your session can be scheduled.') : t('Times are the event’s own (:zone).', { zone: timezone || 'UTC' })}
            </p>
            {rows.length > 0 && (
                <ul className="space-y-2">
                    {rows.map((r, i) => {
                        const bad = availability.invalid.includes(r.key);
                        return (
                            <li key={r.key} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                                <Field label={i === 0 ? t('Day') : null} htmlFor={`${idPrefix}-d-${r.key}`}>
                                    <Select id={`${idPrefix}-d-${r.key}`} value={r.date} onChange={(e) => availability.update(r.key, 'date', e.target.value)} aria-label={i === 0 ? undefined : t('Day')}>
                                        {days.map((d) => <option key={d.date} value={d.date}>{d.label}</option>)}
                                    </Select>
                                </Field>
                                <Field label={i === 0 ? t('From') : null} htmlFor={`${idPrefix}-f-${r.key}`}>
                                    <Input id={`${idPrefix}-f-${r.key}`} type="time" value={r.from} invalid={bad} onChange={(e) => availability.update(r.key, 'from', e.target.value)} className="font-mono" aria-label={i === 0 ? undefined : t('From')} />
                                </Field>
                                <Field label={i === 0 ? t('Until') : null} htmlFor={`${idPrefix}-u-${r.key}`}>
                                    <Input id={`${idPrefix}-u-${r.key}`} type="time" value={r.until} invalid={bad} onChange={(e) => availability.update(r.key, 'until', e.target.value)} className="font-mono" aria-label={i === 0 ? undefined : t('Until')} />
                                </Field>
                                <Button variant="ghost" size="icon" icon={Trash2} onClick={() => availability.remove(r.key)} aria-label={t('Remove this time')} />
                            </li>
                        );
                    })}
                </ul>
            )}
            {error && <p className="text-sm font-medium text-danger" role="alert">{error}</p>}
            <Button variant="secondary" size="sm" icon={Plus} onClick={availability.add} disabled={!days.length}>{rows.length ? t('Add another time') : t('Add a time')}</Button>
        </fieldset>
    );
}

/* ── Call for speakers ──────────────────────────────────────────────── */

export function CallForSpeakersForm({ event, call: initial }) {
    const c = useCallForSpeakers({ event, call: initial });
    const call = c.call;
    if (!call) return null;

    return (
        <section id="call-for-speakers" aria-labelledby="cfs-title" className="scroll-mt-24 border-t border-line pt-8">
            <div className="flex flex-wrap items-center gap-3">
                <h2 id="cfs-title" className="flex items-center gap-2 font-display text-[32px] leading-tight text-ink"><Mic className="h-6 w-6" aria-hidden="true" />{t('Call for speakers')}</h2>
                <Tag tone={call.is_open ? 'success' : 'muted'}>{call.is_open ? t('Open') : t('Closed')}</Tag>
            </div>
            {call.instructions && <p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] text-body" data-user-content>{call.instructions}</p>}

            {c.mine.length > 0 && (
                <Card as="ul" className="mt-5 divide-y divide-line">
                    {c.mine.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-ink">{s.title}</span>
                                <span className="block text-sm text-muted">{formatCopy(s.format)}{s.availability.length ? ` · ${t(':n times given', { n: s.availability.length })}` : ` · ${t('Any time')}`}</span>
                            </span>
                            <Tag tone={s.status === 'accepted' ? 'success' : s.status === 'rejected' ? 'muted' : 'info'}>{submissionStatusLabel(s.status)}</Tag>
                        </li>
                    ))}
                </Card>
            )}

            {call.is_open && !c.atLimit && (c.sent ? (
                <Notice tone="info" icon={Check} className="mt-5">
                    {t('Talk submitted. The team will let you know.')}{' '}
                    <button type="button" className="font-semibold underline" onClick={c.another}>{t('Submit another')}</button>
                </Notice>
            ) : (
                <Card className="mt-5 p-5">
                    {!c.signedIn ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-[15px] text-body">{t('Sign in to submit a talk. The team answers on your account.')}</p>
                            <Button variant="primary" onClick={c.signIn}>{t('Sign in')}</Button>
                        </div>
                    ) : (
                        <form onSubmit={c.submit} className="space-y-4" noValidate>
                            <Field label={t('Talk title')} htmlFor="cfs-t" required error={c.errors.title}>
                                <Input id="cfs-t" value={c.form.title} onChange={(e) => c.set('title')(e.target.value)} maxLength={191} invalid={!!c.errors.title} />
                            </Field>
                            <Field label={t('Abstract')} htmlFor="cfs-a" required error={c.errors.abstract} hint={t('What people will take away. 20 characters or more.')}>
                                <Textarea id="cfs-a" value={c.form.abstract} onChange={(e) => c.set('abstract')(e.target.value)} maxLength={4000} invalid={!!c.errors.abstract} />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label={t('Format')} htmlFor="cfs-f">
                                    <Select id="cfs-f" value={c.form.format} onChange={(e) => c.set('format')(e.target.value)}>
                                        {c.formats.map((f) => <option key={f.key} value={f.key}>{`${formatCopy(f.key)} · ${minutesLabel(f.minutes)}`}</option>)}
                                    </Select>
                                </Field>
                                <Field label={t('Name on the agenda')} htmlFor="cfs-n" error={c.errors.name}>
                                    <Input id="cfs-n" value={c.form.name} onChange={(e) => c.set('name')(e.target.value)} maxLength={120} autoComplete="name" />
                                </Field>
                                <Field label={t('Email for the team')} htmlFor="cfs-e" error={c.errors.email}>
                                    <Input id="cfs-e" type="email" value={c.form.email} onChange={(e) => c.set('email')(e.target.value)} maxLength={191} autoComplete="email" />
                                </Field>
                            </div>
                            <AvailabilityFields availability={c.availability} idPrefix="cfs-av" error={errorFor(c.errors, 'availability')} timezone={call.timezone} />
                            {c.errors.form && <p className="text-sm font-medium text-danger" role="alert">{c.errors.form}</p>}
                            <div className="flex justify-end">
                                <Button type="submit" variant="cta" icon={Mic} loading={c.busy}>{t('Submit talk')}</Button>
                            </div>
                        </form>
                    )}
                </Card>
            ))}
        </section>
    );
}

/* ── Plan my day ────────────────────────────────────────────────────── */

export function PlanMyDay({ event, interests = [], className }) {
    const p = useItinerary(event, { interests });

    return (
        <div className={cn('space-y-5', className)}>
            <TopicInput
                id="plan-topics"
                label={t('What are you here for?')}
                hint={t('Optional. Your bookmarks count too.')}
                values={p.topics}
                draft={p.draft}
                setDraft={p.setDraft}
                onAdd={p.addTopic}
                onRemove={p.removeTopic}
            />
            <div className="flex flex-wrap gap-2">
                <Button variant="primary" icon={CalendarClock} loading={p.busy === 'propose'} onClick={p.propose}>{p.plan ? t('Plan again') : t('Plan my day')}</Button>
                {p.plan && <Button variant="ghost" icon={RefreshCcw} onClick={p.reset}>{t('Start over')}</Button>}
            </div>
            {p.error && <Notice tone="danger">{p.error}</Notice>}

            {p.busy === 'propose' && !p.plan && (
                <div className="space-y-2" aria-hidden="true"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
            )}

            {p.plan && (
                <div aria-live="polite">
                    {p.days.length === 0 ? (
                        <EmptyState icon={CalendarClock} title={t('Nothing to plan yet')} body={t('The organizer has not published sessions.')} />
                    ) : (
                        <>
                            <p className="mb-3 text-sm text-muted">{t(':count sessions, :time on stage. Untick any you want to skip.', { count: p.kept.length, time: durationLabel(p.totalMinutes) })}</p>
                            {p.days.map((day) => (
                                <section key={day.key} aria-label={day.label} className="mb-5">
                                    <h4 className="mb-2 font-display text-[22px] italic leading-tight text-link">{day.label}</h4>
                                    <ol className="divide-y divide-line border-y border-line">
                                        {day.items.map((item) => (
                                            <li key={item.session.id} className={cn('grid grid-cols-[auto_64px_minmax(0,1fr)] items-start gap-3 p-4', !item.kept && 'opacity-60')}>
                                                <input
                                                    type="checkbox"
                                                    checked={item.kept}
                                                    onChange={() => p.toggle(item.session.id)}
                                                    className="form-checkbox mt-1 h-5 w-5 rounded-[6px] border-key border-edge text-brand focus:ring-0"
                                                    aria-label={t('Keep :title', { title: item.session.title })}
                                                />
                                                <span className="font-display text-xl italic leading-none text-ink">{item.time}<span className="mt-1 block font-mono text-xs not-italic text-muted">{item.endTime}</span></span>
                                                <span className="min-w-0">
                                                    <span className="block font-semibold text-ink">{item.session.title}</span>
                                                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                                                        {item.session.room && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{item.session.room}</span>}
                                                        {item.travel_minutes_before > 0 && <span className="inline-flex items-center gap-1"><Footprints className="h-3.5 w-3.5" aria-hidden="true" />{t(':n min to walk over', { n: item.travel_minutes_before })}</span>}
                                                    </span>
                                                    <span className="mt-1 block text-sm text-body">{item.reason}</span>
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            ))}
                            {p.skipped.length > 0 && (
                                <p className="mb-4 text-sm text-muted">{t('Left out because they clash: :titles', { titles: p.skipped.map((s) => s.title).join(', ') })}</p>
                            )}
                            {p.applied ? (
                                <Notice tone="info" icon={CalendarCheck}>{t('My agenda now holds these sessions.')}</Notice>
                            ) : (
                                <Button variant="cta" icon={CalendarCheck} loading={p.busy === 'apply'} disabled={!p.kept.length} onClick={p.apply}>{t('Apply to My agenda')}</Button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── On the event page ──────────────────────────────────────────────── */

export function ConferenceTools({ event, sessionCount = 0, interests = [] }) {
    const url = useRoute();
    const [planning, setPlanning] = useState(false);
    const networking = event.modules?.networking;
    const agenda = event.modules?.agenda && sessionCount > 0;
    if (!networking && !agenda) return null;

    return (
        <section aria-labelledby="for-guests" className="border-t border-line pt-8">
            <h2 id="for-guests" className="font-display text-[32px] leading-tight text-ink">{t('Make the most of it')}</h2>
            <div className="mt-4 grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-line rtl:sm:divide-x-reverse">
                {agenda && (
                    <button type="button" onClick={() => setPlanning((v) => !v)} aria-expanded={planning} aria-controls="plan-my-day"
                        className="group border-t border-line py-4 text-start sm:pe-6">
                        <span className="block font-display text-[26px] leading-tight text-ink group-hover:text-link">{t('Plan my day')}</span>
                        <span className="mt-1 block text-[15px] text-body">{t('A day of sessions around your interests, without clashes.')}</span>
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-link"><CalendarClock className="h-4 w-4" aria-hidden="true" />{planning ? t('Close') : t('Open the planner')}</span>
                    </button>
                )}
                {networking && (
                    <Link href={url(`${eventPath(event.slug)}/people`)} className={cn('group border-t border-line py-4', agenda && 'sm:ps-6')}>
                        <span className="block font-display text-[26px] leading-tight text-ink group-hover:text-link">{t('People to meet')}</span>
                        <span className="mt-1 block text-[15px] text-body">{t('Guests who opted in, matched on what you are looking for.')}</span>
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-link"><Handshake className="h-4 w-4" aria-hidden="true" />{t('See who is coming')}</span>
                    </Link>
                )}
            </div>
            {agenda && planning && (
                <Card id="plan-my-day" sticker className="mt-4 p-5">
                    <PlanMyDay event={event} interests={interests} />
                </Card>
            )}
        </section>
    );
}

/* ── People to meet ─────────────────────────────────────────────────── */

function MeetingRow({ meeting, board }) {
    const busy = board.busy === `resp-${meeting.id}`;
    return (
        <li className="flex flex-wrap items-center gap-3 p-4">
            <Avatar image={meeting.person.avatar} name={meeting.person.name} size={44} />
            <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{meeting.person.name}</span>
                <span className="block truncate text-sm text-muted">{[meeting.person.headline, meeting.person.company].filter(Boolean).join(' · ')}</span>
                {meeting.message && <span className="mt-1 block text-sm text-body">“{meeting.message}”</span>}
            </span>
            {meeting.direction === 'incoming' && meeting.status === 'pending' ? (
                <span className="flex gap-2">
                    <Button size="sm" variant="ghost" icon={X} loading={busy} onClick={() => board.respond(meeting, false)}>{t('Decline')}</Button>
                    <Button size="sm" variant="primary" icon={Check} loading={busy} onClick={() => board.respond(meeting, true)}>{t('Accept')}</Button>
                </span>
            ) : (
                <Tag tone={meeting.status === 'accepted' ? 'success' : meeting.status === 'declined' ? 'muted' : 'info'}>{meetingStatusLabel(meeting)}</Tag>
            )}
        </li>
    );
}

function PersonCard({ row, board }) {
    const person = row.user;
    const open = board.composing === person.id;
    const meeting = row.meeting;
    return (
        <li className="flex flex-col border-t border-line pt-5">
            <div className="flex items-start gap-3">
                <Avatar image={person.avatar} name={person.name} size={56} />
                <div className="min-w-0">
                    <p className="font-display text-[26px] leading-tight text-ink">{person.name}</p>
                    <p className="text-sm text-muted">{[person.headline, person.company].filter(Boolean).join(' · ')}</p>
                </div>
            </div>
            <p className="mt-3 text-[15px] text-body">{row.reason}</p>
            {row.shared?.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t('In common')}>
                    {row.shared.map((s) => <li key={s} className="rounded-chip border border-line bg-raised px-2.5 py-0.5 text-xs font-medium text-body">{s}</li>)}
                </ul>
            )}
            {row.looking_for && <p className="mt-3 text-sm text-muted"><span className="font-semibold text-ink">{t('Looking for')}:</span> {row.looking_for}</p>}
            <div className="mt-auto pt-4">
                {meeting ? (
                    <Tag tone={meeting.status === 'accepted' ? 'success' : 'info'}>{meetingStatusLabel(meeting)}</Tag>
                ) : open ? (
                    <form onSubmit={(e) => { e.preventDefault(); board.request(person); }} className="space-y-2">
                        <Field label={t('A note (optional)')} htmlFor={`note-${person.id}`}>
                            <Textarea id={`note-${person.id}`} value={board.message} onChange={(e) => board.setMessage(e.target.value)} maxLength={500} className="min-h-[72px]" placeholder={t('Coffee after the keynote?')} />
                        </Field>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={board.cancelCompose}>{t('Cancel')}</Button>
                            <Button type="submit" variant="primary" size="sm" loading={board.busy === `req-${person.id}`}>{t('Send request')}</Button>
                        </div>
                    </form>
                ) : (
                    <Button variant="secondary" size="sm" icon={Handshake} onClick={() => board.compose(person.id)}>{t('Ask to meet')}</Button>
                )}
            </div>
        </li>
    );
}

export function PeopleBoard({ event, profile, isGuest, meetings }) {
    const url = useRoute();
    const board = usePeopleToMeet({ event, meetings, profile, isGuest });
    const others = board.meetings.filter((m) => !(m.direction === 'incoming' && m.status === 'pending'));

    return (
        <div className="space-y-10">
            {!profile?.opt_in ? (
                <Notice tone="warn" icon={UserRound}>
                    {t('Switch on your networking profile to see people to meet and to be seen.')}{' '}
                    <Link href={url(`/account/networking?from=${event.slug}`)} className="font-semibold underline">{t('Set up networking')}</Link>
                </Notice>
            ) : !isGuest ? (
                <Notice tone="info" icon={Users}>{t('People to meet opens once you are going to this event.')}</Notice>
            ) : null}

            {board.incoming.length > 0 && (
                <section aria-labelledby="incoming">
                    <h2 id="incoming" className="mb-3 font-display text-[32px] leading-tight text-ink">{t('Wants to meet you')} <span className="font-mono text-base text-muted">{board.incoming.length}</span></h2>
                    <Card as="ul" className="divide-y divide-line">{board.incoming.map((m) => <MeetingRow key={m.id} meeting={m} board={board} />)}</Card>
                </section>
            )}

            {board.canLoad && (
                <section aria-labelledby="matches" aria-busy={board.loading}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 id="matches" className="font-display text-[32px] leading-tight text-ink">{t('People to meet')}</h2>
                        <Button variant="ghost" size="sm" icon={RefreshCcw} onClick={board.reload} loading={board.loading}>{t('Refresh')}</Button>
                    </div>
                    {board.people === null || (board.loading && !board.people?.length) ? (
                        <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
                    ) : board.error ? (
                        <Notice tone="warn">{board.error.message}</Notice>
                    ) : board.people.length === 0 ? (
                        <EmptyState icon={Users} title={t('Nobody to suggest yet')} body={t('As more guests switch on networking, matches show up here.')} />
                    ) : (
                        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">{board.people.map((row) => <PersonCard key={row.user.id} row={row} board={board} />)}</ul>
                    )}
                </section>
            )}

            <section aria-labelledby="requests">
                <h2 id="requests" className="mb-3 font-display text-[32px] leading-tight text-ink">{t('Your meetings')}</h2>
                {others.length === 0 ? (
                    <p className="rounded-card border border-dashed border-line px-5 py-6 text-[15px] text-muted">{t('No meetings yet. Requests you send and accept show up here.')}</p>
                ) : (
                    <Card as="ul" className="divide-y divide-line">{others.map((m) => <MeetingRow key={m.id} meeting={m} board={board} />)}</Card>
                )}
            </section>
        </div>
    );
}

/* ── Networking profile ─────────────────────────────────────────────── */

export function NetworkingForm({ profile: initial }) {
    const n = useNetworkingProfile(initial);
    const p = n.profile;

    return (
        <form onSubmit={(e) => { e.preventDefault(); n.save(); }} className="space-y-6">
            <Card className="px-5">
                <Toggle
                    checked={p.opt_in}
                    onChange={(v) => n.toggle(v)}
                    disabled={n.saving}
                    label={t('Open to meeting people')}
                    description={t('Guests of the same conference who also opted in can see your name, headline and interests, and ask to meet. Nobody else.')}
                />
            </Card>
            <Card className={cn('space-y-4 p-5', !p.opt_in && 'opacity-70')}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('Headline')} htmlFor="nw-head" error={n.errors.headline} hint={t('What you do, in a line.')}>
                        <Input id="nw-head" value={p.headline ?? ''} maxLength={120} onChange={(e) => n.set('headline', e.target.value)} placeholder={t('Product designer')} />
                    </Field>
                    <Field label={t('Company')} htmlFor="nw-co" error={n.errors.company}>
                        <Input id="nw-co" value={p.company ?? ''} maxLength={120} onChange={(e) => n.set('company', e.target.value)} autoComplete="organization" />
                    </Field>
                </div>
                <TopicInput
                    id="nw-int"
                    label={t('Interests')}
                    hint={t(':n of :max', { n: p.interests.length, max: n.maxInterests })}
                    values={p.interests}
                    draft={n.draft}
                    setDraft={n.setDraft}
                    onAdd={n.addInterest}
                    onRemove={n.removeInterest}
                    max={n.maxInterests}
                />
                <Field label={t('Looking for')} htmlFor="nw-look" error={n.errors.looking_for} hint={t('Who you would like to meet, and why.')}>
                    <Textarea id="nw-look" value={p.looking_for ?? ''} maxLength={280} onChange={(e) => n.set('looking_for', e.target.value)} placeholder={t('Engineers who have shipped a design system across platforms')} />
                </Field>
                <div className="flex items-center justify-end gap-3">
                    {n.dirty && <span className="flex items-center gap-1 text-sm text-muted"><Clock className="h-4 w-4" aria-hidden="true" />{t('Unsaved changes')}</span>}
                    <Button type="submit" variant="primary" loading={n.saving}>{t('Save profile')}</Button>
                </div>
            </Card>
        </form>
    );
}

