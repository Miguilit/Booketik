import { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ChevronsUpDown, MapPin, Ticket } from 'lucide-react';
import { categoryPath, eventPath, eventWhen, organizerPath, useCityPicker, useFollowOrganizer, weekendDays, zonedParts } from '@/Core/events';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import CityPicker from '@/Themes/almanac/components/CityPicker';
import { layout } from '@/Themes/almanac/Layout';
import { Avatar, Button, cn, Container, EmptyState, FacePile, Img, Rail, SectionHead } from '@/Themes/almanac/components/ui';
import { Availability, EventCard, EventRow, PosterCard, Price, ProgrammeRow, When } from '@/Themes/almanac/components/events';
import MapView, { pinsFromEvents } from '@/Themes/almanac/components/MapView';

/*
 | Home, as a printed programme for the city: a masthead with the week's
 | dates, an editor's lead, then the week set as dated listings with margin
 | datelines and column rules. Every `/home` layout has an editorial form.
 */

function weekRange(city) {
    const tz = city?.timezone || 'UTC';
    const now = new Date();
    const end = new Date(now.getTime() + 6 * 86400000);
    const a = zonedParts(now.toISOString(), tz);
    const b = zonedParts(end.toISOString(), tz);
    return a.month === b.month ? `${a.day}–${b.day} ${a.month}` : `${a.day} ${a.month} – ${b.day} ${b.month}`;
}

function Cover({ city, cities, nextTicket }) {
    const { choose } = useCityPicker(cities, city);
    const url = useRoute();
    const when = nextTicket ? eventWhen(nextTicket.event) : null;

    return (
        <div className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_300px] lg:items-end">
            <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{t('The week in')}</p>
                <h1 className="mt-1 font-display text-[64px] leading-[0.9] text-ink sm:text-[104px] lg:text-[128px]">
                    {city?.name ?? t('Your city')}
                </h1>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                    <p className="font-display text-[26px] italic text-link sm:text-[30px]">{weekRange(city)}</p>
                    {cities?.length > 1 && (
                        <CityPicker cities={cities} value={city?.slug} onChange={choose} buttonClassName="border-b border-ink font-display text-[18px] italic text-ink hover:text-link">
                            {t('another city')}
                            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                        </CityPicker>
                    )}
                </div>
            </div>
            {nextTicket && when && (
                <Link href={url(`/t/${nextTicket.code}`)} className="group block rounded-card bg-tint-2 p-5 text-on-tint-2 shadow-key">
                    <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em]"><Ticket className="h-3.5 w-3.5" aria-hidden="true" />{t('Your next ticket')}</p>
                    <p className="mt-2 font-display text-[24px] leading-tight">{nextTicket.event.title}</p>
                    <p className="mt-1 font-display text-[16px] italic">{when.date}, {when.time} <span className="font-mono text-xs not-italic">{when.zone}</span>{when.relative ? ` · ${when.relative}` : ''}</p>
                    <span className="mt-3 inline-flex items-center gap-1 border-b border-current text-sm">{t('Open ticket')}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" /></span>
                </Link>
            )}
        </div>
    );
}

/** `hero`: the editor's lead story, then the other picks in a ruled column. */
function Lead({ section }) {
    const url = useRoute();
    const [lead, ...rest] = section.events;
    if (!lead) return null;
    const when = eventWhen(lead);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16 border-t border-ink pt-5">
            <p id={`s-${section.key}`} className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{t(section.title)}{section.subtitle ? ` — ${section.subtitle}` : ''}</p>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:divide-x lg:divide-line rtl:lg:divide-x-reverse">
                <article className="group relative lg:pe-8">
                    <Img image={lead.cover} alt="" priority sizes="(min-width: 1024px) 60vw, 100vw" className="aspect-[16/10] w-full rounded-card" ratio={0.625} />
                    <When when={when} className="mt-4 text-[20px]" />
                    <h2 className="mt-1 font-display text-[40px] leading-[1.02] text-ink sm:text-[56px]">
                        <Link href={url(eventPath(lead.slug))} className="after:absolute after:inset-0 after:content-[''] group-hover:underline decoration-1 underline-offset-8">{lead.title}</Link>
                    </h2>
                    <p className="mt-2 text-[15px] text-muted">{[lead.venue?.name, lead.venue?.city].filter(Boolean).join(', ')}{when?.relative ? ` · ${when.relative}` : ''}</p>
                    <div className="mt-3 flex items-center gap-3"><Price price={lead.price} external={Boolean(lead.external)} /><Availability event={lead} /></div>
                </article>
                <ol className="lg:ps-8">
                    {rest.slice(0, 4).map((event) => <li key={event.id}><ProgrammeRow event={event} /></li>)}
                </ol>
            </div>
        </section>
    );
}

function seeAll(section, url) {
    if (section.category) return url(categoryPath(section.category.slug));
    if (section.key === 'this_weekend') return url('/discover?date=weekend');
    if (['near_you', 'trending'].includes(section.key)) return url('/discover');
    return null;
}

/** `grid3` / `list` / `grid`: the listings, grouped by day, two ruled columns. */
function Listings({ section }) {
    const url = useRoute();
    const days = useMemo(() => {
        const map = new Map();
        for (const e of section.events) {
            const w = eventWhen(e);
            const key = w ? `${w.date}` : '';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(e);
        }
        return [...map.entries()];
    }, [section.events]);

    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <SectionHead id={`s-${section.key}`} title={t(section.title)} subtitle={section.subtitle} href={seeAll(section, url)} />
            <div className="gap-x-10 md:columns-2 al-columns">
                {days.map(([day, events]) => (
                    <div key={day} className="mb-2 break-inside-avoid">
                        {events.map((event, i) => <ProgrammeRow key={event.id} event={event} showDate={i === 0} />)}
                    </div>
                ))}
            </div>
        </section>
    );
}

function Ranked({ section }) {
    const url = useRoute();
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <SectionHead id={`s-${section.key}`} title={t(section.title)} subtitle={t('The ten most talked-about')} href={seeAll(section, url)} />
            <ol className="gap-x-10 md:columns-2 al-columns">
                {section.events.slice(0, 10).map((event, i) => (
                    <li key={event.id} className="break-inside-avoid border-b border-line"><EventRow event={event} rank={i + 1} /></li>
                ))}
            </ol>
        </section>
    );
}

/** `weekend`: Friday, Saturday, Sunday as a three-column spread. */
function Weekend({ section }) {
    const url = useRoute();
    const days = useMemo(() => weekendDays(section.events), [section.events]);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16 rounded-card bg-tint px-5 py-8 text-on-tint sm:px-8">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-on-tint/20 pb-3">
                <h2 id={`s-${section.key}`} className="font-display text-[38px] leading-none text-on-tint">{t(section.title)}</h2>
                <Link href={url('/discover?date=weekend')} className="font-display text-[17px] italic underline underline-offset-4">{t('The whole weekend')}</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3 md:divide-x md:divide-on-tint/20 rtl:md:divide-x-reverse">
                {days.map((d) => (
                    <div key={d.key} className="md:px-5 md:first:ps-0 md:last:pe-0">
                        <p className="font-display text-[26px] italic">{d.label}</p>
                        {d.events.length ? (
                            <ul className="mt-2 divide-y divide-on-tint/15">
                                {d.events.slice(0, 4).map((e) => {
                                    const w = eventWhen(e);
                                    return (
                                        <li key={e.id} className="py-2.5">
                                            <Link href={url(eventPath(e.slug))} className="block hover:underline">
                                                <span className="font-mono text-xs">{w?.time} {w?.zone}</span>
                                                <span className="block font-display text-[19px] leading-tight">{e.title}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="mt-2 text-sm opacity-80">{t('Nothing listed yet.')}</p>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function Plates({ section }) {
    const url = useRoute();
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <SectionHead id={`s-${section.key}`} title={t(section.title)} subtitle={section.subtitle} href={seeAll(section, url)} rail />
            <Rail label={t(section.title)} itemClass="w-[62%] xs:w-[46%] sm:w-[32%] lg:w-[23%]">
                {section.events.map((event) => <PosterCard key={event.id} event={event} />)}
            </Rail>
        </section>
    );
}

function Cards({ section }) {
    const url = useRoute();
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <SectionHead id={`s-${section.key}`} title={t(section.title)} subtitle={section.subtitle} href={seeAll(section, url)} rail />
            <Rail label={t(section.title)}>
                {section.events.map((event) => <WithWhy key={event.id} section={section} event={event}><EventCard event={event} /></WithWhy>)}
            </Rail>
        </section>
    );
}

/** `categories`: an index, set with dotted leaders. */
function Index({ section }) {
    const url = useRoute();
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <SectionHead id={`s-${section.key}`} title={t(section.title)} subtitle={t('An index of what is on')} />
            <ul className="gap-x-10 sm:columns-2 lg:columns-3 al-columns">
                {section.categories.map((c) => (
                    <li key={c.slug} className="break-inside-avoid">
                        <Link href={url(categoryPath(c.slug))} className="group flex items-baseline gap-2 py-2">
                            <span className="font-display text-[22px] text-ink group-hover:italic group-hover:text-link">{c.name}</span>
                            <span className="mb-1 flex-1 border-b border-dotted border-edge" aria-hidden="true" />
                            <span className="font-mono text-sm text-muted">{c.event_count ?? ''}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function Presenter({ organizer, fresh }) {
    const url = useRoute();
    const follow = useFollowOrganizer({ ...organizer, viewer: organizer.viewer ?? {} });
    return (
        <li className="flex items-center gap-4 border-b border-line py-4">
            <Avatar image={organizer.avatar} name={organizer.name} size={56} />
            <div className="min-w-0 flex-1">
                <Link href={url(organizerPath(organizer.slug))} className="font-display text-[22px] leading-tight text-ink hover:underline">{organizer.name}</Link>
                <p className="text-sm text-muted">{t(':count followers', { count: organizer.follower_count ?? 0 })}{fresh ? ` · ${t('a new event this week')}` : ''}</p>
            </div>
            <Button variant={follow.following ? 'quiet' : 'secondary'} size="sm" onClick={follow.toggle} loading={follow.busy} aria-pressed={follow.following}>
                {follow.following ? t('Following') : t('Follow')}
            </Button>
        </li>
    );
}

function Presenters({ section }) {
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <SectionHead id={`s-${section.key}`} title={t(section.title)} subtitle={t('The people behind the programme')} />
            <ul className="gap-x-10 md:columns-2 al-columns">
                {section.organizers.map((o) => <Presenter key={o.slug} organizer={o} fresh={section.new_event_organizers?.includes(o.slug)} />)}
            </ul>
        </section>
    );
}

/** `collection`: a boxed feature, like a pull-out in the programme. */
function Feature({ section }) {
    const covers = section.events.slice(0, 3);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16 rounded-card border border-edge bg-surface p-6 shadow-key sm:p-8">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{t('A selection')} · {t(':count events', { count: section.count ?? section.events.length })}</p>
                    <h2 id={`s-${section.key}`} className="mt-2 font-display text-[44px] leading-[1.02] text-ink">{t(section.title)}</h2>
                    {section.subtitle && <p className="mt-2 font-display text-[20px] italic text-muted">{section.subtitle}</p>}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                        {covers.map((e) => <Img key={e.id} image={e.cover} alt="" sizes="160px" className="aspect-[3/4] w-full rounded-sm" ratio={1.33} />)}
                    </div>
                </div>
                <ol>{section.events.slice(0, 5).map((e) => <li key={e.id}><ProgrammeRow event={e} /></li>)}</ol>
            </div>
        </section>
    );
}

function MapPlate({ section, city }) {
    const url = useRoute();
    const pins = pinsFromEvents(section.events);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <figure>
                <MapView pins={pins} center={city ? [city.lat, city.lng] : undefined} zoom={12} interactive={false} className="h-[300px] md:h-[380px]" label={t('Map of events')} />
                <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
                    <h2 id={`s-${section.key}`} className="font-display text-[26px] italic text-ink">
                        {section.radius_km
                            ? t(':count events within :km km', { count: section.count ?? pins.length, km: section.radius_km })
                            : t(':count events around :city', { count: section.count ?? pins.length, city: city?.name ?? '' })}
                    </h2>
                    <Link href={url('/discover?view=map')} className="font-display text-[18px] italic text-link underline underline-offset-4">{t('Open the map')}</Link>
                </figcaption>
            </figure>
        </section>
    );
}

function Friends({ section }) {
    const everyone = [];
    for (const e of section.events) for (const f of e.friends_going ?? []) if (!everyone.find((x) => x.id === f.id)) everyone.push(f);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <SectionHead id={`s-${section.key}`} title={t(section.title)} rail />
            <FacePile friends={everyone} size={34} className="mb-5" />
            <Rail label={t(section.title)}>
                {section.events.map((event) => <EventCard key={event.id} event={event} />)}
            </Rail>
        </section>
    );
}

const RENDERERS = { hero: Lead, grid3: Listings, grid: Listings, list: Listings, ranked: Ranked, weekend: Weekend, poster: Plates, rail: Cards, categories: Index, organizers: Presenters, collection: Feature, map: MapPlate, friends: Friends };

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
                <Cover city={city} cities={cities} nextTicket={nextTicket} />
                {list.length === 0 ? (
                    <EmptyState icon={MapPin} title={t('Nothing listed here yet')} body={t('Try another city, or read the full listings.')} action={<Button variant="cta" href={url('/discover')}>{t('Full listings')}</Button>} />
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
