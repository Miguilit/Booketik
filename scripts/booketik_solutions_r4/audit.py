#!/usr/bin/env python3
"""Fail closed if the BOOKETIK Solutions R4 source gate drifts."""
import hashlib
import json
from pathlib import Path
root = Path(__file__).resolve().parents[2]
metadata = json.loads((Path(__file__).parent / 'metadata.json').read_text())
for rel, expected in metadata['patched_sha256'].items():
    fp = root / rel
    if not fp.is_file() or hashlib.sha256(fp.read_bytes()).hexdigest() != expected:
        raise SystemExit('R4_SOURCE_GUARD_FAIL=' + rel)
for rel in metadata['new_sources']:
    if not (root / rel).is_file():
        raise SystemExit('R4_NEW_SOURCE_MISSING=' + rel)
config = (root / 'config/booketik_solutions.php').read_text()
cms = (root / 'app/Services/Solutions/BooketikSolutionsCms.php').read_text()
route = (root / 'routes/web.php').read_text()
nav = (root / 'resources/js/Themes/civic/Layout.jsx').read_text()
assert "'presentation_public_enabled' => true" in config
for gate in ["'public_enabled' => false", "'pricing_public_enabled' => false", "'commercial_checkout_enabled' => false", "'miguil_pay_enabled' => false", "'quote_intake_enabled' => false"]:
    assert gate in config, 'COMMERCIAL_GATE_DRIFT:' + gate
assert "'offers' => []" in cms
assert "'enabled' => false" in cms
assert 'site.solutions.show' in route and 'site.plus' in route
assert "url('/solutions')" in nav and "url('/plus')" not in nav
print('R4_SOURCE_GUARDS=PASS')
print('COMMERCIAL_GATES=OFF')
print('PLUS_ROUTE=UNTOUCHED')
