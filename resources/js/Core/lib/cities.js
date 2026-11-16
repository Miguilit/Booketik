import { t } from '@/Core/i18n';

/*
 | City picker logic shared by every theme: which region tab a city sits
 | under, the order of the tabs, and a stable colour per city for its badge.
 |
 | Regions are derived from data every city already carries (IANA time zone
 | and country), so the API shape stays as the mobile contract pins it.
 */

const SOUTH_AMERICA = new Set(['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE']);

export const REGIONS = [
    { key: 'europe', label: () => t('Europe') },
    { key: 'asia_pacific', label: () => t('Asia & Pacific') },
    { key: 'middle_east', label: () => t('Middle East') },
    { key: 'africa', label: () => t('Africa') },
    { key: 'north_america', label: () => t('North America') },
    { key: 'south_america', label: () => t('South America') },
];

const MIDDLE_EAST = new Set(['AE', 'BH', 'IL', 'JO', 'KW', 'LB', 'OM', 'QA', 'SA']);

export function regionOf(city) {
    const zone = city?.timezone ?? '';
    const country = (city?.country_code ?? '').toUpperCase();
    if (MIDDLE_EAST.has(country)) return 'middle_east';
    if (zone.startsWith('Europe/')) return 'europe';
    if (zone.startsWith('Africa/')) return 'africa';
    if (zone.startsWith('America/')) return SOUTH_AMERICA.has(country) ? 'south_america' : 'north_america';
    if (zone.startsWith('Asia/') || zone.startsWith('Australia/') || zone.startsWith('Pacific/')) return 'asia_pacific';
    return 'europe';
}

/** Non-empty regions in tab order, each with its cities A–Z. */
export function groupByRegion(cities, locale) {
    const byRegion = new Map();
    for (const city of cities ?? []) {
        const key = regionOf(city);
        if (!byRegion.has(key)) byRegion.set(key, []);
        byRegion.get(key).push(city);
    }
    const collator = new Intl.Collator(locale || undefined);
    return REGIONS.filter((r) => byRegion.has(r.key)).map((r) => ({
        key: r.key,
        label: r.label(),
        cities: byRegion.get(r.key).sort((a, b) => collator.compare(a.name, b.name)),
    }));
}

/**
 | A stable hue per city for its round badge. The badge carries a white
 | glyph, so saturation and lightness are fixed where white stays readable
 | (contrast ≥ 3:1 for the icon) and only the hue moves.
 */
export function cityHue(slug) {
    let h = 0;
    for (const ch of slug ?? '') h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
}

export function cityBadgeStyle(slug) {
    return { backgroundColor: `hsl(${cityHue(slug)} 62% 42%)` };
}
