import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ChevronsUpDown, MapPin, Ticket } from 'lucide-react';
import { categoryPath, eventPath, eventWhen, organizerPath, useCityPicker, useFollowOrganizer, weekendDays } from '@/Core/events';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/civic/Layout';
import { Avatar, Button, Card, Chip, cn, Container, DateStamp, EmptyState, FacePile, Img, Rail, SectionHead } from '@/Themes/civic/components/ui';
import { Availability, EventCard, EventRow, PosterCard, Price } from '@/Themes/civic/components/events';
import MapView, { pinsFromEvents } from '@/Themes/civic/components/MapView';
import CityPicker from '@/Themes/civic/components/CityPicker';

/*
 | Home: the city's feed (`GET /home`, every layout the app draws). The top is
 | not a centred hero: the city name set big on the left, the switcher beside
 | it, the viewer's next ticket on the right, then a bento of the featured
 | events. Each later section is drawn by its `layout`.
 */

function CityHeader({ city, cities, nextTicket }) {
    const { choose } = useCityPicker(cities, city);
    const url = useRoute();
    const when = nextTicket ? eventWhen(nextTicket.event) : null;

    return (
        <div className="grid gap-6 pb-8 pt-8 sm:pt-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
                <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">{t('This week in')}</p>
                <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
                    <h1 className="font-display text-[56px] font-extrabold leading-[0.92] tracking-[-0.045em] text-ink sm:text-[88px] lg:text-[112px]">
                        {city?.name ?? t('Your city')}
                    </h1>
                    {cities?.length > 1 && (
                        <div className="mb-2 sm:mb-4">
                            <CityPicker cities={cities} value={city?.slug} onChange={choose} buttonClassName="h-10 rounded-chip border-key border-edge bg-surface px-4 text-sm font-semibold text-ink hover:bg-raised">
                                <MapPin className="h-4 w-4" aria-hidden="true" />
                                {t('Change city')}
                                <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                            </CityPicker>
                        </div>
                    )}
                </div>
            </div>

            {nextTicket && when && (
                <Link href={url(`/t/${nextTicket.code}`)} className="group flex max-w-md items-center gap-4 rounded-card border-key border-edge bg-tint-2 p-4 text-on-tint-2 shadow-key transition-transform hover:-translate-y-0.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-key border-edge bg-surface text-ink"><Ticket className="h-5 w-5" aria-hidden="true" /></span>
                    <span className="min-w-0">
                        <span className="block font-mono text-[11px] uppercase tracking-widest">{t('Your next ticket')} · {when.relative ?? when.date}</span>
                        <span className="block truncate font-display text-lg font-bold">{nextTicket.event.title}</span>
                        <span className="block font-mono text-xs">{when.date} · {when.time} {when.zone}</span>
                    </span>
                    <ArrowRight className="ms-auto h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}

/** `hero`: a bento — one large feature, the rest as tiles. */
function Bento({ section }) {
    const url = useRoute();
    const [lead, ...rest] = section.events;
    if (!lead) return null;
    const when = eventWhen(lead);

    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <h2 id={`s-${section.key}`} className="sr-only">{t(section.title)}</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-2">
                <article className="group relative col-span-2 overflow-hidden rounded-card border-key border-edge bg-raised shadow-key md:row-span-2">
                    <Img image={lead.cover} alt="" priority sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/5] h-full w-full sm:aspect-[16/11] md:aspect-auto" ratio={0.8} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/95 via-scrim/70 to-transparent p-5 pt-24 sm:p-7 sm:pt-32">
                        <p className="font-mono text-xs uppercase tracking-[0.16em] text-on-scrim/90">{t(section.title)}{when?.relative ? ` · ${when.relative}` : ''}</p>
                        <h3 className="mt-2 font-display text-[32px] font-extrabold leading-[1.02] tracking-[-0.03em] text-on-scrim sm:text-[44px]">
                            <Link href={url(eventPath(lead.slug))} className="after:absolute after:inset-0 after:content-['']">{lead.title}</Link>
                        </h3>
                        <p className="mt-2 font-mono text-sm text-on-scrim/90">{when?.date} · {when?.time} {when?.zone}{lead.venue?.name ? ` · ${lead.venue.name}` : ''}</p>
                    </div>
                    <div className="absolute start-4 top-4"><DateStamp when={when} size="lg" /></div>
                </article>
                {rest.slice(0, 4).map((event, i) => {
                    const w = eventWhen(event);
                    return (
                        <article key={event.id} className={cn('group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface', i === 1 && 'md:bg-tint')}>
                            <Img image={event.cover} alt="" sizes="(min-width: 768px) 25vw, 100vw" className="aspect-[16/9] w-full" ratio={9 / 16} />
                            <div className="flex flex-1 flex-col p-3 sm:p-4">
                                <p className="font-mono text-[11px] text-muted sm:text-xs">{w?.date} · {w?.time} {w?.zone}</p>
                                <h3 className="mt-1 font-display text-base font-bold leading-snug text-ink sm:text-lg">
                                    <Link href={url(eventPath(event.slug))} className="after:absolute after:inset-0 after:content-['']"><span className="line-clamp-2">{event.title}</span></Link>
                                </h3>
                                <div className="mt-auto flex items-center justify-between pt-2"><Price price={event.price} external={Boolean(event.external)} /><Availability event={event} /></div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function Head2({ section, href, rail }) {
    return <SectionHead id={`s-${section.key}`} title={t(section.title)} subtitle={section.subtitle} href={href} rail={rail} />;
}

function seeAll(section, url) {
    if (section.category) return url(categoryPath(section.category.slug));
    if (section.key === 'this_weekend') return url('/discover?date=weekend');
    if (section.key === 'near_you' || section.key === 'trending') return url('/discover');
    return null;
}

/** `grid3`: columns of three compact rows. */
function Grid3({ section }) {
    const url = useRoute();
    const columns = [];
    for (let i = 0; i < section.events.length; i += 3) columns.push(section.events.slice(i, i + 3));
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Head2 section={section} href={seeAll(section, url)} rail />
            <Rail label={t(section.title)} itemClass="w-[88%] sm:w-[48%] lg:w-[32%]">
                {columns.map((col, i) => (
                    <div key={i} className="divide-y divide-line rounded-card border border-line bg-surface px-4">
                        {col.map((event) => <EventRow key={event.id} event={event} />)}
                    </div>
                ))}
            </Rail>
        </section>
    );
}

/** `ranked`: 1–10 in two columns, big numerals. */
function Ranked({ section }) {
    const url = useRoute();
    const items = section.events.slice(0, 10);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Head2 section={section} href={seeAll(section, url)} />
            <ol className="grid gap-x-8 rounded-card border-key border-edge bg-surface px-4 py-2 shadow-key sm:px-6 md:grid-cols-2">
                {items.map((event, i) => (
                    <li key={event.id} className="border-b border-line last:border-0 md:[&:nth-last-child(2)]:border-0">
                        <EventRow event={event} rank={i + 1} />
                    </li>
                ))}
            </ol>
        </section>
    );
}

/** `weekend`: Fri / Sat / Sun, in each event's own weekday. */
function Weekend({ section }) {
    const url = useRoute();
    const days = useMemo(() => weekendDays(section.events), [section.events]);
    const firstWithEvents = days.find((d) => d.events.length)?.key ?? 'Fri';
    const [day, setDay] = useState(firstWithEvents);
    const current = days.find((d) => d.key === day);

    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16 rounded-card bg-tint px-4 py-8 text-on-tint sm:px-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <h2 id={`s-${section.key}`} className="font-display text-[30px] font-bold tracking-[-0.02em] text-on-tint">{t(section.title)}</h2>
                <div className="flex gap-2" role="group" aria-label={t('Day')}>
                    {days.map((d) => (
                        <Chip key={d.key} active={day === d.key} onClick={() => setDay(d.key)} count={d.events.length || null}>{d.label}</Chip>
                    ))}
                </div>
            </div>
            {current?.events.length ? (
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {current.events.slice(0, 8).map((event) => <li key={event.id}><EventCard event={event} sticker /></li>)}
                </ul>
            ) : (
                <p className="text-[15px]">{t('Nothing listed for that day yet.')} <Link className="font-semibold underline" href={url('/discover?date=weekend')}>{t('See the whole weekend')}</Link></p>
            )}
        </section>
    );
}

function Posters({ section }) {
    const url = useRoute();
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Head2 section={section} href={seeAll(section, url)} rail />
            <Rail label={t(section.title)} itemClass="w-[62%] xs:w-[48%] sm:w-[34%] lg:w-[23%]">
                {section.events.map((event) => <PosterCard key={event.id} event={event} />)}
            </Rail>
        </section>
    );
}

function Cards({ section }) {
    const url = useRoute();
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Head2 section={section} href={seeAll(section, url)} rail />
            <Rail label={t(section.title)}>
                {section.events.map((event) => <WithWhy key={event.id} section={section} event={event}><EventCard event={event} /></WithWhy>)}
            </Rail>
        </section>
    );
}

function List({ section }) {
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Head2 section={section} />
            <div className="divide-y divide-line rounded-card border border-line bg-surface px-4">
                {section.events.slice(0, 5).map((event) => <EventRow key={event.id} event={event} />)}
            </div>
        </section>
    );
}

function Categories({ section }) {
    const url = useRoute();
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Head2 section={section} />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {section.categories.map((c) => (
                    <li key={c.slug}>
                        <Link href={url(categoryPath(c.slug))} className="group relative block overflow-hidden rounded-card border border-line bg-raised">
                            <Img image={c.image} alt="" sizes="(min-width: 1024px) 18vw, 45vw" className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.03]" ratio={0.75} />
                            <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-chip border-key border-edge bg-surface px-3 py-1 text-sm font-semibold text-ink shadow-key">
                                {c.name}
                                {c.event_count ? <span className="font-mono text-xs text-muted">{c.event_count}</span> : null}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function OrganizerTile({ organizer, fresh }) {
    const url = useRoute();
    const follow = useFollowOrganizer({ ...organizer, viewer: organizer.viewer ?? {} });
    return (
        <div className="flex h-full flex-col items-center rounded-card border border-line bg-surface p-5 text-center">
            <span className={cn('rounded-full p-1', fresh ? 'bg-cta' : 'bg-transparent')}>
                <Avatar image={organizer.avatar} name={organizer.name} size={72} className="border-key border-edge" />
            </span>
            <Link href={url(organizerPath(organizer.slug))} className="mt-3 line-clamp-2 font-display text-lg font-bold leading-tight text-ink hover:underline">{organizer.name}</Link>
            <p className="mt-0.5 text-sm text-muted">{t(':count followers', { count: organizer.follower_count ?? 0 })}</p>
            {fresh && <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink">{t('New event')}</p>}
            <Button variant={follow.following ? 'quiet' : 'secondary'} size="sm" className="mt-auto" onClick={follow.toggle} loading={follow.busy} aria-pressed={follow.following}>
                {follow.following ? t('Following') : t('Follow')}
            </Button>
        </div>
    );
}

function Organizers({ section }) {
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Head2 section={section} rail />
            <Rail label={t(section.title)} itemClass="w-[60%] xs:w-[44%] sm:w-[30%] lg:w-[19%]">
                {section.organizers.map((o) => <OrganizerTile key={o.slug} organizer={o} fresh={section.new_event_organizers?.includes(o.slug)} />)}
            </Rail>
        </section>
    );
}

/** `collection`: one curated card — a stacked collage, the title, the count. */
function Collection({ section }) {
    const url = useRoute();
    const covers = section.events.slice(0, 3);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Card sticker className="grid items-center gap-8 overflow-hidden p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="relative mx-auto h-[220px] w-full max-w-[320px]">
                    {covers.map((e, i) => (
                        <Img key={e.id} image={e.cover} alt="" sizes="260px" className={cn('absolute h-[180px] w-[230px] rounded-sm border-key border-edge shadow-key', ['start-0 top-6 -rotate-6', 'start-12 top-0 rotate-2', 'start-24 top-10 rotate-6'][i])} ratio={0.78} />
                    ))}
                </div>
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t('Collection')} · {t(':count events', { count: section.count ?? section.events.length })}</p>
                    <h2 id={`s-${section.key}`} className="mt-2 font-display text-[34px] font-extrabold leading-tight tracking-[-0.03em] text-ink">{t(section.title)}</h2>
                    {section.subtitle && <p className="mt-2 text-[17px] text-body">{section.subtitle}</p>}
                    <ul className="mt-5 divide-y divide-line">
                        {section.events.slice(0, 3).map((e) => <li key={e.id}><EventRow event={e} /></li>)}
                    </ul>
                    {section.events.length > 3 && (
                        <Button variant="secondary" className="mt-4" href={url(`/discover?q=`)} trailing={ArrowRight}>{t('See all :count', { count: section.count ?? section.events.length })}</Button>
                    )}
                </div>
            </Card>
        </section>
    );
}

/** `map`: a preview of the city's pins → the Discover map. */
function MapPreview({ section, city }) {
    const url = useRoute();
    const pins = pinsFromEvents(section.events);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                <div className="flex flex-col justify-between rounded-card border-key border-edge bg-tint-2 p-6 text-on-tint-2 shadow-key">
                    <div>
                        <p className="font-mono text-xs uppercase tracking-[0.16em]">{t('On the map')}</p>
                        <h2 id={`s-${section.key}`} className="mt-2 font-display text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-on-tint-2">
                            {section.radius_km
                                ? t(':count events within :km km', { count: section.count ?? pins.length, km: section.radius_km })
                                : t(':count events around :city', { count: section.count ?? pins.length, city: city?.name ?? '' })}
                        </h2>
                    </div>
                    <Button variant="secondary" className="mt-6 self-start" href={url('/discover?view=map')} trailing={ArrowRight}>{t('Open the map')}</Button>
                </div>
                <MapView pins={pins} center={city ? [city.lat, city.lng] : undefined} zoom={12} interactive={false} className="h-[280px] md:h-[320px]" label={t('Map of events')} />
            </div>
        </section>
    );
}

function Friends({ section }) {
    const everyone = [];
    for (const e of section.events) for (const f of e.friends_going ?? []) if (!everyone.find((x) => x.id === f.id)) everyone.push(f);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Head2 section={section} rail />
            <FacePile friends={everyone} size={36} className="mb-5" />
            <Rail label={t(section.title)}>
                {section.events.map((event) => <EventCard key={event.id} event={event} />)}
            </Rail>
        </section>
    );
}

const RENDERERS = { hero: Bento, grid3: Grid3, grid: Grid3, ranked: Ranked, weekend: Weekend, poster: Posters, rail: Cards, list: List, categories: Categories, organizers: Organizers, collection: Collection, map: MapPreview, friends: Friends };

/** "For you": the line under a card that says why it is there. */
function WithWhy({ section, event, children }) {
    const why = section.reasons?.[event.id];
    if (!why) return children;
    return (
        <div>
            {children}
            <p className="mt-2 text-[13px] leading-snug text-muted">{why}</p>
        </div>
    );
}

export default function Home({ city, cities, nextTicket, sections = [] }) {
    const url = useRoute();
    // The web sends no coordinates, so the server has no "near me" map; draw
    // the city's own pins after the near-you rail instead.
    const list = useMemo(() => {
        if (sections.some((s) => s.layout === 'map')) return sections;
        const near = sections.find((s) => s.key === 'near_you');
        if (!near || pinsFromEvents(near.events).length < 2) return sections;
        const at = sections.indexOf(near) + 1;
        return [...sections.slice(0, at), { ...near, key: 'city_map', layout: 'map', count: near.events.length, radius_km: null }, ...sections.slice(at)];
    }, [sections]);

    return (
        <>
            <Head title={city ? t('Events in :city', { city: city.name }) : t('Events')} />
            <Container>
                <CityHeader city={city} cities={cities} nextTicket={nextTicket} />
                {list.length === 0 ? (
                    <EmptyState icon={MapPin} title={t('Nothing listed here yet')} body={t('Try another city, or look at everything on Discover.')} action={<Button variant="cta" href={url('/discover')}>{t('Discover events')}</Button>} />
                ) : (
                    list.map((section, i) => {
                        const Render = RENDERERS[section.layout] ?? Cards;
                        return <Render key={`${section.key}-${i}`} section={section} city={city} />;
                    })
                )}
            </Container>
        </>
    );
}

Home.layout = layout;
