#!/usr/bin/env python3
"""BOOKETIK Solutions R4: deploy GitHub-built assets + guarded presentation-only routes.
Python 3.6 compatible. Run inside an unpacked GitHub Actions release in private staging.
Usage: python3 deploy.py /home/.../domains/booketik.com/eventgoo
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
META = HERE / 'metadata.json'
CHKS = HERE / 'CHECKSUMS.sha256'
PAYLOAD = HERE / 'payload'

class Blocked(Exception):
    pass

def out(key, value):
    print('{}={}'.format(key, value), flush=True)

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def command(args, root, timeout=90):
    try:
        p = subprocess.run(args, cwd=str(root), stdout=subprocess.PIPE,
                           stderr=subprocess.STDOUT, universal_newlines=True,
                           timeout=timeout)
    except Exception as ex:
        raise Blocked('PROCESS_ERROR={} {}'.format(args[0], str(ex)))
    if p.returncode:
        raise Blocked('COMMAND_FAILED={} STATUS={} OUTPUT={}'.format(args[0], p.returncode, p.stdout[-2000:]))
    return p.stdout

def copy_atomic(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    fd, n = tempfile.mkstemp(prefix='.r4_', dir=str(dst.parent))
    try:
        with os.fdopen(fd, 'wb') as outp:
            with src.open('rb') as inp:
                shutil.copyfileobj(inp, outp)
        os.chmod(n, (dst.stat().st_mode if dst.exists() else src.stat().st_mode) & 0o777)
        os.replace(n, str(dst))
    finally:
        if os.path.exists(n):
            os.unlink(n)

def bundle_verify():
    if not META.is_file() or not CHKS.is_file():
        raise Blocked('RELEASE_METADATA_MISSING')
    checks = CHKS.read_text().splitlines()
    if len(checks) < 10:
        raise Blocked('CHECKSUM_LIST_TOO_SHORT')
    for line in checks:
        parts = line.split('  ', 1)
        if len(parts) != 2:
            raise Blocked('INVALID_CHECKSUM_LINE')
        digest, rel = parts
        path = HERE / rel
        if rel.startswith('/') or '..' in Path(rel).parts or not path.is_file() or path.is_symlink() or sha(path) != digest:
            raise Blocked('RELEASE_SHA_FAILED=' + rel)
    out('RELEASE_SHA_GUARDS', 'PASS')
    return json.loads(META.read_text())

def php_path():
    exe = Path('/opt/alt/php84/usr/bin/php')
    return str(exe if exe.is_file() else 'php')

def safe_root(root, meta):
    if root.name != 'eventgoo' or not (root / 'artisan').is_file() or not (root / 'vendor/autoload.php').is_file():
        raise Blocked('INVALID_APP_ROOT')
    for rel, digest in meta['baseline_sha256'].items():
        f = root / rel
        if not f.is_file() or f.is_symlink() or sha(f) != digest:
            raise Blocked('BASELINE_CHANGED_STOP=' + rel)
    for rel in meta['new_sources']:
        if (root / rel).exists():
            raise Blocked('TARGET_EXISTS_STOP=' + rel)
    if not (root / 'public/build/manifest.json').is_file():
        raise Blocked('CURRENT_VITE_MANIFEST_MISSING')
    try:
        m = json.loads((PAYLOAD / 'public/build/manifest.json').read_text())
        if not any('SolutionsPublic.jsx' in k for k in m):
            raise ValueError('SolutionsPublic absent')
        if len(m) < 150:
            raise ValueError('Unexpectedly small Vite manifest')
    except Exception as ex:
        raise Blocked('NEW_MANIFEST_INVALID=' + str(ex))
    out('SOURCE_BASELINE_GUARDS', 'PASS')
    out('REACT_ASSETS', 'GITHUB_BUILT')
    return m

def refresh(root, cache_was_enabled):
    command([php_path(), 'artisan', 'route:clear'], root)
    command([php_path(), 'artisan', 'config:clear'], root)
    if cache_was_enabled:
        command([php_path(), 'artisan', 'config:cache'], root)

def runtime_check(root):
    code = ("require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; "
            "$a->make(\\Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); "
            "$p=app(\\App\\Services\\Solutions\\BooketikSolutionsCms::class)->publishedProjection('fr'); "
            "$c=config('booketik_solutions'); "
            "echo (is_array($p) && ($p['publication_status']??null)==='published' "
            "&& ($p['offers']??null)===[] && ($c['public_enabled']??null)===false "
            "&& ($c['pricing_public_enabled']??null)===false "
            "&& ($c['commercial_checkout_enabled']??null)===false "
            "&& ($c['miguil_pay_enabled']??null)===false) ? 'PASS' : 'FAIL';")
    result = command([php_path(), '-r', code], root).strip()
    if result != 'PASS':
        raise Blocked('PUBLISHED_READ_ONLY_PROJECTION=' + result)
    out('PUBLISHED_PROJECTION', 'PASS')

def http_check(root, private):
    for locale in ('fr', 'nl', 'en'):
        dest = private / ('http_' + locale + '.html')
        status = command(['curl', '-sSL', '--max-time', '25', '-o', str(dest),
                          '-w', '%{http_code}', 'https://booketik.com/{}/solutions'.format(locale)], root, timeout=35).strip()
        body = dest.read_text(errors='replace')
        if status != '200' or 'SolutionsPublic' not in body:
            raise Blocked('PUBLIC_HTTP_{}={} COMPONENT={}'.format(locale, status, 'YES' if 'SolutionsPublic' in body else 'NO'))
        out('PUBLIC_HTTP_' + locale, '200+INERTIA_OK')

def release(root):
    meta = bundle_verify()
    safe_root(root, meta)
    php = php_path()
    sources = list(meta['patched_sha256'].keys())
    for rel in sources:
        p = PAYLOAD / rel
        if not p.is_file() or sha(p) != meta['patched_sha256'][rel]:
            raise Blocked('PATCH_PAYLOAD_DRIFT=' + rel)
        if rel.endswith('.php'):
            command([php, '-l', str(p)], root)
    out('PHP_LINT', 'PASS')
    private_root = root.parent / '_private'
    private_root.mkdir(parents=True, exist_ok=True)
    private = Path(tempfile.mkdtemp(prefix='solutions_r4_backup_', dir=str(private_root)))
    os.chmod(str(private), 0o700)
    out('BACKUP', str(private))
    old_manifest = root / 'public/build/manifest.json'
    cache_enabled = (root / 'bootstrap/cache/config.php').exists()
    old_ssr = root / 'bootstrap/ssr'
    # Preserve every overwritten source, and keep an explicit absent marker for new files.
    saved = private / 'source_before'
    for rel in sources:
        before = root / rel
        if before.is_file():
            backup = saved / rel
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(before), str(backup))
    backup_manifest = private / 'manifest_before.json'
    shutil.copy2(str(old_manifest), str(backup_manifest))
    if old_ssr.is_dir():
        shutil.copytree(str(old_ssr), str(private / 'ssr_before'))
    written = []
    ssr_changed = False
    try:
        # Keep activation last: the new CMS rejects all public reads until the new config is copied.
        config_rel = 'config/booketik_solutions.php'
        for rel in sources:
            if rel == config_rel:
                continue
            copy_atomic(PAYLOAD / rel, root / rel)
            written.append(rel)
        refresh(root, cache_enabled)
        routes = command([php, 'artisan', 'route:list', '--name=site.solutions.show', '--no-ansi'], root)
        if 'site.solutions.show' not in routes:
            raise Blocked('SOLUTIONS_ROUTE_MISSING')
        plus = command([php, 'artisan', 'route:list', '--name=site.plus', '--no-ansi'], root)
        if 'site.plus' not in plus:
            raise Blocked('PLUS_ROUTE_MISSING')
        out('PUBLIC_ROUTE_AND_PLUS', 'PASS')
        # Content-hashed assets are additive. Manifest is replaced only after all referenced assets exist.
        build = PAYLOAD / 'public/build'
        copied = 0
        for f in build.rglob('*'):
            if not f.is_file() or f.name == 'manifest.json':
                continue
            rel = f.relative_to(build)
            dest = root / 'public/build' / rel
            if dest.is_file():
                if sha(dest) != sha(f):
                    raise Blocked('ASSET_NAME_COLLISION=' + str(rel))
                continue
            copy_atomic(f, dest)
            copied += 1
        out('NEW_HASHED_ASSETS', copied)
        # SSR bundle retained for servers which run the Inertia SSR worker.
        built_ssr = PAYLOAD / 'bootstrap/ssr'
        if built_ssr.is_dir():
            # Mark BEFORE removing the old tree: partial copy errors must restore SSR too.
            ssr_changed = True
            if old_ssr.is_dir():
                shutil.rmtree(str(old_ssr))
            shutil.copytree(str(built_ssr), str(old_ssr))
        copy_atomic(build / 'manifest.json', old_manifest)
        out('PUBLIC_MANIFEST', 'UPDATED')
        copy_atomic(PAYLOAD / config_rel, root / config_rel)
        written.append(config_rel)
        refresh(root, cache_enabled)
        runtime_check(root)
        http_check(root, private)
        (private / 'RELEASE_PASS').write_text('PASS\n')
        out('COMMERCIAL_GATES', 'OFF')
        out('SQL_WRITES', 0)
        out('PAYMENT_CALLS', 0)
        out('PLUS_ROUTES', 'PRESERVED')
        out('SSR_WORKER_RESTART', 'NOT_PERFORMED')
        out('RELEASE', 'PASS')
    except Exception as ex:
        out('FAILURE', str(ex))
        # Fail closed even when another step errors: the original config is restored first.
        try:
            for rel in reversed(written):
                before = saved / rel
                if before.is_file():
                    copy_atomic(before, root / rel)
                elif rel in meta['new_sources'] and (root / rel).is_file():
                    (root / rel).unlink()
            copy_atomic(backup_manifest, old_manifest)
            if ssr_changed:
                if old_ssr.is_dir():
                    shutil.rmtree(str(old_ssr))
                if (private / 'ssr_before').is_dir():
                    shutil.copytree(str(private / 'ssr_before'), str(old_ssr))
            refresh(root, cache_enabled)
            out('ROLLBACK', 'SOURCE_CONFIG_MANIFEST_SSR_RESTORED')
        except Exception as undo:
            out('ROLLBACK_MANUAL_REVIEW_REQUIRED', str(undo))
        raise Blocked('RELEASE_ABORTED')

def main():
    if len(sys.argv) != 2:
        print('Usage: python3 deploy.py /path/to/eventgoo')
        sys.exit(2)
    root = Path(sys.argv[1]).resolve()
    try:
        release(root)
    except Blocked as e:
        out('BLOCKED', str(e))
        sys.exit(1)

if __name__ == '__main__':
    main()
