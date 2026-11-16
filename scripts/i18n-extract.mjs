#!/usr/bin/env node
/*
 | Storefront translation keys (see resources/js/Core/i18n.js).
 |
 |   node scripts/i18n-extract.mjs                 collect every t('…') → resources/lang/en.json
 |   node scripts/i18n-extract.mjs --check         per-locale missing / stale keys (exit 1 if missing)
 |   node scripts/i18n-extract.mjs --scan=<dir>    likely user-visible English NOT wrapped in t()
 |
 | Keys are the English text itself. Only literal first arguments are keys —
 | t(variable) is invisible to this script, so never translate a variable.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JS = join(ROOT, 'resources/js');
const LANG = join(ROOT, 'resources/lang');
const SOURCES = ['Core', 'Switcher', 'Themes'];
const LOCALES = ['ar', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'tr', 'zh'];

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
}));

function files(path) {
    if (!existsSync(path)) return [];
    if (statSync(path).isFile()) return /\.(jsx?|tsx?)$/.test(path) ? [path] : [];
    return readdirSync(path).flatMap((name) => (name === 'node_modules' ? [] : files(join(path, name))));
}

const CALL = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;

function unescape(raw, quote) {
    return raw.replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c === quote || c === '\\' ? c : `\\${c}`));
}

function collect() {
    const keys = new Map();
    for (const file of SOURCES.flatMap((s) => files(join(JS, s)))) {
        const src = readFileSync(file, 'utf8');
        for (const m of src.matchAll(CALL)) {
            if (m[1] === '`' && m[2].includes('${')) continue; // not a literal
            const key = unescape(m[2], m[1]);
            if (!key.trim()) continue;
            if (!keys.has(key)) keys.set(key, relative(ROOT, file));
        }
    }
    // Server-built storefront labels: __('English text') in app/ (dotted admin keys like 'dashboard.x' are not ours).
    const SERVER = /__\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
    // trans_choice('one|many') too; and the API's refusals (EventRuleViolation, AiUnavailable),
    // which ApiExceptionRenderer passes through __() — literal messages only.
    const CHOICE = /trans_choice\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
    const REFUSAL = /new (?:EventRuleViolation|self)\(\s*'[A-Za-z_]+',\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
    const serverFiles = phpFiles(join(ROOT, 'app')).concat(phpFiles(join(ROOT, 'resources/views')));
    for (const file of serverFiles) {
        const src = readFileSync(file, 'utf8');
        for (const re of [SERVER, CHOICE, REFUSAL]) {
            for (const m of src.matchAll(re)) {
                const key = unescape(m[2], m[1]);
                if (!key.trim() || /^[a-z0-9_]+(\.[a-z0-9_]+)+$/i.test(key)) continue;
                if (m[1] === '"' && /\$\{|\{\$|\$[a-z]/i.test(m[2])) continue; // interpolated, not a literal
                if (!keys.has(key)) keys.set(key, relative(ROOT, file));
            }
        }
    }
    return keys;
}

function phpFiles(path) {
    if (!existsSync(path)) return [];
    if (statSync(path).isFile()) return path.endsWith('.php') ? [path] : [];
    return readdirSync(path).flatMap((name) => phpFiles(join(path, name)));
}

if (args.scan) {
    // Heuristic: JSX text children and common text attributes holding literal English.
    const TEXT = />\s*([A-Z][A-Za-z0-9 ,.'’!?:;—–&()%-]{2,})\s*</g;
    const ATTR = /\b(aria-label|title|placeholder|alt|label)=["']([A-Za-z][^"'{}]{2,})["']/g;
    let count = 0;
    for (const file of files(resolve(ROOT, args.scan))) {
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, i) => {
            if (/^\s*(\/\/|\*|\/\*)/.test(line) || /className=|import /.test(line) && !/>\s*[A-Z]/.test(line)) return;
            for (const m of [...line.matchAll(TEXT), ...line.matchAll(ATTR)]) {
                const text = m[2] ?? m[1];
                if (/^[A-Z0-9_]+$/.test(text) || /^https?:/.test(text)) continue;
                console.log(`${relative(ROOT, file)}:${i + 1}  ${text.trim()}`);
                count++;
            }
        });
    }
    console.log(`\n${count} candidate(s).`);
    process.exit(0);
}

const keys = collect();
const sorted = Object.fromEntries([...keys.keys()].sort((a, b) => a.localeCompare(b)).map((k) => [k, k]));

if (args.check) {
    let missingTotal = 0;
    console.log(`${keys.size} keys in use.`);
    for (const code of LOCALES) {
        const path = join(LANG, `${code}.json`);
        const dict = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
        const missing = [...keys.keys()].filter((k) => typeof dict[k] !== 'string' || dict[k] === '');
        const stale = Object.keys(dict).filter((k) => !keys.has(k));
        missingTotal += missing.length;
        console.log(`${code}: ${missing.length} missing, ${stale.length} stale${missing.length ? `  e.g. ${JSON.stringify(missing.slice(0, 3))}` : ''}`);
    }
    process.exit(missingTotal ? 1 : 0);
}

writeFileSync(join(LANG, 'en.json'), JSON.stringify(sorted, null, 4) + '\n');
console.log(`Wrote resources/lang/en.json — ${keys.size} keys.`);
