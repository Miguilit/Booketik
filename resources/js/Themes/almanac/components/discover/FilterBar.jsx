import { useState } from 'react';
import { Popover, PopoverButton, PopoverPanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { CalendarRange, ChevronDown, Shapes, Users, X } from 'lucide-react';
import { DATE_CHIPS, FORMAT_CHIPS, PRICE_CHIPS } from '@/Core/discover';
import { t } from '@/Core/i18n';
import { Button, Chip, cn, Field, Input } from '../ui';

/** The custom date range: two date inputs in a popover → `setRange(from, to)`. */
function RangeChip({ filters, setRange }) {
    const active = filters.date === 'range';
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    return (
        <Popover className="relative shrink-0">
            <PopoverButton
                className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-chip border-key px-4 text-sm font-semibold transition-colors',
                    active ? 'border-edge bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-edge',
                )}
                aria-pressed={active}
            >
                <CalendarRange className="h-4 w-4" aria-hidden="true" />
                {active ? `${filters.from} → ${filters.to}` : t('Pick dates')}
            </PopoverButton>
            <PopoverPanel anchor="bottom start" className="z-50 mt-2 w-[min(320px,calc(100vw-32px))] rounded-card border border-line bg-surface p-4 shadow-key focus:outline-none">
                {({ close }) => (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (from && to) {
                                setRange(from <= to ? from : to, from <= to ? to : from);
                                close();
                            }
                        }}
                        className="space-y-3"
                    >
                        <Field label={t('From')} htmlFor="range-from">
                            <Input id="range-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
                        </Field>
                        <Field label={t('To')} htmlFor="range-to">
                            <Input id="range-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} required />
                        </Field>
                        <div className="flex gap-2">
                            <Button type="submit" variant="primary" size="sm">{t('Apply')}</Button>
                            {active && (
                                <Button variant="ghost" size="sm" onClick={() => { setRange(null, null); close(); }}>{t('Clear dates')}</Button>
                            )}
                        </div>
                    </form>
                )}
            </PopoverPanel>
        </Popover>
    );
}

function CategoryMenu({ categories, value, onChange }) {
    const current = categories.find((c) => c.slug === value);
    return (
        <Menu as="div" className="relative shrink-0">
            <MenuButton
                className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-chip border-key px-4 text-sm font-semibold transition-colors',
                    current ? 'border-edge bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-edge',
                )}
            >
                <Shapes className="h-4 w-4" aria-hidden="true" />
                {current?.name ?? t('Category')}
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </MenuButton>
            <MenuItems anchor="bottom start" className="z-50 mt-2 max-h-80 w-56 overflow-y-auto rounded-card border border-line bg-surface p-1.5 shadow-key focus:outline-none">
                <MenuItem>
                    <button type="button" onClick={() => onChange(null)} className="block w-full rounded-sm px-3 py-2 text-start text-[15px] text-muted data-[focus]:bg-raised">
                        {t('Any category')}
                    </button>
                </MenuItem>
                {categories.map((c) => (
                    <MenuItem key={c.slug}>
                        <button type="button" onClick={() => onChange(c.slug)} className={cn('block w-full rounded-sm px-3 py-2 text-start text-[15px] data-[focus]:bg-raised', c.slug === value ? 'font-bold text-ink' : 'text-body')}>
                            {c.name}
                        </button>
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
}

/**
 * The chip bar: date presets, a custom range, category (unless the page is a
 * category), price, format, friends going (signed in only), clear.
 * Scrolls sideways on phones; the page itself never does.
 */
export default function FilterBar({ discover, categories = [], category, signedIn }) {
    const { filters, toggle, set, setRange, clear, active } = discover;

    return (
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0" role="group" aria-label={t('Filters')}>
            {DATE_CHIPS().map((chip) => (
                <Chip key={chip.value} active={filters.date === chip.value} onClick={() => toggle('date', chip.value)}>{chip.label}</Chip>
            ))}
            <RangeChip filters={filters} setRange={setRange} />
            <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden="true" />
            {!category && categories.length > 0 && (
                <CategoryMenu categories={categories} value={filters.category} onChange={(slug) => set('category', slug)} />
            )}
            {PRICE_CHIPS().map((chip) => (
                <Chip key={chip.value} active={filters.price === chip.value} onClick={() => toggle('price', chip.value)}>{chip.label}</Chip>
            ))}
            {FORMAT_CHIPS().map((chip) => (
                <Chip key={chip.value} active={filters.format === chip.value} onClick={() => toggle('format', chip.value)}>{chip.label}</Chip>
            ))}
            {signedIn && (
                <Chip icon={Users} active={String(filters.friends_going) === '1'} onClick={() => toggle('friends_going', '1')}>{t('Friends going')}</Chip>
            )}
            {active > 0 && (
                <button type="button" onClick={clear} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-chip px-3 text-sm font-semibold text-link hover:underline">
                    <X className="h-4 w-4" aria-hidden="true" />
                    {t('Clear')}
                </button>
            )}
        </div>
    );
}
