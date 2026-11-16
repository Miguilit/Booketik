import { Head, Link } from '@inertiajs/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ArrowRight, ChevronDown, Search as SearchIcon, TextSearch, X } from 'lucide-react';
import { DATE_CHIPS, FORMAT_CHIPS, PRICE_CHIPS, useAiSearch } from '@/Core/discover';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/civic/Layout';
import { Button, Container, EmptyState, Notice, Skeleton } from '@/Themes/civic/components/ui';
import { EventGrid } from '@/Themes/civic/components/events';

/*
 | Search: one natural-language box (`/search/ai`); what it understood comes
 | back as chips the visitor can edit or drop, which re-query `/events`.
 */

const EXAMPLES = () => [t('Free jazz this weekend'), t('Tech meetups tonight'), t('Family events under €15 on Saturday')];

/** Alternatives offered when a chip is opened. */
function alternatives(key, categories) {
    if (key === 'date') return DATE_CHIPS();
    if (key === 'price') return PRICE_CHIPS();
    if (key === 'format') return FORMAT_CHIPS();
    if (key === 'category') return (categories ?? []).map((c) => ({ value: c.slug, label: c.name }));
    return null;
}

function QueryChip({ chip, categories, onEdit, onRemove }) {
    const options = alternatives(chip.key, categories);
    const base = 'inline-flex h-10 items-center gap-1.5 rounded-chip border-key border-edge bg-tint-2 ps-4 text-sm font-semibold text-on-tint-2';

    return (
        <li className={base}>
            {options ? (
                <Menu as="div" className="relative">
                    <MenuButton className="inline-flex items-center gap-1 rounded-chip" aria-label={t('Change :what', { what: chip.label })}>
                        {chip.label}
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </MenuButton>
                    <MenuItems anchor="bottom start" className="z-50 mt-2 max-h-72 w-52 overflow-y-auto rounded-card border-key border-edge bg-surface p-1.5 shadow-key focus:outline-none">
                        {options.map((o) => (
                            <MenuItem key={o.value}>
                                <button type="button" onClick={() => onEdit(chip.key, o.value)} className="block w-full rounded-sm px-3 py-2 text-start text-[15px] text-body data-[focus]:bg-raised">
                                    {o.label}
                                </button>
                            </MenuItem>
                        ))}
                    </MenuItems>
                </Menu>
            ) : (
                <span>{chip.label}</span>
            )}
            <button type="button" onClick={() => onRemove(chip.key)} className="me-1 flex h-8 w-8 items-center justify-center rounded-chip hover:bg-surface/60" aria-label={t('Remove :what', { what: chip.label })}>
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </li>
    );
}

export default function Search({ q, city, categories = [], aiEnabled }) {
    const search = useAiSearch({ q, city, categories });
    const busy = search.state === 'loading';

    const submit = (e) => {
        e.preventDefault();
        search.run(search.q);
    };

    return (
        <>
            <Head title={search.q ? t('Search: :q', { q: search.q }) : t('Search events')} />
            <Container className="pb-8 pt-8 sm:pt-12">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">{aiEnabled ? t('Ask in your own words') : t('Search')}</p>
                <h1 className="mt-1 font-display text-[40px] font-extrabold leading-[0.98] tracking-[-0.04em] text-ink sm:text-[60px]">{t('What are you up for?')}</h1>

                <form role="search" onSubmit={submit} className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <SearchIcon className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
                        <label htmlFor="ai-q" className="sr-only">{t('Search events')}</label>
                        <input
                            id="ai-q"
                            type="search"
                            value={search.q}
                            onChange={(e) => search.setQ(e.target.value)}
                            placeholder={t('Try “jazz this weekend under €20”')}
                            className="h-14 w-full rounded-btn border-key border-edge bg-surface ps-12 pe-4 text-[17px] text-ink shadow-key placeholder:text-muted focus:outline-none focus:ring-0"
                            maxLength={200}
                            autoFocus={!q}
                        />
                    </div>
                    <Button type="submit" variant="cta" size="lg" loading={busy} icon={aiEnabled ? TextSearch : undefined}>{t('Search')}</Button>
                </form>
                {aiEnabled && <p className="mt-2 max-w-3xl text-sm text-muted">{t('Your words are read by AI to set the filters. Results are real listings; check the event page before you buy.')}</p>}

                {search.state === 'idle' && (
                    <div className="mt-6">
                        <p className="mb-2 text-sm text-muted">{t('For example')}</p>
                        <ul className="flex flex-wrap gap-2">
                            {EXAMPLES().map((ex) => (
                                <li key={ex}>
                                    <button type="button" onClick={() => { search.setQ(ex); search.run(ex); }} className="inline-flex h-10 items-center rounded-chip border-key border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-edge">
                                        {ex}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {search.chips.length > 0 && (
                    <div className="mt-8">
                        <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-muted">{t('We understood')}</p>
                        <ul className="flex flex-wrap gap-2" aria-label={t('Search filters')}>
                            {search.chips.map((chip) => (
                                <QueryChip key={chip.key} chip={chip} categories={categories} onEdit={search.editChip} onRemove={search.removeChip} />
                            ))}
                        </ul>
                        {search.explanation && <p className="mt-3 max-w-2xl text-[15px] text-body">{search.explanation}</p>}
                    </div>
                )}

                {search.error && <Notice tone="warn" className="mt-6 max-w-3xl">{search.error}</Notice>}

                <div className="mt-8" aria-live="polite" aria-busy={busy}>
                    {busy ? (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div key={i}>
                                    <Skeleton className="aspect-[3/2] w-full rounded-card" />
                                    <Skeleton className="mt-3 h-5 w-3/4" />
                                    <Skeleton className="mt-2 h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : search.state === 'done' ? (
                        search.results.length ? (
                            <>
                                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-muted">{t(':count events', { count: search.results.length })}</p>
                                    <Link href={search.discoverHref} className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                                        {t('Open in Discover')}
                                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                                    </Link>
                                </div>
                                <EventGrid events={search.results} priorityFirst={3} />
                            </>
                        ) : (
                            <EmptyState icon={SearchIcon} title={t('No events found')} body={t('Drop a filter above, or try different words.')} action={<Button variant="secondary" href={search.discoverHref}>{t('Open in Discover')}</Button>} />
                        )
                    ) : search.state === 'error' ? (
                        <Notice tone="danger">{search.error ?? t('Search is unavailable right now.')}</Notice>
                    ) : null}
                </div>
            </Container>
        </>
    );
}

Search.layout = layout;
