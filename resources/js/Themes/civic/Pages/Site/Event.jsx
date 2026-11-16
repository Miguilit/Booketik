import ExternalClaimInline from '@/Core/components/ExternalClaimInline';
import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { BadgeCheck, Bookmark, BookmarkCheck, CalendarPlus, Clock, ExternalLink, Globe, Info, Lock, MapPin, MessageCircleQuestion, Navigation, RefreshCcw, Share2, ShieldCheck, Ticket, Users } from 'lucide-react';
import {
    accentStyle, addressLines, availabilityTag, calendarLinks, ctaFor, eventPath, eventWhen, formatLabel, kindLabel, lineupFrom,
    organizerPath, displayPrice, externalAvailabilityLabel, priceLabel, priceNote, useAskEvent, useEventActions, useFollowOrganizer, useNow,
} from '@/Core/events';
import { tierStateLabel } from '@/Core/ticketCheckout';
import { useMode } from '@/Core/mode';
import { useRoute } from '@/Core/site';
import { osmLink } from '@/Core/map';
import { t } from '@/Core/i18n';
import { thumbSrc } from '@/Core/media';
import { layout } from '@/Themes/civic/Layout';
import { Avatar, Button, Card, buttonClass, cn, Container, DateStamp, FacePile, IconButton, Img, Input, Notice, Tabs, Tag } from '@/Themes/civic/components/ui';
import Blocks from '@/Themes/civic/components/Blocks';
import MapView from '@/Themes/civic/components/MapView';
import { CallForSpeakersForm, ConferenceTools } from '@/Themes/civic/components/conference';

/*
 | The event page: cover, title, date in the event's zone with
 | "in 3 days", venue with a map tile, the registration card (sticky on the
 | right on desktop, a bottom bar on phones), fees-included price, hosts with
 | follow, a face pile, the description, lineup / agenda / speakers /
 | sponsors for conferences, FAQ and refund policy, add-to-calendar, share.
 | The page wears the event's guarded accent (`--ev-accent`).
 */

function CtaButton({ cta, block, size = 'lg' }) {
    if (cta.kind === 'disabled') {
        return (
            <Button variant="quiet" size={size} block={block} disabled aria-disabled="true">
                {cta.action === 'pending' ? <Clock className="h-[18px] w-[18px]" aria-hidden="true" /> : null}
                {cta.label}
                {cta.countdown ? <span className="font-mono text-sm">{cta.countdown.label}</span> : null}
            </Button>
        );
    }
    const variant = cta.tone === 'signal' ? 'signal' : 'accent';
    return (
        <Button variant={variant} size={size} block={block} href={cta.href} external={cta.kind === 'external'} icon={cta.action === 'view_ticket' ? Ticket : cta.action === 'join_online' ? Globe : undefined}>
            {cta.label}
            {cta.countdown ? <span className="rounded-chip bg-bg/25 px-2 py-0.5 font-mono text-sm">{cta.countdown.label}</span> : null}
        </Button>
    );
}

function RegistrationCard({ event, tiers, cta, when }) {
    if (event.external) {
        return (
            <Card sticker className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t('External event')}</p>
                        <p className="mt-1 font-display text-[30px] leading-tight text-ink">{displayPrice(event)}</p>
                    </div>
                    {event.availability === 'sold_out' && <Tag tone="danger">{t('Sold out')}</Tag>}
                </div>
                <p className="mt-2 text-xs text-muted">{externalAvailabilityLabel(event)}</p>
                <p className="mt-3 text-sm text-body">{t('Tickets and registration are managed by the organizer, not Booketik.')}</p>
                <p className="mt-2 text-xs text-muted">{t('Prices and availability are provided by the official source and may change.')}</p>
                {event.external.organizer_name && <p className="mt-3 font-semibold text-ink">{event.external.organizer_name}</p>}
                <div className="mt-5"><CtaButton cta={cta} block /></div>
                <p className="mt-3 text-xs text-muted">{event.external.attribution || event.external.source_name || t('Official source')}</p>
            </Card>
        );
    }
    const price = priceLabel(event.price);
    const note = priceNote(event.price);
    const tag = availabilityTag(event.availability);
    const visible = tiers.filter((tier) => tier.state !== 'hidden_unlocked' || tier.requires_code).slice(0, 4);

    return (
        <Card sticker className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{event.price?.is_free ? t('Entry') : t('Tickets')}</p>
                    {price && <p className="mt-1 font-display text-[32px] font-extrabold leading-none tracking-[-0.02em] text-ink">{price}</p>}
                    {note && <p className="mt-1 text-sm text-muted">{note}</p>}
                </div>
                {tag && <Tag tone={tag.tone}>{tag.label}</Tag>}
            </div>

            {visible.length > 0 && (
                <ul className="mt-5 divide-y divide-line border-y border-line">
                    {visible.map((tier) => {
                        const state = tierStateLabel(tier);
                        return (
                            <li key={tier.id} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold text-ink">{tier.name}</span>
                                    {(state || tier.remaining != null) && (
                                        <span className={cn('block text-xs', tier.remaining != null && !state ? 'font-semibold text-warning' : 'text-muted')}>
                                            {state ?? t(':count left', { count: tier.remaining })}
                                        </span>
                                    )}
                                </span>
                                <span className={cn('shrink-0 font-mono text-sm', ['sold_out', 'ended'].includes(tier.state) ? 'text-muted line-through' : 'text-ink')}>
                                    {tier.kind === 'free' ? t('Free') : tier.total?.formatted}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="mt-5">
                <CtaButton cta={cta} block />
                {cta.note && <p className="mt-2 text-center text-sm text-muted">{cta.note}</p>}
            </div>

            <ul className="mt-5 space-y-2 text-sm text-muted">
                {event.approval_required && <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{t('The organizer approves each guest.')}</li>}
                {!event.price?.is_free && event.price?.fees_included && <li className="flex items-center gap-2"><Info className="h-4 w-4 shrink-0" aria-hidden="true" />{t('Prices include all fees. No surprises at checkout.')}</li>}
                {event.waitlist_enabled && event.availability === 'waitlist' && <li className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" aria-hidden="true" />{t('Join the waitlist — you get 24 hours to claim a freed spot.')}</li>}
                {when?.viewerTime && <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" aria-hidden="true" />{t('Starts :time', { time: when.viewerTime })}</li>}
            </ul>
        </Card>
    );
}


function Hosts({ event }) {
    const url = useRoute();
    const organizer = event.organizer;
    const follow = useFollowOrganizer({ ...organizer, viewer: { following: event.viewer?.following_organizer } });
    return (
        <section aria-labelledby="hosts" className="border-t border-line pt-8">
            <h2 id="hosts" className="font-display text-2xl font-bold text-ink">{event.hosts?.length > 1 ? t('Hosts') : t('Hosted by')}</h2>
            <ul className="mt-4 space-y-3">
                {(event.hosts?.length ? event.hosts : [organizer]).map((host, i) => (
                    <li key={host.slug} className="flex items-center gap-3">
                        <Avatar image={host.avatar} name={host.name} size={48} className="border-key border-edge" />
                        <div className="min-w-0 flex-1">
                            <Link href={url(organizerPath(host.slug))} className="inline-flex items-center gap-1 font-semibold text-ink hover:underline">
                                {host.name}
                                {host.is_verified && <BadgeCheck className="h-4 w-4 text-link" aria-label={t('Verified organizer')} />}
                            </Link>
                            <p className="text-sm text-muted">{t(':count followers', { count: host.follower_count ?? 0 })}</p>
                        </div>
                        {i === 0 && (
                            <Button size="sm" variant={follow.following ? 'quiet' : 'secondary'} onClick={follow.toggle} loading={follow.busy} aria-pressed={follow.following}>
                                {follow.following ? t('Following') : t('Follow')}
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}

function Venue({ event }) {
    const v = event.venue;
    if (event.format === 'online') {
        return (
            <section aria-labelledby="where" className="border-t border-line pt-8">
                <h2 id="where" className="font-display text-2xl font-bold text-ink">{t('Online')}</h2>
                <p className="mt-2 flex items-center gap-2 text-[15px] text-body"><Globe className="h-4 w-4" aria-hidden="true" />{event.online?.join_url ? t('The join link is on your ticket.') : t('The join link appears here and on your ticket before it starts.')}</p>
            </section>
        );
    }
    if (!v) return null;
    const lines = addressLines(v);
    const hasPoint = v.lat != null && v.lng != null;
    return (
        <section aria-labelledby="where" className="border-t border-line pt-8">
            <h2 id="where" className="font-display text-2xl font-bold text-ink">{t('Where')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.3fr]">
                <div>
                    <p className="font-semibold text-ink">{v.name}</p>
                    {lines.length ? (
                        <address className="mt-1 not-italic text-[15px] text-body">{lines.map((l) => <span key={l} className="block">{l}</span>)}</address>
                    ) : (
                        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted"><Lock className="h-4 w-4" aria-hidden="true" />{t('The exact address is shared after you register.')}</p>
                    )}
                    {event.format === 'hybrid' && <p className="mt-2 text-sm text-muted">{t('Also streamed online.')}</p>}
                    {hasPoint && (
                        <Button variant="secondary" size="sm" className="mt-4" href={v.directions_url ?? osmLink(v.lat, v.lng)} external icon={Navigation}>{t('Directions')}</Button>
                    )}
                </div>
                {hasPoint && (
                    <MapView pins={[{ id: 'venue', lat: v.lat, lng: v.lng, label: v.name, badge: '' }]} center={[v.lat, v.lng]} zoom={15} interactive={false} className="h-[200px]" label={t('Map of :place', { place: v.name })} />
                )}
            </div>
        </section>
    );
}

function Program({ event, sessions, sessionCount, speakers, sponsors }) {
    const url = useRoute();
    const lineup = lineupFrom(event.description);
    const tabs = [
        lineup.length && { value: 'lineup', label: t('Lineup'), count: lineup.length },
        sessionCount && { value: 'agenda', label: t('Agenda'), count: sessionCount },
        speakers.length && { value: 'speakers', label: t('Speakers'), count: speakers.length },
        sponsors.length && { value: 'sponsors', label: t('Sponsors'), count: sponsors.length },
    ].filter(Boolean);
    const [tab, setTab] = useState(tabs[0]?.value);
    if (!tabs.length) return null;

    return (
        <section aria-labelledby="program" className="border-t border-line pt-8">
            <h2 id="program" className="font-display text-2xl font-bold text-ink">{event.kind === 'conference' ? t('Programme') : t('Lineup')}</h2>
            {tabs.length > 1 && <Tabs tabs={tabs} value={tab} onChange={setTab} label={t('Programme')} className="mt-4" />}
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={tabs.length > 1 ? `tab-${tab}` : undefined} className="mt-5">
                {tab === 'lineup' && (
                    <ol className="flex flex-wrap gap-2">
                        {lineup.map((name, i) => (
                            <li key={name} className={cn('rounded-chip border-key border-edge px-4 py-2 font-display text-lg font-bold', i === 0 ? 'bg-accent text-on-accent shadow-key' : 'bg-surface text-ink')}>{name}</li>
                        ))}
                    </ol>
                )}
                {tab === 'agenda' && (
                    <>
                        <ol className="divide-y divide-line rounded-card border border-line bg-surface">
                            {sessions.map((s) => {
                                const w = eventWhen({ starts_at: s.starts_at, ends_at: s.ends_at, timezone: event.timezone });
                                return (
                                    <li key={s.id} className="grid grid-cols-[72px_1fr] gap-3 p-4">
                                        <span className="font-mono text-sm text-ink">{w.time}<span className="block text-xs text-muted">{w.endTime}</span></span>
                                        <span>
                                            <span className="block font-semibold text-ink">{s.title}</span>
                                            <span className="block text-sm text-muted">{[s.room, s.track?.name, s.speakers?.map((sp) => sp.name).join(', ')].filter(Boolean).join(' · ')}</span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                        <Button variant="secondary" className="mt-4" href={url(`${eventPath(event.slug)}/agenda`)}>{t('Full agenda and My agenda')}</Button>
                    </>
                )}
                {tab === 'speakers' && (
                    <ul className="grid gap-4 sm:grid-cols-2">
                        {speakers.map((sp) => (
                            <li key={sp.id} className="flex gap-3 rounded-card border border-line bg-surface p-4">
                                <Avatar image={sp.avatar} name={sp.name} size={56} />
                                <div className="min-w-0">
                                    <p className="font-semibold text-ink">{sp.name}</p>
                                    {sp.headline && <p className="text-sm text-muted">{sp.headline}</p>}
                                    {sp.bio && <p className="mt-1 line-clamp-3 text-sm text-body">{sp.bio}</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {tab === 'sponsors' && (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {sponsors.map((sp) => (
                            <li key={sp.name}>
                                <a href={sp.url ?? '#'} target="_blank" rel="noreferrer" className="flex h-24 flex-col items-center justify-center gap-1 rounded-card border border-line bg-surface p-3 text-center hover:border-edge">
                                    {sp.logo ? <img src={thumbSrc(sp.logo, 120)} alt={sp.name} width={sp.logo.width} height={sp.logo.height} loading="lazy" decoding="async" className="h-auto w-auto max-h-12 max-w-full object-contain" /> : <span className="font-semibold text-ink">{sp.name}</span>}
                                    {sp.tier && <span className="font-mono text-[11px] uppercase tracking-widest text-muted">{sp.tier}</span>}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

function Faq({ event }) {
    if (!event.faq?.length && !event.refund_policy && !event.age_min) return null;
    return (
        <section aria-labelledby="faq" className="border-t border-line pt-8">
            <h2 id="faq" className="font-display text-2xl font-bold text-ink">{t('Good to know')}</h2>
            <div className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
                {event.refund_policy && (
                    <details className="group p-4" open>
                        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-ink"><RefreshCcw className="h-4 w-4" aria-hidden="true" />{t('Refund policy')}</summary>
                        <p className="mt-2 text-[15px] text-body" data-user-content>{event.refund_policy}</p>
                    </details>
                )}
                {event.age_min ? (
                    <p className="p-4 text-[15px] text-body"><strong className="text-ink">{t('Age')}:</strong> {t(':age+ only, ID may be checked at the door.', { age: event.age_min })}</p>
                ) : null}
                {(event.faq ?? []).map((f) => (
                    <details key={f.q} className="group p-4">
                        <summary className="cursor-pointer list-none font-semibold text-ink after:float-end after:font-mono after:content-['+'] group-open:after:content-['−']"><span data-user-content>{f.q}</span></summary>
                        <p className="mt-2 whitespace-pre-line text-[15px] text-body" data-user-content>{f.a}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}

function Ask({ event }) {
    const { question, setQuestion, answer, busy, ask } = useAskEvent(event);
    return (
        <section aria-labelledby="ask" className="rounded-card bg-tint p-5 text-on-tint">
            <h2 id="ask" className="flex items-center gap-2 font-display text-xl font-bold text-on-tint"><MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />{t('Ask about this event')}</h2>
            <p className="mt-1 text-sm">{t('Answered by AI, only from what the organizer wrote on this page. AI can make mistakes — check anything important with the organizer.')}</p>
            <form onSubmit={ask} className="mt-3 flex gap-2">
                <label htmlFor="ask-q" className="sr-only">{t('Your question')}</label>
                <Input id="ask-q" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('Is there step-free access?')} maxLength={300} />
                <Button type="submit" variant="primary" loading={busy}>{t('Ask')}</Button>
            </form>
            {answer && (
                <div className="mt-3 rounded-sm bg-surface p-3 text-[15px] text-body" aria-live="polite">
                    {answer.answered ? answer.answer : (answer.error ?? t('The page does not say. You can ask the organizer directly.'))}
                </div>
            )}
        </section>
    );
}

export default function EventPage({ event, tiers = [], sessions = [], sessionCount = 0, speakers = [], sponsors = [], callForSpeakers = null, accent, externalClaim = null }) {
    const url = useRoute();
    const { dark } = useMode();
    const now = useNow(1000);
    const when = eventWhen(event, now);
    const cta = ctaFor(event, url, now);
    const actions = useEventActions(event);
    const calendar = useMemo(() => calendarLinks(event), [event]);
    const style = accentStyle(accent, dark);

    return (
        <div style={style}>
            <Head title={event.title} />
            {event.availability === 'cancelled' && (
                <div className="bg-danger py-2.5 text-center text-sm font-semibold text-bg">{t('This event has been cancelled.')}</div>
            )}
            <Container className="pb-32 pt-6 lg:pb-16 lg:pt-10">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
                    <div className="min-w-0 space-y-8">
                        <div className="relative overflow-hidden rounded-card border-key border-edge bg-raised shadow-key">
                            <Img image={event.cover} alt="" priority sizes="(min-width: 1024px) 760px, 100vw" className="aspect-[3/2] w-full" ratio={2 / 3} />
                            <div className="absolute end-3 top-3 flex gap-2">
                                <IconButton label={actions.saved ? t('Saved') : t('Save')} icon={actions.saved ? BookmarkCheck : Bookmark} variant="secondary" onClick={actions.toggleSave} aria-pressed={actions.saved} />
                                <IconButton label={t('Share')} icon={Share2} variant="secondary" onClick={actions.share} />
                            </div>
                        </div>

                        <header>
                            <div className="flex flex-wrap items-center gap-2">
                                {event.category && <Tag tone="info">{event.category.name}</Tag>}
                                {kindLabel(event.kind) && event.kind !== 'community' && <Tag>{kindLabel(event.kind)}</Tag>}
                                <Tag tone="muted">{formatLabel(event.format)}</Tag>
                                {when?.live && <Tag tone="danger">{t('Live now')}</Tag>}
                            </div>
                            <h1 className="mt-3 font-display text-[40px] font-extrabold leading-[1.0] tracking-[-0.035em] text-ink sm:text-[56px]" data-user-content>{event.title}</h1>
                            {event.summary && <p className="mt-3 max-w-2xl text-[19px] leading-relaxed text-body" data-user-content>{event.summary}</p>}

                            {when && (
                                <div className="mt-6 flex items-center gap-4">
                                    <DateStamp when={when} size="lg" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-ink">{when.long}</p>
                                        <p className="font-mono text-[15px] text-ink">
                                            {when.time}{when.endTime ? `–${when.multiDay ? `${when.endDate} ` : ''}${when.endTime}` : ''} <span className="text-muted">{when.zone}</span>
                                        </p>
                                        <p className="text-sm text-muted">
                                            {[when.relative, when.viewerTime].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    {calendar && (
                                        <Menu as="div" className="relative ms-auto">
                                            <MenuButton className="inline-flex h-10 items-center gap-1.5 rounded-btn border-key border-edge bg-surface px-3 text-sm font-semibold text-ink hover:bg-raised" aria-label={t('Add to calendar')}>
                                                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                                                <span className="hidden sm:inline">{t('Add to calendar')}</span>
                                            </MenuButton>
                                            <MenuItems anchor="bottom end" className="z-50 mt-2 w-52 rounded-card border-key border-edge bg-surface p-1.5 shadow-key focus:outline-none">
                                                {[
                                                    calendar.ics && { href: calendar.ics, label: t('Apple / iCal (.ics)') },
                                                    { href: calendar.google, label: 'Google Calendar' },
                                                    { href: calendar.outlook, label: 'Outlook' },
                                                ].filter(Boolean).map((item) => (
                                                    <MenuItem key={item.label}>
                                                        <a href={item.href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-sm px-3 py-2 text-[15px] text-ink data-[focus]:bg-raised">
                                                            {item.label}<ExternalLink className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                                                        </a>
                                                    </MenuItem>
                                                ))}
                                            </MenuItems>
                                        </Menu>
                                    )}
                                </div>
                            )}

                            {!event.external && <FacePile people={event.guests_preview ?? []} friends={event.friends_going ?? []} total={event.going_count} className="mt-6" />}
                            {event.series?.occurrences?.length > 1 && (
                                <div className="mt-6">
                                    <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-muted">{t('More dates')}</p>
                                    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                                        {event.series.occurrences.slice(0, 8).map((o) => {
                                            const w = eventWhen({ starts_at: o.starts_at, timezone: event.timezone });
                                            const current = o.slug === event.slug;
                                            return (
                                                <Link key={o.slug} href={url(eventPath(o.slug))} aria-current={current ? 'page' : undefined} className={cn('shrink-0 rounded-chip border-key px-4 py-2 font-mono text-sm', current ? 'border-edge bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-edge')}>
                                                    {w.date} · {w.time}
                                                </Link>
                                            );
                                        })}
                                        <Link href={url(`/s/${event.series.id}`)} className="shrink-0 self-center px-2 text-sm font-semibold text-link">{t('All dates')}</Link>
                                    </div>
                                </div>
                            )}
                        </header>

                        {event.availability === 'claim' || cta.action === 'claim' ? (
                            <Notice tone="warn" icon={Ticket}>{t('A spot opened up for you. Claim it before :time.', { time: cta.countdown?.label ?? '' })}</Notice>
                        ) : null}

                        {event.description?.length > 0 && (
                            <section aria-labelledby="about" className="border-t border-line pt-8">
                                <h2 id="about" className="font-display text-2xl font-bold text-ink">{t('About')}</h2>
                                <Blocks blocks={event.description} className="mt-4 max-w-2xl" />
                            </section>
                        )}

                        <Program event={event} sessions={sessions} sessionCount={sessionCount} speakers={speakers} sponsors={sponsors} />
                        <ConferenceTools event={event} sessionCount={sessionCount} />
                        {callForSpeakers && <CallForSpeakersForm event={event} call={callForSpeakers} />}
                        <Venue event={event} />
                        {!event.external && <Hosts event={event} />}
                        <Faq event={event} />
                        {!event.external && <Ask event={event} />}
                        {event.external && externalClaim && <ExternalClaimInline claim={externalClaim} />}

                        {event.gallery?.length > 0 && (
                            <section aria-labelledby="photos" className="border-t border-line pt-8">
                                <h2 id="photos" className="font-display text-2xl font-bold text-ink">{t('Photos')}</h2>
                                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {event.gallery.map((img, i) => <li key={i}><Img image={img} alt="" sizes="(min-width: 640px) 25vw, 45vw" className="aspect-square w-full rounded-sm border border-line" ratio={1} /></li>)}
                                </ul>
                            </section>
                        )}
                    </div>

                    <aside className="hidden lg:block" aria-label={t('Registration')}>
                        <div className="sticky top-24 space-y-4">
                            <RegistrationCard event={event} tiers={tiers} cta={cta} when={when} />
                            {event.external && externalClaim && <a href="#claim" className="block rounded-btn border border-line px-4 py-3 text-center text-sm font-semibold text-link hover:bg-raised">{externalClaim.action}</a>}
                            {event.viewer?.referral_url && (
                                <Card className="p-4 text-sm text-body">
                                    <p className="font-semibold text-ink">{t('Bring friends')}</p>
                                    <p className="mt-1">{t('Share your own link — the organizer sees who you brought.')}</p>
                                    <Button variant="link" className="mt-1" onClick={actions.share}>{t('Copy invite link')}</Button>
                                </Card>
                            )}
                        </div>
                    </aside>
                </div>
            </Container>

            {/* Phones: the price and the one button stay on screen. */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t-key border-edge bg-surface px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
                <div className="flex items-center gap-3">
                    <div className="min-w-0">
                        <p className="truncate font-display text-xl font-extrabold leading-none text-ink">{displayPrice(event) ?? ''}</p>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted">{when?.date} · {when?.time} {when?.zone}</p>
                        {event.external && <p className="truncate text-xs text-muted">{externalAvailabilityLabel(event)}</p>}
                    </div>
                    <div className="ms-auto shrink-0"><CtaButton cta={cta} size="md" /></div>
                </div>
            </div>
        </div>
    );
}

EventPage.layout = layout;
