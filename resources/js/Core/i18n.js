/*
 | Storefront translations — every theme, Classic, the switcher and the Core
 | engines say their words through `t()`.
 |
 | The key IS the English text: `t('Continue reading')`. Each website locale has
 | `resources/lang/{locale}.json` mapping that English to its own words (the
 | same file Laravel's `__()` reads). A missing key simply shows the English,
 | so an untranslated string can never break a page.
 |
 | Dynamic parts are named placeholders, never string concatenation, so a
 | translator can move them: `t('Doors at :time on :day', { time, day })`.
 |
 | The dictionary is loaded once, before the app renders (app.jsx), for the
 | locale on <html lang>. Changing language is a full page load (the switcher
 | does that), so the dictionary, `lang` and `dir` always agree.
 |
 | Extract / check keys: `node scripts/i18n-extract.mjs` (writes
 | resources/lang/en.json) and `node scripts/i18n-extract.mjs --check`.
 */

/** Lazy chunk per locale file — only the visitor's language is downloaded. */
const LOADERS = import.meta.glob('../../lang/*.json');

let dictionary = {};
let activeLocale = 'en';

/** Replace :name placeholders (longest name first, so :count never eats :countdown). */
function fill(text, params) {
    if (!params) return text;
    let out = text;
    for (const name of Object.keys(params).sort((a, b) => b.length - a.length)) {
        out = out.split(`:${name}`).join(String(params[name] ?? ''));
    }
    return out;
}

/** Translate English UI text into the active locale, filling :placeholders. */
export function t(text, params) {
    if (typeof text !== 'string') return text;
    const translated = dictionary[text];
    return fill(typeof translated === 'string' && translated !== '' ? translated : text, params);
}

/** Hook form, for components that prefer it. Same function. */
export function useT() {
    return t;
}

/**
 * The page's language for Intl formatting: <html lang> in the browser, the
 * installed dictionary's locale on the SSR server — so dates and weekdays
 * render the same on both sides (a mismatch discards the server's HTML).
 */
export function pageLang() {
    if (typeof document !== 'undefined' && document.documentElement?.lang) return document.documentElement.lang;
    return activeLocale || 'en';
}

/** The locale whose dictionary is loaded. */
export function locale() {
    return activeLocale;
}

/** Install a dictionary directly (tests, previews). */
export function setDictionary(entries, code = activeLocale) {
    dictionary = entries && typeof entries === 'object' ? entries : {};
    activeLocale = code;
}

const cache = new Map();

/**
 * The dictionary for `code`, without installing it — for the SSR server,
 * which renders many languages in one process and installs each page's
 * dictionary synchronously right before rendering it (setDictionary).
 */
export async function dictionaryFor(code) {
    const wanted = String(code || 'en').toLowerCase().split('-')[0];
    if (wanted === 'en') return {};
    if (!cache.has(wanted)) {
        const loader = LOADERS[`../../lang/${wanted}.json`];
        cache.set(wanted, loader ? loader().then((m) => m?.default ?? m ?? {}).catch(() => ({})) : Promise.resolve({}));
    }
    return cache.get(wanted);
}

/**
 * Load the dictionary for `code` (defaults to <html lang>). English needs none.
 * Never throws: on any failure the site renders in English.
 */
export async function loadDictionary(code) {
    const wanted = String(code || (typeof document !== 'undefined' ? document.documentElement.lang : '') || 'en')
        .toLowerCase()
        .split('-')[0];

    activeLocale = wanted;
    if (wanted === 'en') {
        dictionary = {};
        return;
    }

    const loader = LOADERS[`../../lang/${wanted}.json`];
    if (!loader) {
        dictionary = {};
        return;
    }

    try {
        const mod = await loader();
        dictionary = mod?.default ?? mod ?? {};
    } catch {
        dictionary = {};
    }
}
