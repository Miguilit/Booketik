#!/usr/bin/env python3
"""Pack already-built Vite output into a guarded Hostinger ZIP (does not deploy)."""
import hashlib
import json
from pathlib import Path
import shutil
import zipfile

root = Path(__file__).resolve().parents[2]
kit = Path(__file__).parent
meta = json.loads((kit / 'metadata.json').read_text())
manifest = root / 'public/build/manifest.json'
if not manifest.is_file():
    raise SystemExit('BUILD_MANIFEST_MISSING')
m = json.loads(manifest.read_text())
if meta['manifest_page'] not in m or not m[meta['manifest_page']].get('file'):
    raise SystemExit('BUILT_SOLUTIONS_PAGE_MISSING')
if len(m) < 150:
    raise SystemExit('BUILD_MANIFEST_TOO_SMALL')
for rel, expected in meta['patched_sha256'].items():
    if not (root / rel).is_file() or hashlib.sha256((root / rel).read_bytes()).hexdigest() != expected:
        raise SystemExit('PATCH_SHA_DRIFT=' + rel)

out_dir = root / 'dist'
stage = out_dir / 'booketik_solutions_r4_bundle'
if stage.exists():
    shutil.rmtree(stage)
stage.mkdir(parents=True)
payload = stage / 'payload'
for rel in meta['patched_sha256']:
    target = payload / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / rel, target)
shutil.copytree(root / 'public/build', payload / 'public/build')
if (root / 'bootstrap/ssr').is_dir():
    shutil.copytree(root / 'bootstrap/ssr', payload / 'bootstrap/ssr')
shutil.copy2(kit / 'metadata.json', stage / 'metadata.json')
shutil.copy2(kit / 'deploy.py', stage / 'deploy.py')

lines=[]
for p in sorted(stage.rglob('*')):
    if p.is_file() and p.name != 'CHECKSUMS.sha256':
        rel=p.relative_to(stage).as_posix()
        lines.append(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + rel)
(stage / 'CHECKSUMS.sha256').write_text('\n'.join(lines)+'\n')

zip_path = out_dir / 'BOOKETIK_SOLUTIONS_R4_HOSTINGER_RELEASE.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(stage.rglob('*')):
        if p.is_file():
            z.write(p, p.relative_to(stage).as_posix())
with zipfile.ZipFile(zip_path) as z:
    if z.testzip():
        raise SystemExit('ZIP_INTEGRITY_FAILED')
print('BUILT_MANIFEST_ENTRIES=' + str(len(m)))
print('SOLUTIONS_PUBLIC_PAGE_COMPILED=PASS')
print('RELEASE_FILES=' + str(len(lines)+1))
print('RELEASE_ZIP_SHA256=' + hashlib.sha256(zip_path.read_bytes()).hexdigest())
print('RELEASE_ZIP=' + str(zip_path))
print('GITHUB_ARTIFACT=READY')
