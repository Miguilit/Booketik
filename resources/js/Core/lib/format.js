import clsx from 'clsx';
import { createElement, Fragment } from 'react';
import { t } from '@/Core/i18n';

/**
 * Helpers shared by every site screen.
 *
 * The rounding rules in `formatCount` and the flag table match the mobile
 * app's — a view count that reads "4.8M" on the web and "5M" in the app is the
 * kind of difference nobody reports and everybody notices.
 */

/** Class-name join. clsx alone, without tailwind-merge, is enough here because
 *  no component passes conflicting utilities in. */
export function cn(...inputs) {
    return clsx(inputs);
}

/**
 * Put React nodes (a link, a <strong>) into translated text at its
 * :placeholders, so a translator can still move them:
 * `withNodes(t('I agree to the :terms.'), { terms: <a …>{t('Terms')}</a> })`.
 */
export function withNodes(text, nodes) {
    const names = Object.keys(nodes ?? {}).sort((a, b) => b.length - a.length);
    if (names.length === 0) return text;
    const pattern = new RegExp(`(${names.map((name) => `:${name}`).join('|')})`);
    return String(text)
        .split(pattern)
        .map((part, index) =>
            createElement(Fragment, { key: index }, part.startsWith(':') && part.slice(1) in nodes ? nodes[part.slice(1)] : part),
        );
}

/**
 * The same horizontal inset the nav uses — nav and page share one left edge.
 *
 * 1180px, not the full viewport. Event cards carry a cover with the title and
 * date under it, so a rail stretched across a 27-inch monitor puts twelve tiny
 * cards in a row nobody scans. The measure is the
 * point.
 */
export const PAGE_GUTTER = 'mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8';

/** Compact counts: 4_821_000 → "4.8M". Mirrors the app's `formatCount`. */
export function formatCount(value) {
    const n = Number(value);

    if (!Number.isFinite(n) || n <= 0) {
        return '0';
    }

    if (n >= 1_000_000) {
        const m = n / 1_000_000;
        return `${m >= 10 || m % 1 === 0 ? Math.round(m) : m.toFixed(1)}M`;
    }

    if (n >= 1_000) {
        const k = n / 1_000;
        return `${k >= 10 || k % 1 === 0 ? Math.round(k) : k.toFixed(1)}K`;
    }

    return `${n}`;
}

/** Kept as an alias: earlier screens imported this name. */
export const compactCount = formatCount;

/**
 * Money: minor units written in the page's language (Intl.NumberFormat) with
 * the currency's exponent as decimals — the twin of `Money::format`. Lives in
 * its own import-free module so a node script can prove both agree.
 */
export { money, formatPrice, setCurrencyRules, currencyExponent, moneyLocale, setMoneyLocale, ICU_LOCALES } from './money';

/** Initials for an avatar fallback: "Ivy Sinclair" → "IS". */
export function getInitials(name) {
    return String(name ?? '')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function duration(seconds) {
    const total = Number(seconds) || 0;
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const LANGUAGE_FLAGS = {
    en: { flag: '🇬🇧', label: 'English' },
    us: { flag: '🇺🇸', label: 'English' },
    tr: { flag: '🇹🇷', label: 'Türkçe' },
    es: { flag: '🇪🇸', label: 'Español' },
    pt: { flag: '🇧🇷', label: 'Português' },
    de: { flag: '🇩🇪', label: 'Deutsch' },
    fr: { flag: '🇫🇷', label: 'Français' },
    it: { flag: '🇮🇹', label: 'Italiano' },
    ja: { flag: '🇯🇵', label: '日本語' },
    ko: { flag: '🇰🇷', label: '한국어' },
    zh: { flag: '🇨🇳', label: '中文' },
    ru: { flag: '🇷🇺', label: 'Русский' },
    ar: { flag: '🇸🇦', label: 'العربية' },
    hi: { flag: '🇮🇳', label: 'हिन्दी' },
    id: { flag: '🇮🇩', label: 'Indonesia' },
    th: { flag: '🇹🇭', label: 'ไทย' },
    vi: { flag: '🇻🇳', label: 'Tiếng Việt' },
    tl: { flag: '🇵🇭', label: 'Filipino' },
    fil: { flag: '🇵🇭', label: 'Filipino' },
    ms: { flag: '🇲🇾', label: 'Melayu' },
};

export function getLanguageFlag(code) {
    if (!code) {
        return '🌐';
    }

    return LANGUAGE_FLAGS[code.trim().toLowerCase().split(/[-_]/)[0]]?.flag ?? '🌐';
}

export function getLanguageLabel(code) {
    if (!code) {
        return code;
    }

    const key = code.trim().toLowerCase().split(/[-_]/)[0];
    return LANGUAGE_FLAGS[key]?.label ?? code.toUpperCase();
}
