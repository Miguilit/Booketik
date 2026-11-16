#!/usr/bin/env node
/*
 | Proves the JS money formatter writes what PHP writes.
 |
 | Reads tests/Fixtures/money/formats.json — the same table tests/Unit/MoneyTest
 | holds App\Support\Money::format to — and runs every case through money() in
 | resources/js/Core/lib/money.js. Exits 1 with a list of mismatches.
 |
 |   node scripts/money-check.mjs          (also run by MoneyTest when node exists)
 |   npm run money:check
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { money } = await import(pathToFileURL(resolve(root, 'resources/js/Core/lib/money.js')).href);
const { cases } = JSON.parse(readFileSync(resolve(root, 'tests/Fixtures/money/formats.json'), 'utf8'));

const show = (s) => JSON.stringify(s).replace(/[  ‏‎؜]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const failures = cases
    .map((c) => ({ ...c, actual: money(c.minor, c.currency, c.locale) }))
    .filter((c) => c.actual !== c.formatted);

for (const f of failures) {
    console.error(`${f.locale} ${f.currency} ${f.minor}: expected ${show(f.formatted)}, got ${show(f.actual)}`);
}

if (failures.length > 0) {
    console.error(`money-check: ${failures.length} of ${cases.length} cases differ from PHP (node ${process.version}, ICU ${process.versions.icu}).`);
    process.exit(1);
}

console.log(`money-check: ${cases.length} cases match PHP.`);
