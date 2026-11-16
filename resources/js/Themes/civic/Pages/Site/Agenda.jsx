import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Bookmark, BookmarkCheck, CalendarClock, ChevronDown, MapPin } from 'lucide-react';
import { accentStyle, eventPath, eventWhen } from '@/Core/events';
import { useAgenda } from '@/Core/agenda';
import { useMode } from '@/Core/mode';
import { useRoute, useViewer } from '@/Core/site';
import { t } from '@/Core/i18n';
import { thumbSrc } from '@/Core/media';
import { layout } from '@/Themes/civic/Layout';
import { Avatar, Card, Chip, cn, Container, EmptyState, Notice, Tabs } from '@/Themes/civic/components/ui';
import { PlanMyDay } from '@/Themes/civic/components/conference';

/*
 | The conference agenda (`/e/{slug}/agenda`): days, tracks, a time grid on
 | wide screens and a stacked list on phones, and "My agenda" bookmarks.
 | Times are the event's own zone, labelled once in the header.
 */

function SessionCard({ session, onToggle, className }) {
    const [open, setOpen] = useState(false);
    return (
        <article className={cn('flex h-full flex-col rounded-card border bg-surface p-4', session.bookmarked ? 'border-key border-edge shadow-key' : 'border-line', className)}>
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-muted">
                        {session.time}{session.endTime ? `–${session.endTime}` : ''}
                        {session.track && (
                            <span className="ms-2 inline-flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full" style={{ background: session.track.color || 'currentColor' }} aria-hidden="true" />
                                {session.track.name}
                            </span>
                        )}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink">{session.title}</h3>
                    {session.room && <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{session.room}</p>}
                </div>
                <button
                    type="button"
                    onClick={() => onToggle(session)}
                    aria-pressed={session.bookmarked}
                    aria-label={session.bookmarked ? t('Remove :title from my agenda', { title: session.title }) : t('Add :title to my agenda', { title: session.title })}
                    className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-chip border-key', session.bookmarked ? 'border-edge bg-accent text-on-accent' : 'border-line text-ink hover:border-edge')}
                >
                    {session.bookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                </button>
            </div>
            {session.speakers?.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    {session.speakers.map((sp) => (
                        <li key={sp.id} className="flex items-center gap-2 text-sm">
                            <Avatar image={sp.avatar} name={sp.name} size={28} />
                            <span className="min-w-0"><span className="font-semibold text-ink">{sp.name}</span>{sp.headline && <span className="block truncate text-xs text-muted">{sp.headline}</span>}</span>
                        </li>
                    ))}
                </ul>
            )}
            {session.abstract && (
                <div className="mt-3">
                    <p className={cn('text-sm text-body', !open && 'line-clamp-2')}>{session.abstract}</p>
                    {session.abstract.length > 120 && (
                        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-link">
                            {open ? t('Show less') : t('Read more')}
                            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
                        </button>
                    )}
                </div>
            )}
        </article>
    );
}

function DayGrid({ day, tracks, track, onToggle }) {
    const columns = !track && tracks.length > 1 ? tracks : null;
    return (
        <>
            {/* Phones: one column, by time. */}
            <ol className="space-y-6 lg:hidden">
                {day.slots.map((slot) => (
                    <li key={slot.time}>
                        <p className="mb-2 font-mono text-sm font-medium text-ink">{slot.time}</p>
                        <div className="space-y-3">{slot.sessions.map((s) => <SessionCard key={s.id} session={s} onToggle={onToggle} />)}</div>
                    </li>
                ))}
            </ol>

            {/* Wide screens: a time column and one column per track. */}
            <div className="hidden lg:block">
                <div className="grid gap-3" style={{ gridTemplateColumns: `72px repeat(${columns ? columns.length : 1}, minmax(0, 1fr))` }}>
                    <div />
                    {(columns ?? [null]).map((c, i) => (
                        <p key={c?.id ?? i} className="flex items-center gap-2 border-b border-line pb-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">
                            {c && <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color || 'currentColor' }} aria-hidden="true" />}
                            {c ? c.name : t('Sessions')}
                        </p>
                    ))}
                    {day.slots.map((slot) => (
                        <div key={slot.time} className="contents">
                            <p className="pt-4 font-mono text-sm font-medium text-ink">{slot.time}</p>
                            {columns ? (
                                (() => {
                                    const plenary = slot.sessions.filter((s) => !s.track || !columns.find((c) => c.id === s.track.id));
                                    if (plenary.length) {
                                        return <div style={{ gridColumn: `span ${columns.length}` }} className="grid gap-3">{plenary.map((s) => <SessionCard key={s.id} session={s} onToggle={onToggle} />)}</div>;
                                    }
                                    return columns.map((c) => (
                                        <div key={c.id} className="space-y-3">
                                            {slot.sessions.filter((s) => s.track?.id === c.id).map((s) => <SessionCard key={s.id} session={s} onToggle={onToggle} />)}
                                        </div>
                                    ));
                                })()
                            ) : (
                                <div className="grid gap-3 xl:grid-cols-2">{slot.sessions.map((s) => <SessionCard key={s.id} session={s} onToggle={onToggle} />)}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default function Agenda({ event, sessions = [], speakers = [], sponsors = [], accent }) {
    const url = useRoute();
    const viewer = useViewer();
    const { dark } = useMode();
    const agenda = useAgenda({ event, sessions });
    const when = eventWhen(event);
    const [day, setDay] = useState(agenda.days[0]?.key ?? null);
    const [planning, setPlanning] = useState(false);

    useEffect(() => {
        if (!agenda.days.find((d) => d.key === day)) setDay(agenda.days[0]?.key ?? null);
    }, [agenda.days, day]);

    const current = agenda.days.find((d) => d.key === day);

    return (
        <div style={accentStyle(accent, dark)}>
            <Head title={t('Agenda: :title', { title: event.title })} />
            <Container className="pt-6 lg:pt-10">
                <Link href={url(eventPath(event.slug))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-link">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{t('Back to the event')}
                </Link>
                <h1 className="mt-3 font-display text-[36px] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink sm:text-[48px]">{t('Agenda')}</h1>
                <p className="mt-1 text-[17px] text-body">{event.title}</p>
                {when && (
                    <p className="mt-1 font-mono text-sm text-muted">
                        {when.multiDay ? `${when.date} – ${when.endDate}` : when.date} · {t('All times :zone', { zone: when.zone })}
                    </p>
                )}

                {!viewer && (
                    <Notice tone="info" className="mt-6">
                        {t('Bookmarks are kept in this browser.')}{' '}
                        <button type="button" onClick={agenda.signIn} className="font-semibold underline">{t('Sign in to keep your agenda everywhere.')}</button>
                    </Notice>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-2">
                    <Chip active={agenda.onlyMine} onClick={() => agenda.setOnlyMine(!agenda.onlyMine)} icon={BookmarkCheck} count={agenda.mineCount || null}>{t('My agenda')}</Chip>
                    <Chip active={planning} onClick={() => setPlanning((v) => !v)} icon={CalendarClock} aria-pressed={undefined} aria-expanded={planning} aria-controls="plan-my-day">{t('Plan my day')}</Chip>
                    {agenda.tracks.length > 1 && (
                        <>
                            <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
                            <Chip active={!agenda.track} onClick={() => agenda.setTrack(null)}>{t('All tracks')}</Chip>
                            {agenda.tracks.map((tr) => (
                                <Chip key={tr.id} active={agenda.track === tr.id} onClick={() => agenda.setTrack(agenda.track === tr.id ? null : tr.id)}>
                                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: tr.color || 'currentColor' }} aria-hidden="true" />
                                    {tr.name}
                                </Chip>
                            ))}
                        </>
                    )}
                </div>

                {planning && (
                    <Card id="plan-my-day" className="mt-4 p-5">
                        <h2 className="mb-4 font-display text-xl font-bold text-ink">{t('Plan my day')}</h2>
                        <PlanMyDay event={event} />
                    </Card>
                )}

                {agenda.days.length > 1 && (
                    <Tabs className="mt-6" label={t('Days')} value={day} onChange={setDay} tabs={agenda.days.map((d) => ({ value: d.key, label: d.label }))} />
                )}

                <div className="mt-6" role={agenda.days.length > 1 ? 'tabpanel' : undefined} id={agenda.days.length > 1 ? `panel-${day}` : undefined} aria-labelledby={agenda.days.length > 1 ? `tab-${day}` : undefined}>
                    {current ? (
                        <DayGrid day={current} tracks={agenda.tracks} track={agenda.track} onToggle={agenda.toggle} />
                    ) : (
                        <EmptyState icon={Bookmark} title={agenda.onlyMine ? t('Nothing in your agenda yet') : t('No sessions')} body={agenda.onlyMine ? t('Bookmark sessions to build your own day.') : null} />
                    )}
                </div>

                {speakers.length > 0 && (
                    <section aria-labelledby="speakers" className="mt-16 border-t border-line pt-8">
                        <h2 id="speakers" className="font-display text-2xl font-bold text-ink">{t('Speakers')}</h2>
                        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {speakers.map((sp) => (
                                <li key={sp.id} className="flex gap-3 rounded-card border border-line bg-surface p-4">
                                    <Avatar image={sp.avatar} name={sp.name} size={56} />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-ink">{sp.name}</p>
                                        {sp.headline && <p className="text-sm text-muted">{sp.headline}</p>}
                                        {sp.bio && <p className="mt-1 line-clamp-3 text-sm text-body">{sp.bio}</p>}
                                        {sp.links?.length > 0 && (
                                            <p className="mt-1 flex flex-wrap gap-3 text-sm">
                                                {sp.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noreferrer noopener" className="font-semibold text-link hover:underline">{l.label}</a>)}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {sponsors.length > 0 && (
                    <section aria-labelledby="sponsors" className="mt-16 border-t border-line pt-8">
                        <h2 id="sponsors" className="font-display text-2xl font-bold text-ink">{t('Sponsors')}</h2>
                        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                            {sponsors.map((sp) => (
                                <li key={sp.name}>
                                    <a href={sp.url ?? '#'} target="_blank" rel="noreferrer noopener" className="flex h-24 flex-col items-center justify-center gap-1 rounded-card border border-line bg-surface p-3 text-center hover:border-edge">
                                        {sp.logo ? <img src={thumbSrc(sp.logo, 120)} alt={sp.name} width={sp.logo.width} height={sp.logo.height} loading="lazy" decoding="async" className="h-auto w-auto max-h-12 max-w-full object-contain" /> : <span className="font-semibold text-ink">{sp.name}</span>}
                                        {sp.tier && <span className="font-mono text-[11px] uppercase tracking-widest text-muted">{sp.tier}</span>}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </Container>
        </div>
    );
}

Agenda.layout = layout;
