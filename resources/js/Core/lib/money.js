/**
 * Money for people — the JS twin of `App\Support\Money::format`.
 *
 * Amounts arrive and stay in **minor units**; this only writes them. The page's
 * language decides the symbol, its side, the separators and the spacing
 * (Intl.NumberFormat, CURRENCY style); the currency decides only the decimals
 * — its exponent — so ¥ and Rp never grow ".00" and KWD keeps three places.
 *
 * Kept free of imports so it runs anywhere: the browser, SSR, and
 * `scripts/money-check.mjs`, which proves it writes exactly what PHP writes
 * (tests/Fixtures/money/formats.json). No `document` / `window` at module top
 * level — the page locale is read inside the function, behind a typeof guard.
 */

/**
 * Our language codes → the locale money is written in. Mirrors
 * `App\Support\Locales::ICU`: a region where the bare language would leave it
 * to the engine, and Arabic pinned to Latin digits (as the site's dates are).
 */
export const ICU_LOCALES = {
    en: 'en', ar: 'ar-u-nu-latn', de: 'de-DE', es: 'es-ES',
    fr: 'fr-FR', it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR',
    pt: 'pt-BR', ru: 'ru-RU', tr: 'tr-TR', zh: 'zh-CN',
};

/** `pt-BR` → `pt-BR`'s money locale; anything unsupported → English. */
export function moneyLocale(code) {
    const base = String(code ?? '').trim().toLowerCase().split(/[-_;,\s]/)[0];
    return ICU_LOCALES[base] ?? ICU_LOCALES.en;
}

let fallbackLocale = 'en';

/** The locale used when a call passes none and there is no page (SSR, scripts). */
export function setMoneyLocale(code) {
    fallbackLocale = code || 'en';
}

function pageLocale() {
    if (typeof document !== 'undefined' && document.documentElement?.lang) {
        return document.documentElement.lang;
    }
    return fallbackLocale;
}

/**
 * Currency rules, keyed by code — populated from the server (`currencies` on
 * the page props / config payload) so the exponent is the server's. The
 * symbol and separators are used only when Intl cannot format at all.
 */
let currencyRules = {};

export function setCurrencyRules(currencies) {
    currencyRules = Object.fromEntries(
        (currencies ?? []).map((c) => [String(c.code).toUpperCase(), c]),
    );
}

/**
 * The exponent for a currency: how many minor units make one major unit.
 *
 * 2 is the common case and the fallback — but the exceptions are listed here as
 * well as on the server, because defaulting IDR to 2 renders a Rp 15.000 pack
 * as "Rp 150,00" and reads as a pricing bug rather than a formatting one.
 */
const FALLBACK_EXPONENTS = {
    BIF: 0, CLP: 0, DJF: 0, GNF: 0, IDR: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0,
    MGA: 0, PYG: 0, RWF: 0, UGX: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,
    BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
};

export function currencyExponent(currency = 'USD') {
    const code = String(currency ?? 'USD').toUpperCase();
    return currencyRules[code]?.exponent ?? FALLBACK_EXPONENTS[code] ?? 2;
}

const formatters = new Map();

function formatter(locale, code, exponent) {
    const key = `${locale}|${code}|${exponent}`;
    let fmt = formatters.get(key);
    if (!fmt) {
        fmt = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: code,
            minimumFractionDigits: exponent,
            maximumFractionDigits: exponent,
            // ICU's NumberFormatter in PHP groups every thousand; CLDR's
            // "minimum grouping digits" would leave es/it "1234,56 €" here.
            useGrouping: 'always',
        });
        formatters.set(key, fmt);
    }
    return fmt;
}

/** The Currency row's own rules, the same in every locale (Money::formatPlain). */
function formatPlain(minor, code, exponent) {
    const rule = currencyRules[code];
    const value = (Number(minor) || 0) / 10 ** exponent;
    const digits = value.toFixed(exponent).split('.');
    const whole = digits[0].replace(/\B(?=(\d{3})+(?!\d))/g, rule?.thousandsSeparator ?? ',');
    const number = digits[1] === undefined ? whole : `${whole}${rule?.decimalSeparator ?? '.'}${digits[1]}`;
    const symbol = rule?.symbol;

    if (!symbol) return `${code} ${number}`;
    return rule?.symbolPosition === 'after' ? `${number} ${symbol}` : `${symbol}${number}`;
}

/**
 * Formats an amount given in **minor units**, in `locale` (one of our codes or
 * a BCP 47 tag; defaults to the page's `<html lang>`). Prefer the server's
 * `formatted` where a payload carries one; this is for totals computed in the
 * browser, and writes the same string.
 */
export function money(minor, currency = 'USD', locale) {
    const code = String(currency ?? 'USD').trim().toUpperCase();
    const exponent = currencyExponent(code);

    if (/^[A-Z]{3}$/.test(code) && typeof Intl !== 'undefined') {
        try {
            return formatter(moneyLocale(locale ?? pageLocale()), code, exponent).format((Number(minor) || 0) / 10 ** exponent);
        } catch {
            // An engine without this currency or locale: the plain rules below.
        }
    }

    return formatPlain(minor, code, exponent);
}

export function formatPrice(minor, currency = 'USD', locale) {
    return money(minor, currency, locale);
}
