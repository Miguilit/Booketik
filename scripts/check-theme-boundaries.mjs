#!/usr/bin/env node
/*
 | npm run themes:check — keeps storefront themes isolated.
 |
 | A theme (resources/js/Themes/<key>/**) may import only:
 |   - packages (bare specifiers: 'react', 'lucide-react', …)
 |   - `@/Core/*` — the shared, markup-free hooks and logic
 |   - files inside its own folder (relative paths that stay inside it, or
 |     `@/Themes/<same key>/…`)
 |
 | The switcher (resources/js/Switcher/**) may import only packages, `@/Core/*`
 | and its own files.
 |
 | Everything else — Classic's `@/Site/*` components, another theme's files —
 | is a leak: it couples two designs so that editing one can break the other.
 |
 | Exits 1 and lists every violation, so it can gate CI or a pre-commit hook.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const js = join(root, 'resources', 'js');

const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;

function walk(dir) {
    let files = [];
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) files = files.concat(walk(path));
        else if (/\.(jsx?|mjs)$/.test(name)) files.push(path);
    }
    return files;
}

function check(file, ownRoot, label) {
    const problems = [];
    const source = readFileSync(file, 'utf8');

    for (const match of source.matchAll(IMPORT)) {
        const spec = match[1] ?? match[2] ?? match[3];
        if (!spec) continue;

        if (spec.startsWith('.')) {
            const target = resolve(dirname(file), spec);
            if (!(target + sep).startsWith(ownRoot + sep) && target !== ownRoot) {
                problems.push(`${spec} (leaves ${label})`);
            }
            continue;
        }

        if (spec.startsWith('@/')) {
            if (spec.startsWith('@/Core/') || spec === '@/Core') continue;
            const target = join(js, spec.slice(2));
            if ((target + sep).startsWith(ownRoot + sep)) continue;
            problems.push(`${spec} (only @/Core/* and own files are allowed)`);
        }
        // Bare specifiers are packages — allowed.
    }

    return problems;
}

const violations = [];
const scopes = [];

const themesDir = join(js, 'Themes');
try {
    for (const key of readdirSync(themesDir)) {
        const dir = join(themesDir, key);
        if (statSync(dir).isDirectory()) scopes.push({ dir, label: `Themes/${key}` });
    }
} catch {
    // No themes yet.
}
scopes.push({ dir: join(js, 'Switcher'), label: 'Switcher' });

for (const { dir, label } of scopes) {
    let files = [];
    try {
        files = walk(dir);
    } catch {
        continue;
    }
    for (const file of files) {
        for (const problem of check(file, dir, label)) {
            violations.push(`${relative(root, file)}: ${problem}`);
        }
    }
}

/*
 | No sparkle or "AI magic" icons, anywhere on the web or in the admin (a
 | product rule): icons name the action — Search/TextSearch for AI search,
 | MessageCircleQuestion for asking, PenLine for drafting, ClipboardPaste for
 | paste-to-event, Quote for summaries, BadgeCheck for Plus, Tag for promotions.
 | Stars are for ratings only.
 */
const MAGIC_JS = /\b(Sparkles?|Wand[A-Z]\w*)\b|✨/;
const MAGIC_BLADE = /mdi-creation|mdi-star-four-points|mdi-auto-fix|fa-wand-magic|fa-magic\b|✨/;

for (const file of walk(js)) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (MAGIC_JS.test(line)) violations.push(`${relative(root, file)}:${i + 1}: sparkle/wand icon — use an icon that names the action`);
    });
}

function walkViews(dir) {
    let out = [];
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) out = out.concat(walkViews(path));
        else if (name.endsWith('.php')) out.push(path);
    }
    return out;
}

for (const file of walkViews(join(root, 'resources', 'views'))) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (MAGIC_BLADE.test(line)) violations.push(`${relative(root, file)}:${i + 1}: sparkle/magic icon — use an icon that names the action`);
    });
}

if (violations.length) {
    console.error(`Theme boundary violations (${violations.length}):\n  ` + violations.join('\n  '));
    process.exit(1);
}

console.log(`Theme boundaries OK (${scopes.map((s) => s.label).join(', ')}); no sparkle or wand icons.`);
