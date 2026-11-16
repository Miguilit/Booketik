#!/usr/bin/env node
/*
 | npm run themes:contrast — WCAG AA for every theme's token pairs.
 |
 | Reads resources/js/Themes/<key>/tokens.css, takes the light values from the
 | first `:root { … }` block and the dark ones from `html.dark { … }` (laid
 | over the light), and checks each text/background pair below against WCAG
 | 2.x: 4.5:1 for text, 3:1 for focus rings and the sticker edge (non-text UI).
 |
 | Every theme names its tokens `--<prefix>-<role>` with the same roles, so one
 | table covers all of them; a theme missing a role fails too. Exits 1 with
 | the list of failures, so it gates CI and `tests/Feature/ThemeContrastTest`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themesDir = join(root, 'resources', 'js', 'Themes');

const TEXT = 4.5;
const UI = 3;

// [foreground role, background role, minimum, what it is]
export const PAIRS = [
    ['ink', 'bg', TEXT, 'headings on the page'],
    ['ink', 'surface', TEXT, 'headings on cards'],
    ['ink', 'raised', TEXT, 'text in wells and chips'],
    ['body', 'bg', TEXT, 'paragraphs on the page'],
    ['body', 'surface', TEXT, 'paragraphs on cards'],
    ['muted', 'bg', TEXT, 'captions on the page'],
    ['muted', 'surface', TEXT, 'captions on cards'],
    ['muted', 'raised', TEXT, 'captions in wells'],
    ['link', 'bg', TEXT, 'links on the page'],
    ['link', 'surface', TEXT, 'links on cards'],
    ['on-brand', 'brand', TEXT, 'text on brand fills'],
    ['on-cta', 'cta', TEXT, 'the call to action'],
    ['on-tint', 'tint', TEXT, 'text on info tint'],
    ['on-tint-2', 'tint-2', TEXT, 'text on the highlight tint (date stamps)'],
    ['success', 'bg', TEXT, 'confirmations on the page'],
    ['success', 'surface', TEXT, 'confirmations on cards'],
    ['danger', 'bg', TEXT, 'errors on the page'],
    ['danger', 'surface', TEXT, 'errors on cards'],
    ['warning', 'bg', TEXT, 'warnings on the page'],
    ['warning', 'surface', TEXT, 'warnings on cards'],
    ['bg', 'ink', TEXT, 'inverted chips (selected)'],
    ['bg', 'success', TEXT, 'text on success fills'],
    ['bg', 'danger', TEXT, 'text on danger fills (sold out, cancelled)'],
    ['on-scrim', 'scrim', TEXT, 'text over cover scrims'],
    ['focus', 'bg', UI, 'focus ring on the page'],
    ['focus', 'surface', UI, 'focus ring on cards'],
    ['edge', 'bg', UI, 'key-card edge on the page'],
];

function blocks(css) {
    const strip = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(strip))) out.push({ selector: m[1].trim(), body: m[2] });
    return out;
}

function vars(body) {
    const map = {};
    for (const m of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) map[m[1]] = m[2].trim();
    return map;
}

function rgb(value) {
    const nums = value.split(/[\s,]+/).map(Number);
    return nums.length >= 3 && nums.slice(0, 3).every((n) => Number.isFinite(n)) ? nums.slice(0, 3) : null;
}

function luminance([r, g, b]) {
    const c = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}

export function ratio(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function checkTheme(key) {
    const file = join(themesDir, key, 'tokens.css');
    const parsed = blocks(readFileSync(file, 'utf8'));
    const light = parsed.find((b) => b.selector === ':root');
    const dark = parsed.find((b) => b.selector === 'html.dark');
    if (!light || !dark) return { key, failures: [`${key}: tokens.css needs a ':root' and an 'html.dark' block`], checked: 0 };

    const lightVars = vars(light.body);
    const prefix = Object.keys(lightVars).find((n) => /^[a-z]{2}-/.test(n))?.slice(0, 2);
    const modes = { light: lightVars, dark: { ...lightVars, ...vars(dark.body) } };
    const failures = [];
    let checked = 0;

    for (const [mode, map] of Object.entries(modes)) {
        for (const [fg, bg, min, what] of PAIRS) {
            const f = map[`${prefix}-${fg}`];
            const b = map[`${prefix}-${bg}`];
            if (!f || !b) {
                failures.push(`${key} ${mode}: missing --${prefix}-${!f ? fg : bg}`);
                continue;
            }
            const fr = rgb(f);
            const br = rgb(b);
            if (!fr || !br) {
                failures.push(`${key} ${mode}: --${prefix}-${fg} / --${prefix}-${bg} must be RGB triplets`);
                continue;
            }
            const r = ratio(fr, br);
            checked++;
            if (r < min) failures.push(`${key} ${mode}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1 (${what})`);
        }
    }

    return { key, failures, checked };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
    const keys = readdirSync(themesDir).filter((k) => statSync(join(themesDir, k)).isDirectory());
    let failed = 0;
    for (const key of keys) {
        let result;
        try {
            result = checkTheme(key);
        } catch (e) {
            result = { key, failures: [`${key}: ${e.message}`], checked: 0 };
        }
        if (result.failures.length) {
            failed += result.failures.length;
            console.error(`✗ ${key}`);
            for (const line of result.failures) console.error(`  ${line}`);
        } else {
            console.log(`✓ ${key}: ${result.checked} pairs pass WCAG AA (light + dark)`);
        }
    }
    if (failed) {
        console.error(`\n${failed} contrast failure(s).`);
        process.exit(1);
    }
}
