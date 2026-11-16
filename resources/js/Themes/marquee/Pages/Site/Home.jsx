import { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, ChevronsUpDown, MapPin } from 'lucide-react';
import { categoryPath, eventPath, eventWhen, organizerPath, displayPrice, priceLabel, useCityPicker, useFollowOrganizer, venueLine, weekendDays } from '@/Core/events';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import CityPicker from '@/Themes/marquee/components/CityPicker';
import { layout } from '@/Themes/marquee/Layout';
import { Avatar, Band, Button, cn, Container, EmptyState, FacePile, Img, Rail, SectionHead, Ticker } from '@/Themes/marquee/components/ui';
import { Availability, EventCard, EventRow, PosterCard } from '@/Themes/marquee/components/events';
import MapView, { pinsFromEvents } from '@/Themes/marquee/components/MapView';

/*
 | Marquee's home: the city as a poster. The name fills a black band, a lime
 | ticker runs when something is selling fast, and every section is billed
 | like a lineup — dates in mono, names in Anton, 1px rules between acts.
 */

function CityBand({ city, cities, nextTicket }) {
    const { choose } = useCityPicker(cities, city);
    const url = useRoute();
    const when = nextTicket ? eventWhen(nextTicket.event) : null;

    return (
        <Band>
            <Container className="pb-8 pt-10 sm:pb-12 sm:pt-14">
                <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[12px] uppercase tracking-[0.18em] text-muted">
                    <span>{t('This week in')}</span>
                    {cities?.length > 1 && (
                        <CityPicker cities={cities} value={city?.slug} onChange={choose} anchor="bottom end" buttonClassName="h-9 border border-line px-3 text-ink hover:border-edge">
                            <MapPin className="h-4 w-4" aria-hidden="true" />
                            {t('Change city')}
                            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                        </CityPicker>
                    )}
                </div>
                <h1 className="mt-3 break-words font-display text-[clamp(84px,19vw,240px)] text-ink">{city?.name ?? t('Your city')}</h1>
                {nextTicket && when && (
                    <Link href={url(`/t/${nextTicket.code}`)} className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line pt-4 hover:underline">
                        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">{t('Your next ticket')}</span>
                        <span className="font-display text-[28px] text-ink">{nextTicket.event.title}</span>
                        <span className="font-mono text-[13px] text-ink">{when.date} · {when.time} {when.zone}{when.relative ? ` · ${when.relative}` : ''}</span>
                        <ArrowRight className="h-5 w-5 self-center text-ink rtl:rotate-180" aria-hidden="true" />
                    </Link>
                )}
            </Container>
        </Band>
    );
}

/** One line of the bill: date | act | where | price. */
function BillRow({ event, index }) {
    const url = useRoute();
    const when = eventWhen(event);
    return (
        <li className="group relative grid grid-cols-[64px_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-line py-4 sm:grid-cols-[110px_1fr_220px_110px]">
            <span className="font-mono text-[12px] uppercase leading-tight tracking-[0.06em] text-ink">
                <span className="block font-display text-[30px] leading-none">{when?.dateline.day}</span>
                {when?.dateline.month} · {when?.weekday}
            </span>
            <span className="min-w-0">
                {index != null && <span className="me-2 font-mono text-[12px] text-muted">{String(index).padStart(2, '0')}</span>}
                <Link href={url(eventPath(event.slug))} className="font-display text-[24px] text-ink after:absolute after:inset-0 after:content-[''] group-hover:underline sm:text-[34px]">{event.title}</Link>
                <span className="mt-1 block font-mono text-[12px] text-muted sm:hidden">{when?.time} {when?.zone} · {venueLine(event)}</span>
            </span>
            <span className="hidden min-w-0 font-mono text-[12px] uppercase tracking-[0.04em] text-muted sm:block">
                <span className="block text-ink">{when?.time} {when?.zone}</span>
                <span className="block truncate">{venueLine(event)}</span>
            </span>
            <span className="flex flex-col items-end gap-1 text-end">
                <span className="font-mono text-[13px] font-medium text-ink">{displayPrice(event)}</span>
                <Availability event={event} />
            </span>
        </li>
    );
}

function Bill({ events, numbered = false, className }) {
    return (
        <ol className={cn('border-t border-edge', className)}>
            {events.map((event, i) => <BillRow key={event.id} event={event} index={numbered ? i + 1 : null} />)}
        </ol>
    );
}

function seeAll(section, url) {
    if (section.category) return url(categoryPath(section.category.slug));
    if (section.key === 'this_weekend') return url('/discover?date=weekend');
    if (['near_you', 'trending', 'featured'].includes(section.key)) return url('/discover');
    return null;
}

/** `hero`: the headliner full-bleed, the support acts billed below. */
function Headliner({ section }) {
    const url = useRoute();
    const [lead, ...rest] = section.events;
    if (!lead) return null;
    const when = eventWhen(lead);
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <h2 id={`s-${section.key}`} className="sr-only">{t(section.title)}</h2>
            <article className="group relative overflow-hidden bg-black">
                <Img image={lead.cover} alt="" priority sizes="100vw" className="aspect-[4/5] w-full opacity-80 grayscale sm:aspect-[21/9]" ratio={9 / 21} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" aria-hidden="true" />
                <Container className="absolute inset-x-0 bottom-0 pb-6 sm:pb-10">
                    <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#F3F0E8]">{t(section.title)}{when?.relative ? ` · ${when.relative}` : ''}</p>
                    <h3 className="mt-2 font-display text-[clamp(52px,9vw,128px)] text-[#F3F0E8]">
                        <Link href={url(eventPath(lead.slug))} className="after:absolute after:inset-0 after:content-['']">{lead.title}</Link>
                    </h3>
                    <p className="mt-3 font-mono text-[14px] uppercase tracking-[0.06em] text-[#F3F0E8]">{when?.date} · {when?.time} {when?.zone} · {venueLine(lead)}</p>
                </Container>
            </article>
            {rest.length > 0 && (
                <Container className="mt-8">
                    <Bill events={rest} />
                </Container>
            )}
        </section>
    );
}

function Section({ section, href, children, rail }) {
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Container>
                <SectionHead id={`s-${section.key}`} title={t(section.title)} subtitle={section.subtitle} href={href} rail={rail} />
                {children}
            </Container>
        </section>
    );
}

function Weekend({ section }) {
    const url = useRoute();
    const days = useMemo(() => weekendDays(section.events), [section.events]);
    return (
        <Section section={section} href={url('/discover?date=weekend')}>
            <div className="grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line md:rtl:divide-x-reverse">
                {days.map((d) => (
                    <div key={d.key} className="md:px-5 md:first:ps-0 md:last:pe-0">
                        <p className="border-b border-edge pb-2 font-display text-[44px] text-ink">{d.label}</p>
                        {d.events.length ? (
                            <ul>
                                {d.events.slice(0, 5).map((e) => {
                                    const w = eventWhen(e);
                                    return (
                                        <li key={e.id} className="relative border-b border-line py-3">
                                            <span className="font-mono text-[12px] text-muted">{w?.time} {w?.zone}</span>
                                            <Link href={url(eventPath(e.slug))} className="block font-display text-[24px] text-ink after:absolute after:inset-0 after:content-[''] hover:underline">{e.title}</Link>
                                            <span className="font-mono text-[12px] text-muted">{venueLine(e)} · {displayPrice(e)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="py-3 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">{t('Nothing billed yet')}</p>
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
}

function Categories({ section }) {
    const url = useRoute();
    return (
        <Section section={section}>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 border-t border-edge pt-4">
                {section.categories.map((c) => (
                    <li key={c.slug}>
                        <Link href={url(categoryPath(c.slug))} className="font-display text-[clamp(40px,6vw,76px)] text-ink hover:underline hover:decoration-4">
                            {c.name}
                            {c.event_count ? <sup className="ms-1 align-super font-mono text-[14px] text-muted">{c.event_count}</sup> : null}
                        </Link>
                    </li>
                ))}
            </ul>
        </Section>
    );
}

function OrganizerTile({ organizer, fresh }) {
    const url = useRoute();
    const follow = useFollowOrganizer({ ...organizer, viewer: organizer.viewer ?? {} });
    return (
        <div className="flex h-full flex-col border border-line p-4">
            <Avatar image={organizer.avatar} name={organizer.name} size={96} className="h-auto w-full grayscale" />
            <Link href={url(organizerPath(organizer.slug))} className="mt-3 line-clamp-2 font-display text-[26px] text-ink hover:underline">{organizer.name}</Link>
            <p className="font-mono text-[12px] uppercase text-muted">{t(':count followers', { count: organizer.follower_count ?? 0 })}{fresh ? ` · ${t('New event')}` : ''}</p>
            <Button variant={follow.following ? 'quiet' : 'secondary'} size="sm" className="mt-auto pt-0" onClick={follow.toggle} loading={follow.busy} aria-pressed={follow.following}>
                {follow.following ? t('Following') : t('Follow')}
            </Button>
        </div>
    );
}

function Collection({ section }) {
    const url = useRoute();
    return (
        <section aria-labelledby={`s-${section.key}`} className="mb-16">
            <Band className="py-12">
                <Container className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-end">
                    <div>
                        <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">{t('Collection')} · {t(':count events', { count: section.count ?? section.events.length })}</p>
                        <h2 id={`s-${section.key}`} className="mt-2 font-display text-[clamp(48px,7vw,96px)] text-ink">{t(section.title)}</h2>
                        {section.subtitle && <p className="mt-3 text-[17px] text-body">{section.subtitle}</p>}
                        <Button variant="secondary" className="mt-6" href={url('/discover')} trailing={ArrowUpRight}>{t('See all')}</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {section.events.slice(0, 3).map((e) => (
                            <Link key={e.id} href={url(eventPath(e.slug))} className="group block">
                                <Img image={e.cover} alt={e.title} sizes="200px" className="aspect-[2/3] w-full grayscale group-hover:grayscale-0" ratio={1.5} />
                                <span className="mt-1 block truncate font-mono text-[11px] uppercase text-muted">{e.title}</span>
                            </Link>
                        ))}
                    </div>
                </Container>
            </Band>
        </section>
    );
}

function MapSection({ section, city }) {
    const url = useRoute();
    const pins = pinsFromEvents(section.events);
    return (
        <Section section={{ ...section, title: section.radius_km ? t(':count events within :km km', { count: section.count ?? pins.length, km: section.radius_km }) : t(':count events around :city', { count: section.count ?? pins.length, city: city?.name ?? '' }) }} href={url('/discover?view=map')}>
            <MapView pins={pins} center={city ? [city.lat, city.lng] : undefined} zoom={12} interactive={false} className="h-[320px] sm:h-[420px]" label={t('Map of events')} />
        </Section>
    );
}

function Friends({ section }) {
    const everyone = [];
    for (const e of section.events) for (const f of e.friends_going ?? []) if (!everyone.find((x) => x.id === f.id)) everyone.push(f);
    return (
        <Section section={section}>
            <FacePile friends={everyone} size={36} className="mb-4" />
            <Bill events={section.events} />
        </Section>
    );
}

function render(section, city, url) {
    const href = seeAll(section, url);
    switch (section.layout) {
        case 'hero':
            return <Headliner section={section} />;
        case 'ranked':
            return <Section section={section} href={href}><Bill events={section.events.slice(0, 10)} numbered /></Section>;
        case 'grid3':
        case 'grid':
        case 'list':
            return <Section section={section} href={href}><Bill events={section.layout === 'list' ? section.events.slice(0, 5) : section.events.slice(0, 9)} /></Section>;
        case 'weekend':
            return <Weekend section={section} />;
        case 'poster':
            return (
                <Section section={section} href={href} rail>
                    <Rail label={t(section.title)} itemClass="w-[64%] xs:w-[48%] sm:w-[34%] lg:w-[23%]">
                        {section.events.map((e) => <PosterCard key={e.id} event={e} />)}
                    </Rail>
                </Section>
            );
        case 'categories':
            return <Categories section={section} />;
        case 'organizers':
            return (
                <Section section={section} rail>
                    <Rail label={t(section.title)} itemClass="w-[62%] xs:w-[44%] sm:w-[30%] lg:w-[19%]">
                        {section.organizers.map((o) => <OrganizerTile key={o.slug} organizer={o} fresh={section.new_event_organizers?.includes(o.slug)} />)}
                    </Rail>
                </Section>
            );
        case 'collection':
            return <Collection section={section} />;
        case 'map':
            return <MapSection section={section} city={city} />;
        case 'friends':
            return <Friends section={section} />;
        default:
            return (
                <Section section={section} href={href} rail>
                    <Rail label={t(section.title)}>{section.events.map((e) => <WithWhy key={e.id} section={section} event={e}><EventCard event={e} /></WithWhy>)}</Rail>
                </Section>
            );
    }
}

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

    // Selling fast: every few-left event on the page, once.
    const selling = useMemo(() => {
        const seen = new Map();
        for (const s of sections) for (const e of s.events) if (e.availability === 'few_left' && !seen.has(e.id)) seen.set(e.id, e);
        return [...seen.values()].slice(0, 8).map((e) => {
            const w = eventWhen(e);
            return `${t('Selling fast')}: ${e.title} — ${w?.date}`;
        });
    }, [sections]);

    return (
        <>
            <Head title={city ? t('Events in :city', { city: city.name }) : t('Events')} />
            <CityBand city={city} cities={cities} nextTicket={nextTicket} />
            {selling.length > 0 && <Ticker items={selling} />}
            <div className="pt-12">
                {list.length === 0 ? (
                    <Container>
                        <EmptyState icon={MapPin} title={t('Nothing listed here yet')} body={t('Try another city, or look at everything on Discover.')} action={<Button variant="cta" href={url('/discover')}>{t('Discover events')}</Button>} />
                    </Container>
                ) : (
                    list.map((section, i) => <div key={`${section.key}-${i}`}>{render(section, city, url)}</div>)
                )}
            </div>
        </>
    );
}

Home.layout = layout;
