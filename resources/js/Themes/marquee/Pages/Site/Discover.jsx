import { Head } from '@inertiajs/react';
import { CalendarDays, ChevronsUpDown, Compass, LayoutGrid, Map as MapIcon, MapPin } from 'lucide-react';
import { useDiscover } from '@/Core/discover';
import { useRoute, useViewer } from '@/Core/site';
import { t } from '@/Core/i18n';
import CityPicker from '@/Themes/marquee/components/CityPicker';
import { layout } from '@/Themes/marquee/Layout';
import { Button, cn, Container, EmptyState, Skeleton } from '@/Themes/marquee/components/ui';
import { EventGrid } from '@/Themes/marquee/components/events';
import FilterBar from '@/Themes/marquee/components/discover/FilterBar';
import MapSplit from '@/Themes/marquee/components/discover/MapSplit';
import CalendarView from '@/Themes/marquee/components/discover/CalendarView';

/*
 | Discover and category pages: filter chips over list / map / calendar. The
 | first page of results comes with the page; chips are an Inertia partial
 | reload, "Load more" and the map/calendar talk to /api/v1 (Core/discover).
 */

const VIEWS = () => [
    { value: 'list', label: t('List'), icon: LayoutGrid },
    { value: 'map', label: t('Map'), icon: MapIcon },
    { value: 'calendar', label: t('Calendar'), icon: CalendarDays },
];

function CityMenu({ cities, value, onChange }) {
    const current = cities.find((c) => c.slug === value);
    return (
        <CityPicker
            cities={cities}
            value={current ? value : ''}
            onChange={(slug) => onChange(slug || 'all')}
            allowNone
            noneLabel={t('Everywhere')}
            buttonClassName="h-10 border border-line px-4 font-mono text-[13px] uppercase tracking-[0.08em] text-ink hover:border-edge"
        >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {current?.name ?? t('Everywhere')}
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
        </CityPicker>
    );
}

function ViewSwitch({ view, setView }) {
    return (
        <div role="tablist" aria-label={t('View')} className="inline-flex rounded-chip border-key border-edge bg-surface p-1">
            {VIEWS().map((v) => (
                <button
                    key={v.value}
                    type="button"
                    role="tab"
                    id={`view-${v.value}`}
                    aria-selected={view === v.value}
                    aria-controls="discover-results"
                    onClick={() => setView(v.value)}
                    className={cn(
                        'inline-flex h-9 items-center gap-1.5 rounded-chip px-3 text-sm font-semibold transition-colors',
                        view === v.value ? 'bg-ink text-bg' : 'text-ink hover:bg-raised',
                    )}
                >
                    <v.icon className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden xs:inline">{v.label}</span>
                </button>
            ))}
        </div>
    );
}

export default function Discover({ filters, view, category, events, nextCursor, categories = [], cities = [] }) {
    const url = useRoute();
    const viewer = useViewer();
    const discover = useDiscover({ filters, view, events, nextCursor, category });
    const cityMatch = cities.find((c) => c.slug === discover.filters.city);
    const title = category?.name ?? t('Discover');

    return (
        <>
            <Head title={category ? category.name : t('Discover events')} />
            <Container className="pb-8 pt-8 sm:pt-10">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">
                            {category ? t('Category') : t('What is on')}
                            {cityMatch ? ` · ${cityMatch.name}` : ''}
                        </p>
                        <h1 className="mt-1 font-display text-[57px] tracking-[-0.04em] text-ink sm:text-[83px]">{title}</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {cities.length > 0 && <CityMenu cities={cities} value={discover.filters.city} onChange={(slug) => discover.set('city', slug)} />}
                        <ViewSwitch view={discover.view} setView={discover.setView} />
                    </div>
                </header>

                <div className="mt-6 border-y border-line py-3">
                    <FilterBar discover={discover} categories={categories} category={category} signedIn={Boolean(viewer)} />
                </div>

                <div id="discover-results" role="tabpanel" aria-labelledby={`view-${discover.view}`} className="mt-6" aria-busy={discover.loading}>
                    {discover.view === 'calendar' ? (
                        <CalendarView filters={discover.filters} category={category} />
                    ) : discover.view === 'map' ? (
                        <MapSplit events={discover.events} filters={{ ...discover.filters, ...(category ? { category: category.slug } : {}) }} center={cityMatch ? [cityMatch.lat, cityMatch.lng] : undefined} />
                    ) : discover.events.length === 0 ? (
                        discover.loading ? (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[3/2] w-full rounded-card" />)}</div>
                        ) : (
                            <EmptyState
                                icon={Compass}
                                title={t('Nothing matches yet')}
                                body={t('Try another date, or widen the filters.')}
                                action={discover.active > 0 ? <Button variant="secondary" onClick={discover.clear}>{t('Clear filters')}</Button> : <Button variant="secondary" href={url('/discover?city=all')}>{t('Look everywhere')}</Button>}
                            />
                        )
                    ) : (
                        <>
                            <p className="mb-5 text-sm text-muted" aria-live="polite">
                                {discover.hasMore ? t('Showing the first :count events', { count: discover.events.length }) : t(':count events', { count: discover.events.length })}
                            </p>
                            <EventGrid events={discover.events} priorityFirst={3} className={cn(discover.loading && 'opacity-60 transition-opacity')} />
                            {discover.hasMore && (
                                <div className="mt-10 flex justify-center">
                                    <Button variant="secondary" size="lg" onClick={discover.loadMore} loading={discover.loading}>{t('Load more')}</Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Container>
        </>
    );
}

Discover.layout = layout;
