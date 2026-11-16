import { useMemo, useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Building2, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { cityBadgeStyle, groupByRegion, regionOf } from '@/Core/lib/cities';
import { useLocale } from '@/Core/lib/useSite';
import { t } from '@/Core/i18n';

/**
 * City picker: region tabs over a three-column grid of cities, each with a
 * round colour badge, the current one highlighted. Opens from any trigger
 * (`children` is the button's content) so it works inline in a headline
 * and as a form field.
 */
export default function CityPicker({ cities, value, onChange, children, buttonClassName, allowNone = false, noneLabel, anchor = 'bottom start' }) {
    const locale = useLocale();
    const regions = useMemo(() => groupByRegion(cities, locale), [cities, locale]);
    const current = cities?.find((c) => c.slug === value);
    const [tab, setTab] = useState(() => (current ? regionOf(current) : regions[0]?.key));
    const active = regions.find((r) => r.key === tab) ?? regions[0];

    if (!regions.length) return null;

    return (
        <Popover className="relative">
            <PopoverButton className={cn('inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus', buttonClassName)}>
                {children ?? (
                    <>
                        <span>{current?.name ?? noneLabel ?? t('Choose a city')}</span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                    </>
                )}
            </PopoverButton>
            <PopoverPanel
                anchor={{ to: anchor, gap: 8, padding: 12 }}
                className="z-50 w-[min(92vw,720px)] rounded-card border border-line bg-surface p-3 shadow-key focus:outline-none"
            >
                {({ close }) => (
                    <>
                        {regions.length > 1 && (
                            <div role="tablist" aria-label={t('Regions')} className="flex flex-wrap gap-1 border-b border-line pb-3">
                                {regions.map((r) => (
                                    <button
                                        key={r.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={r.key === active.key}
                                        onClick={() => setTab(r.key)}
                                        className={cn(
                                            'rounded-chip px-3 py-1.5 font-display text-[17px] italic transition-colors',
                                            r.key === active.key ? 'bg-raised text-ink' : 'text-muted hover:text-ink',
                                        )}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <ul role="listbox" aria-label={active.label} className="mt-2 grid max-h-[60vh] grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
                            {allowNone && (
                                <li>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={!value}
                                        onClick={() => { onChange(''); close(); }}
                                        className={cn('flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-start font-display text-[18px]', !value ? 'bg-raised text-ink' : 'text-body hover:bg-raised')}
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-key border-edge text-muted">–</span>
                                        {noneLabel ?? t('None')}
                                    </button>
                                </li>
                            )}
                            {active.cities.map((c) => {
                                const selected = c.slug === value;
                                return (
                                    <li key={c.slug}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            onClick={() => { onChange(c.slug); close(); }}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-start font-display text-[18px] transition-colors',
                                                selected ? 'bg-raised italic text-link' : 'text-ink hover:bg-raised',
                                            )}
                                        >
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={cityBadgeStyle(c.slug)} aria-hidden="true">
                                                <Building2 className="h-3.5 w-3.5" />
                                            </span>
                                            <span className="truncate">{c.name}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </PopoverPanel>
        </Popover>
    );
}
