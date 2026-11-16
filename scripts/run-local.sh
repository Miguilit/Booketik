#!/usr/bin/env bash
#
# run-local.sh — one command that takes a freshly unzipped copy of this project
# to a running local install.
#
# It is deliberately generic: everything it does is discovered from the project
# it is sitting in (composer.json, package.json, .env.example, artisan) rather
# than hardcoded, so the same script can be dropped into any of these Laravel
# admin-panel projects unchanged.
#
# Every step is idempotent. Run it again after pulling changes and it will only
# do the work that is actually missing.
#
#   ./scripts/run-local.sh              # interactive, asks before anything risky
#   ./scripts/run-local.sh -y           # never ask; generate secrets as needed
#   ./scripts/run-local.sh --fresh      # drop and rebuild the database
#   ./scripts/run-local.sh --help
#
# Written for bash 3.2 (the /bin/bash macOS still ships) — no associative
# arrays, no `mapfile`, no `${var,,}`.

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Options
# ─────────────────────────────────────────────────────────────────────────────

ASSUME_YES=0
SKIP_NPM=0
SKIP_DB=0
SKIP_SEED=0
FORCE_BUILD=0
FRESH=0
DEMO=0

usage() {
    cat <<'USAGE'
run-local.sh — bootstrap this Laravel project for local development.

Usage:
  ./scripts/run-local.sh [options]

Options:
  -y, --no-interaction   Never prompt. Missing secrets are generated, and the
                         database is created if it does not exist.
      --fresh            Rebuild the schema from scratch (migrate:fresh).
                         DESTROYS all data in the configured database.
      --demo             Also run DemoSeeder after the core seeders.
      --build            Force `npm run build` even if public/build exists.
      --skip-npm         Skip node_modules install and the asset build.
      --skip-db          Skip every database step (connect, migrate, seed).
      --skip-seed        Migrate, but do not seed.
  -h, --help             Show this help.

What it does, in order:
  1.  Verifies PHP, its version and the extensions this project needs.
  2.  Verifies Composer, and installs vendor/ if it is missing or stale.
  3.  Creates .env from .env.example when absent, and switches it to local
      development defaults (APP_ENV=local, APP_DEBUG=true).
  4.  Generates APP_KEY, JWT_SECRET and ADMIN_PASSWORD if any are blank.
  5.  Installs node_modules and runs `npm run build`.
  6.  Links storage/ into public/ and fixes writable permissions.
  7.  Connects to the database, creates it if missing, migrates and seeds.
  8.  Reports on the Firebase service account and other optional integrations.
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
        -y|--no-interaction|--yes) ASSUME_YES=1 ;;
        --fresh)      FRESH=1 ;;
        --demo)       DEMO=1 ;;
        --build)      FORCE_BUILD=1 ;;
        --skip-npm)   SKIP_NPM=1 ;;
        --skip-db)    SKIP_DB=1 ;;
        --skip-seed)  SKIP_SEED=1 ;;
        -h|--help)    usage; exit 0 ;;
        *) printf 'Unknown option: %s\n\n' "$1" >&2; usage >&2; exit 2 ;;
    esac
    shift
done

# ─────────────────────────────────────────────────────────────────────────────
# Output helpers
# ─────────────────────────────────────────────────────────────────────────────

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
    C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'
else
    C_RESET=''; C_BOLD=''; C_DIM=''; C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''
fi

STEP_NO=0
WARNINGS=""
NOTES=""

step()  { STEP_NO=$((STEP_NO + 1)); printf '\n%s%s[%d/10] %s%s\n' "$C_BOLD" "$C_BLUE" "$STEP_NO" "$1" "$C_RESET"; }
ok()    { printf '  %s✓%s %s\n' "$C_GREEN" "$C_RESET" "$1"; }
info()  { printf '  %s·%s %s\n' "$C_DIM" "$C_RESET" "$1"; }
warn()  { printf '  %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$1"; WARNINGS="${WARNINGS}$1"$'\n'; }
note()  { NOTES="${NOTES}$1"$'\n'; }
die()   { printf '\n  %s✗ %s%s\n\n' "$C_RED" "$1" "$C_RESET" >&2; exit 1; }

# Ask a yes/no question. Returns 0 for yes. Honours -y and non-tty stdin.
confirm() {
    local prompt="$1" default="${2:-y}" reply
    if [ "$ASSUME_YES" = "1" ] || [ ! -t 0 ]; then
        [ "$default" = "y" ]
        return
    fi
    if [ "$default" = "y" ]; then
        printf '  %s?%s %s [Y/n] ' "$C_YELLOW" "$C_RESET" "$prompt"
    else
        printf '  %s?%s %s [y/N] ' "$C_YELLOW" "$C_RESET" "$prompt"
    fi
    read -r reply || reply=""
    [ -n "$reply" ] || reply="$default"
    case "$reply" in [Yy]*) return 0 ;; *) return 1 ;; esac
}

# ─────────────────────────────────────────────────────────────────────────────
# .env helpers
# ─────────────────────────────────────────────────────────────────────────────

ENV_FILE=".env"

# env_get KEY [FILE] — prints the value with surrounding quotes stripped.
env_get() {
    local key="$1" file="${2:-$ENV_FILE}" line value
    [ -f "$file" ] || return 1
    line="$(grep -E "^[[:space:]]*${key}=" "$file" 2>/dev/null | tail -n 1 || true)"
    [ -n "$line" ] || return 1
    value="${line#*=}"
    case "$value" in
        '"'*'"') value="${value#\"}"; value="${value%\"}" ;;
        "'"*"'") value="${value#\'}"; value="${value%\'}" ;;
    esac
    printf '%s' "$value"
}

# env_set KEY VALUE [FILE] — replaces the first assignment in place, keeping the
# line where it is (and so keeping the comment above it attached to it), or
# appends when the key is absent. Values that dotenv cannot read bare get quoted.
env_set() {
    local key="$1" value="$2" file="${3:-$ENV_FILE}" tmp
    case "$value" in
        *[\ \	\#\"\'\$]*|'') value="\"$(printf '%s' "$value" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\$/\\$/g')\"" ;;
    esac
    tmp="$(mktemp "${TMPDIR:-/tmp}/envset.XXXXXX")"
    ENVSET_KEY="$key" ENVSET_VALUE="$value" awk '
        BEGIN { key = ENVIRON["ENVSET_KEY"]; value = ENVIRON["ENVSET_VALUE"]; replaced = 0 }
        !replaced && $0 ~ "^[[:space:]]*" key "=" { print key "=" value; replaced = 1; next }
        { print }
        END { if (!replaced) print key "=" value }
    ' "$file" > "$tmp"
    mv "$tmp" "$file"
}

# True when the key is missing or set to the empty string.
env_blank() {
    local value
    value="$(env_get "$1" || true)"
    [ -z "$value" ]
}

random_secret() {
    # openssl is present everywhere PHP's openssl extension is; fall back to PHP.
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 "${1:-24}" | tr -d '\n=' | tr '+/' 'Aa'
    else
        "$PHP_BIN" -r 'echo rtrim(strtr(base64_encode(random_bytes((int)$argv[1])), "+/", "Aa"), "=");' "${1:-24}"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Runtime directories
# ─────────────────────────────────────────────────────────────────────────────

# Laravel will not boot without these, and they are the ones that go missing:
# git does not track an empty directory, so a project distributed as a zip or a
# fresh clone routinely arrives without storage/framework/views. That surfaces
# as `InvalidArgumentException: Please provide a valid cache path` — from
# `composer install`, of all places, because its post-autoload-dump hook runs
# `artisan package:discover`, which boots the framework. So they are created
# before Composer runs, not after.
RUNTIME_DIRS="storage
storage/app
storage/app/public
storage/framework
storage/framework/cache
storage/framework/cache/data
storage/framework/sessions
storage/framework/views
storage/framework/testing
storage/logs
bootstrap/cache"

ensure_runtime_dirs() {
    local dir
    for dir in $RUNTIME_DIRS; do
        [ -d "$dir" ] || mkdir -p "$dir"
        chmod -R u+rwX "$dir" 2>/dev/null || true
    done
}

# ─────────────────────────────────────────────────────────────────────────────
# Locate the project
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

[ -f artisan ] && [ -f composer.json ] || die "$PROJECT_ROOT does not look like a Laravel project (no artisan/composer.json). Move this script back into <project>/scripts/."

APP_NAME_GUESS="$(basename "$PROJECT_ROOT")"

printf '\n%s%s  Local setup — %s%s\n' "$C_BOLD" "$C_BLUE" "$APP_NAME_GUESS" "$C_RESET"
printf '%s  %s%s\n' "$C_DIM" "$PROJECT_ROOT" "$C_RESET"

# ─────────────────────────────────────────────────────────────────────────────
# 1. PHP
# ─────────────────────────────────────────────────────────────────────────────

step "Checking PHP"

PHP_BIN="${PHP_BIN:-php}"
command -v "$PHP_BIN" >/dev/null 2>&1 || die "PHP is not installed, or not on PATH.
    macOS:  brew install php
    Ubuntu: sudo apt install php-cli php-mysql php-mbstring php-xml php-curl php-zip
    Or set PHP_BIN=/full/path/to/php and re-run."

PHP_VERSION="$("$PHP_BIN" -r 'echo PHP_VERSION;')"
ok "PHP $PHP_VERSION ($(command -v "$PHP_BIN"))"

# The minimum this project declares, e.g. "^8.3" or ">=8.2" -> 8.3 / 8.2.
PHP_REQUIRED="$("$PHP_BIN" -r '
    $composer = json_decode(@file_get_contents("composer.json"), true);
    $constraint = $composer["require"]["php"] ?? "";
    if (preg_match("/(\d+\.\d+)/", $constraint, $m)) { echo $m[1]; }
' 2>/dev/null || true)"

if [ -n "$PHP_REQUIRED" ]; then
    if "$PHP_BIN" -r 'exit(version_compare(PHP_VERSION, $argv[1], ">=") ? 0 : 1);' "$PHP_REQUIRED"; then
        ok "Meets the required PHP >= $PHP_REQUIRED"
    else
        die "This project requires PHP >= $PHP_REQUIRED but $PHP_VERSION is on PATH.
    Install a newer PHP, or point this script at one: PHP_BIN=/opt/homebrew/bin/php ./scripts/run-local.sh"
    fi
fi

# Extensions: the Laravel baseline, plus anything composer.json asks for as
# ext-*, plus the driver for whichever database this .env is pointed at.
REQUIRED_EXT="openssl pdo mbstring tokenizer xml ctype json bcmath fileinfo curl dom filter hash"
COMPOSER_EXT="$("$PHP_BIN" -r '
    $composer = json_decode(@file_get_contents("composer.json"), true);
    foreach (array_keys(($composer["require"] ?? []) + ($composer["require-dev"] ?? [])) as $package) {
        if (str_starts_with($package, "ext-")) { echo substr($package, 4), " "; }
    }
' 2>/dev/null || true)"

MISSING_EXT=""
for ext in $REQUIRED_EXT $COMPOSER_EXT; do
    "$PHP_BIN" -r 'exit(extension_loaded($argv[1]) ? 0 : 1);' "$ext" || MISSING_EXT="$MISSING_EXT $ext"
done

if [ -n "$MISSING_EXT" ]; then
    die "PHP is missing required extension(s):$MISSING_EXT
    macOS (Homebrew PHP has most built in):  check \`php -m\` and your php.ini
    Ubuntu:  sudo apt install${MISSING_EXT// / php-}"
fi
ok "All required PHP extensions are loaded"

# Image handling: intervention/image needs one of these, and neither is fatal
# until someone uploads a photo — so warn rather than stop.
if ! "$PHP_BIN" -r 'exit(extension_loaded("gd") || extension_loaded("imagick") ? 0 : 1);'; then
    warn "Neither gd nor imagick is loaded — image uploads and thumbnails will fail."
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2. Composer + vendor/
# ─────────────────────────────────────────────────────────────────────────────

step "Checking Composer dependencies"

COMPOSER_BIN=""
if command -v composer >/dev/null 2>&1; then
    COMPOSER_BIN="composer"
elif [ -f composer.phar ]; then
    COMPOSER_BIN="$PHP_BIN composer.phar"
else
    die "Composer is not installed, or not on PATH.
    macOS:  brew install composer
    Any OS: https://getcomposer.org/download/  (then keep composer.phar in this folder)"
fi
ok "Composer $($COMPOSER_BIN --version 2>/dev/null | awk '{print $3}')"

NEEDS_INSTALL=0
if [ ! -f vendor/autoload.php ]; then
    NEEDS_INSTALL=1
    info "vendor/ is missing"
elif [ composer.lock -nt vendor/autoload.php ]; then
    NEEDS_INSTALL=1
    info "composer.lock is newer than vendor/ — dependencies changed"
fi

if [ "$NEEDS_INSTALL" = "1" ]; then
    # Before, not after: composer's post-autoload-dump hook boots Laravel.
    ensure_runtime_dirs
    info "Running composer install (this takes a minute on a cold cache)…"
    # Dev dependencies are wanted locally: this is where the debugbar, Pint and
    # the test suite come from.
    $COMPOSER_BIN install --no-interaction --prefer-dist || die "composer install failed. Read the error above — it is almost always a missing PHP extension or a platform requirement."
    ok "Dependencies installed"
else
    ok "vendor/ is present and up to date"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. .env
# ─────────────────────────────────────────────────────────────────────────────

step "Checking the environment file"

if [ ! -f "$ENV_FILE" ]; then
    # .env.local.example is the point of this script: local database settings
    # (MAMP's port and socket, the right user) already filled in, and debug on
    # so a misconfiguration is readable instead of a blank "500 | Server Error".
    # .env.example is the production one and stays that way.
    if [ -f .env.local.example ]; then
        cp .env.local.example "$ENV_FILE"
        ok "Created .env from .env.local.example"
    elif [ -f .env.example ]; then
        cp .env.example "$ENV_FILE"
        ok "Created .env from .env.example (no .env.local.example in this project)"
        env_set APP_ENV local
        env_set APP_DEBUG true
        ok "Set APP_ENV=local and APP_DEBUG=true"
    else
        die ".env is missing, and there is no .env.local.example or .env.example to copy from."
    fi

    note "This machine now has a local .env. It is git-ignored — never commit it."
else
    ok ".env exists"
    if [ "$(env_get APP_ENV || true)" = "production" ]; then
        warn "APP_ENV=production in your local .env. With APP_DEBUG=false you will debug blind; consider APP_ENV=local."
    fi
fi

# A cached config silently overrides everything we are about to write.
if [ -f bootstrap/cache/config.php ]; then
    rm -f bootstrap/cache/config.php
    info "Removed a stale cached config (bootstrap/cache/config.php)"
fi

# Keys present in .env.example but absent from .env — usually means .env predates
# an upgrade. Report, do not silently merge: some are deliberately unset.
ENV_TEMPLATE=".env.example"
[ -f .env.local.example ] && ENV_TEMPLATE=".env.local.example"

if [ -f "$ENV_TEMPLATE" ]; then
    MISSING_KEYS="$(
        grep -oE '^[A-Z_][A-Z0-9_]*=' "$ENV_TEMPLATE" 2>/dev/null | tr -d '=' | while read -r key; do
            grep -qE "^[[:space:]]*${key}=" "$ENV_FILE" || printf '%s ' "$key"
        done
    )"
    if [ -n "$MISSING_KEYS" ]; then
        warn "Keys in $ENV_TEMPLATE but not in your .env: $MISSING_KEYS"
        note "Copy those keys across from $ENV_TEMPLATE if a feature that needs them misbehaves."
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. Secrets
# ─────────────────────────────────────────────────────────────────────────────

step "Checking application secrets"

run_artisan() {
    # Artisan writes its own errors; we only add context on failure.
    "$PHP_BIN" artisan "$@"
}

if env_blank APP_KEY; then
    run_artisan key:generate --force --no-interaction >/dev/null 2>&1 \
        || die "php artisan key:generate failed. Run it yourself to see the error."
    ok "Generated APP_KEY"
else
    ok "APP_KEY is set"
fi

# JWT is optional across these projects — only touch it if the package is there.
if [ -d vendor/tymon/jwt-auth ]; then
    if env_blank JWT_SECRET; then
        run_artisan jwt:secret --force --no-interaction >/dev/null 2>&1 \
            || warn "php artisan jwt:secret failed — mobile API sign-in will not work until JWT_SECRET is set."
        env_blank JWT_SECRET || ok "Generated JWT_SECRET"
    else
        ok "JWT_SECRET is set"
    fi
fi

# The admin seeder refuses to create an account for a blank, weak or short
# password, so settle this before seeding rather than after.
GENERATED_ADMIN_PASSWORD=""
if env_blank ADMIN_PASSWORD; then
    if confirm "ADMIN_PASSWORD is blank — generate a strong one and write it to .env?" y; then
        GENERATED_ADMIN_PASSWORD="$(random_secret 18)"
        env_set ADMIN_PASSWORD "$GENERATED_ADMIN_PASSWORD"
        ok "Generated ADMIN_PASSWORD"
    else
        warn "ADMIN_PASSWORD is blank — the seeder will skip creating the admin account."
    fi
else
    ADMIN_PASSWORD_VALUE="$(env_get ADMIN_PASSWORD)"
    if [ "${#ADMIN_PASSWORD_VALUE}" -lt 12 ]; then
        warn "ADMIN_PASSWORD is shorter than 12 characters — the seeder will refuse it."
    else
        ok "ADMIN_PASSWORD is set"
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5. Front-end assets
# ─────────────────────────────────────────────────────────────────────────────

step "Checking front-end assets"

if [ "$SKIP_NPM" = "1" ]; then
    info "Skipped (--skip-npm)"
elif [ ! -f package.json ]; then
    info "No package.json — this project has no front-end build"
elif ! command -v npm >/dev/null 2>&1; then
    warn "npm is not installed — skipping the asset build. Install Node 18+ from https://nodejs.org (or: brew install node)."
else
    ok "Node $(node -v 2>/dev/null || echo '?'), npm $(npm -v)"

    # npm is loud: audit tables, funding pitches, deprecation notices from
    # transitive packages nobody here chose. None of it is actionable during a
    # setup run, and a wall of red "npm error" makes a working install look
    # broken — so the output is held back and printed only if it actually fails.
    NPM_LOG="$(mktemp "${TMPDIR:-/tmp}/npm.XXXXXX")"

    npm_run_quietly() {
        if npm "$@" --no-audit --no-fund >"$NPM_LOG" 2>&1; then
            return 0
        fi
        return 1
    }

    npm_failed() {
        printf '\n'
        cat "$NPM_LOG"
        rm -f "$NPM_LOG"
        die "$1"
    }

    if [ ! -d node_modules ]; then
        info "Installing node_modules…"

        # `npm ci` is the right command — exact, reproducible, from the lock.
        # But it refuses outright when package.json and package-lock.json have
        # drifted apart, which happens whenever a dependency was added without
        # committing the regenerated lock. That refusal is not a reason to stop:
        # `npm install` reconciles them.
        if [ -f package-lock.json ] && npm_run_quietly ci; then
            ok "node_modules installed from package-lock.json"
        else
            if [ -f package-lock.json ]; then
                info "package-lock.json is out of step with package.json — installing from package.json instead"
                note "Run 'npm install --package-lock-only' and commit the lock file to make 'npm ci' work again."
            fi
            npm_run_quietly install || npm_failed "npm install failed. Its output is above."
            ok "node_modules installed"
        fi
    elif [ -f package-lock.json ] && [ package-lock.json -nt node_modules ]; then
        info "package-lock.json changed — reinstalling node_modules…"
        npm_run_quietly install || npm_failed "npm install failed. Its output is above."
        ok "node_modules refreshed"
    else
        ok "node_modules is present"
    fi

    # Some of these projects copy webfonts into public/ as a separate script.
    if "$PHP_BIN" -r '$p = json_decode(file_get_contents("package.json"), true); exit(isset($p["scripts"]["fonts"]) ? 0 : 1);' 2>/dev/null; then
        npm run fonts >/dev/null 2>&1 && ok "Copied webfonts into public/" || info "npm run fonts did not complete (not fatal)"
    fi

    if "$PHP_BIN" -r '$p = json_decode(file_get_contents("package.json"), true); exit(isset($p["scripts"]["build"]) ? 0 : 1);' 2>/dev/null; then
        if [ "$FORCE_BUILD" = "1" ] || [ ! -f public/build/manifest.json ]; then
            info "Running npm run build…"
            npm run build >"$NPM_LOG" 2>&1 || npm_failed "npm run build failed. Its output is above."
            ok "Built front-end assets into public/build ($(find public/build -type f 2>/dev/null | wc -l | tr -d ' ') files)"
        else
            ok "public/build/manifest.json exists (use --build to rebuild)"
            note "For live reloading while you work, run: npm run dev"
        fi
    else
        info "package.json has no \"build\" script — nothing to compile"
    fi

    rm -f "$NPM_LOG"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 6. Writable paths and the storage symlink
# ─────────────────────────────────────────────────────────────────────────────

step "Checking writable paths"

ensure_runtime_dirs

for dir in $RUNTIME_DIRS; do
    [ -w "$dir" ] || die "$dir is not writable. Fix with: chmod -R ug+rwX storage bootstrap/cache"
done
ok "storage/ and bootstrap/cache exist and are writable"

# public/storage is a real directory, not a symlink.
#
# The public disk writes straight into it (config/filesystems.php), because
# `symlink()` is disabled on a lot of shared hosting and a copied project
# carries a link holding the absolute path of the machine that made it — it
# passes -L, resolves to nothing, and every upload 404s silently.
#
# A link left over from before that change shadows the real directory, so it is
# removed. Nothing is lost with it: a symlink holds no files.
if [ -L public/storage ]; then
    info "public/storage is a leftover symlink — replacing it with a real directory"
    rm -f public/storage
fi

mkdir -p public/storage

if [ -w public/storage ]; then
    ok "public/storage exists and is writable"
else
    warn "public/storage is not writable — uploads will fail. Fix with: chmod -R ug+rwX public/storage"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 7. Database
# ─────────────────────────────────────────────────────────────────────────────

step "Checking the database"

DB_CONNECTION="$(env_get DB_CONNECTION || echo mysql)"
DB_HOST="$(env_get DB_HOST || echo 127.0.0.1)"
DB_PORT="$(env_get DB_PORT || echo 3306)"
DB_DATABASE="$(env_get DB_DATABASE || echo '')"
DB_USERNAME="$(env_get DB_USERNAME || echo '')"
DB_PASSWORD="$(env_get DB_PASSWORD || echo '')"
DB_SOCKET="$(env_get DB_SOCKET || echo '')"

DB_READY=0

if [ "$SKIP_DB" = "1" ]; then
    info "Skipped (--skip-db)"
elif [ "$DB_CONNECTION" = "sqlite" ]; then
    SQLITE_PATH="$DB_DATABASE"
    [ -n "$SQLITE_PATH" ] || SQLITE_PATH="database/database.sqlite"
    if [ ! -f "$SQLITE_PATH" ]; then
        mkdir -p "$(dirname "$SQLITE_PATH")"
        : > "$SQLITE_PATH"
        ok "Created the SQLite file at $SQLITE_PATH"
    else
        ok "SQLite file exists at $SQLITE_PATH"
    fi
    DB_READY=1
else
    # Probe with plain PDO rather than the mysql client: PDO is guaranteed
    # present (we checked the extension) and the client often is not.
    info "Connecting to $DB_CONNECTION://$DB_USERNAME@$DB_HOST:$DB_PORT/$DB_DATABASE"

    db_probe() {
        DBP_CONNECTION="$DB_CONNECTION" DBP_HOST="$DB_HOST" DBP_PORT="$DB_PORT" \
        DBP_DATABASE="$DB_DATABASE" DBP_USERNAME="$DB_USERNAME" DBP_PASSWORD="$DB_PASSWORD" \
        DBP_SOCKET="$DB_SOCKET" DBP_CREATE="${1:-0}" "$PHP_BIN" <<'PHP'
<?php
// Prints one machine-readable line: OK | CREATED | NO_DATABASE | FAIL:<message>
$driver   = getenv('DBP_CONNECTION') ?: 'mysql';
$host     = getenv('DBP_HOST') ?: '127.0.0.1';
$port     = getenv('DBP_PORT') ?: ($driver === 'pgsql' ? '5432' : '3306');
$database = getenv('DBP_DATABASE') ?: '';
$username = getenv('DBP_USERNAME') ?: '';
$password = getenv('DBP_PASSWORD');
$socket   = getenv('DBP_SOCKET') ?: '';
$create   = getenv('DBP_CREATE') === '1';
$password = $password === false ? '' : $password;

if ($database === '') { echo "FAIL:DB_DATABASE is empty in .env\n"; exit; }

$base = $driver === 'pgsql'
    ? "pgsql:host={$host};port={$port};dbname=postgres"
    : ($socket !== '' ? "mysql:unix_socket={$socket}" : "mysql:host={$host};port={$port}");

$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5];

try {
    $pdo = new PDO($base, $username, $password, $options);
} catch (PDOException $e) {
    echo 'FAIL:' . str_replace("\n", ' ', $e->getMessage()) . "\n";
    exit;
}

if ($driver === 'pgsql') {
    $exists = (bool) $pdo->query('SELECT 1 FROM pg_database WHERE datname = ' . $pdo->quote($database))->fetchColumn();
} else {
    $exists = (bool) $pdo->query('SELECT 1 FROM information_schema.schemata WHERE schema_name = ' . $pdo->quote($database))->fetchColumn();
}

if ($exists) { echo "OK\n"; exit; }
if (! $create) { echo "NO_DATABASE\n"; exit; }

try {
    if ($driver === 'pgsql') {
        $pdo->exec('CREATE DATABASE "' . str_replace('"', '', $database) . '"');
    } else {
        $pdo->exec('CREATE DATABASE `' . str_replace('`', '', $database) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    }
    echo "CREATED\n";
} catch (PDOException $e) {
    echo 'FAIL:' . str_replace("\n", ' ', $e->getMessage()) . "\n";
}
PHP
    }

    PROBE="$(db_probe 0 || true)"

    case "$PROBE" in
        OK)
            ok "Connected — the database \`$DB_DATABASE\` exists"
            DB_READY=1
            ;;
        NO_DATABASE)
            # Deliberately info, not warn: on a fresh install the database is
            # *expected* to be missing, and we are about to create it. Warning
            # here left "the database does not exist" in the closing summary of
            # a run that had already created it and seeded it.
            info "The database \`$DB_DATABASE\` does not exist yet"
            if confirm "Create the database \`$DB_DATABASE\` now?" y; then
                PROBE="$(db_probe 1 || true)"
                case "$PROBE" in
                    CREATED) ok "Created \`$DB_DATABASE\` (utf8mb4)"; DB_READY=1 ;;
                    *) warn "Could not create \`$DB_DATABASE\`: ${PROBE#FAIL:}" ;;
                esac
            else
                warn "The database \`$DB_DATABASE\` does not exist and was not created — nothing was migrated."
                note "Create it yourself, then re-run ./scripts/run-local.sh"
            fi
            ;;
        FAIL:*)
            warn "Could not connect: ${PROBE#FAIL:}"
            note "Fix DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD in .env, then re-run ./scripts/run-local.sh"
            note "MAMP listens on port 8889 with DB_SOCKET=/Applications/MAMP/tmp/mysql/mysql.sock; its default user is root/root."
            ;;
        *)
            warn "Unexpected database probe result: $PROBE"
            ;;
    esac
fi

if [ "$DB_READY" = "1" ]; then
    if [ "$FRESH" = "1" ]; then
        if confirm "--fresh will DROP every table in \`$DB_DATABASE\`. Continue?" n; then
            run_artisan migrate:fresh --force || die "migrate:fresh failed."
            ok "Schema rebuilt from scratch"
        else
            die "Aborted."
        fi
    else
        info "Running migrations…"
        run_artisan migrate --force || die "php artisan migrate failed. The error above is from the database."
        ok "Migrations are up to date"
    fi

    if [ "$SKIP_SEED" = "1" ]; then
        info "Seeding skipped (--skip-seed)"
    else
        info "Seeding reference data…"
        # The core seeders are idempotent (updateOrCreate on natural keys), so
        # this is safe on every run.
        run_artisan db:seed --force || die "php artisan db:seed failed."
        ok "Seeded"

        if [ "$DEMO" = "1" ]; then
            run_artisan db:seed --class=DemoSeeder --force && ok "Seeded demo fixtures" \
                || warn "DemoSeeder failed or does not exist in this project."
        fi
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 8. Firebase
# ─────────────────────────────────────────────────────────────────────────────

step "Checking Firebase"

FIREBASE_CREDENTIALS="$(env_get FIREBASE_CREDENTIALS || echo '')"

if [ ! -d vendor/kreait ] && [ ! -f config/firebase.php ]; then
    info "This project does not use Firebase"
elif [ -z "$FIREBASE_CREDENTIALS" ]; then
    info "FIREBASE_CREDENTIALS is blank — Firebase features are off"
    note "Firebase is optional locally. Mobile sign-in answers 503 FIREBASE_NOT_CONFIGURED and push sends are skipped."
    note "To enable it: download a service-account key (Firebase console > Project settings > Service accounts),"
    note "  save it as storage/firebase/service-account.json, then set FIREBASE_CREDENTIALS=storage/firebase/service-account.json"
else
    FIREBASE_PATH="$FIREBASE_CREDENTIALS"
    case "$FIREBASE_PATH" in /*) ;; *) FIREBASE_PATH="$PROJECT_ROOT/$FIREBASE_CREDENTIALS" ;; esac

    if [ ! -f "$FIREBASE_PATH" ]; then
        warn "FIREBASE_CREDENTIALS points at $FIREBASE_CREDENTIALS, which does not exist. Firebase calls will throw."
    else
        FB_RESULT="$(FB_PATH="$FIREBASE_PATH" "$PHP_BIN" <<'PHP'
<?php
$path = getenv('FB_PATH');
$json = json_decode((string) @file_get_contents($path), true);
if (! is_array($json)) { echo "FAIL:not valid JSON\n"; exit; }
$missing = array_values(array_diff(['type', 'project_id', 'private_key', 'client_email'], array_keys($json)));
if ($missing) { echo 'FAIL:missing key(s) ' . implode(', ', $missing) . "\n"; exit; }
if (($json['type'] ?? '') !== 'service_account') { echo "FAIL:type is not \"service_account\"\n"; exit; }
echo 'OK:' . $json['project_id'] . "\n";
PHP
        )"
        case "$FB_RESULT" in
            OK:*) ok "Service account is valid — project ${FB_RESULT#OK:}" ;;
            *)    warn "Firebase service account at $FIREBASE_CREDENTIALS is unusable: ${FB_RESULT#FAIL:}" ;;
        esac
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 9. Optional integrations
# ─────────────────────────────────────────────────────────────────────────────

step "Checking optional integrations"

check_optional() {
    local key="$1" label="$2"
    if grep -qE "^[[:space:]]*${key}=" "$ENV_FILE" 2>/dev/null; then
        if env_blank "$key"; then
            info "$label — off (${key} is blank)"
        else
            ok "$label — configured"
        fi
    fi
}

# check_optional stays quiet about a key this project does not declare, so the
# list can name optional keys without claiming any of them are required.
check_optional ONESIGNAL_APP_ID          "OneSignal push (iOS)"
check_optional REVENUECAT_WEBHOOK_SECRET "RevenueCat webhook"
check_optional MIDTRANS_SERVER_KEY       "Midtrans (regional payments)"
check_optional DUITKU_API_KEY            "Duitku (regional payments)"
check_optional MEDIA_CDN_BASE_URL        "Media CDN"
check_optional PAYMENTS_DEFAULT          "Web card checkout provider"
check_optional STRIPE_SECRET             "Stripe (web card checkout)"
check_optional PADDLE_API_KEY            "Paddle (web card checkout)"
check_optional POLAR_SECRET              "Polar (web card checkout)"
check_optional CREEM_API_KEY             "Creem (web card checkout)"
check_optional DODO_PAYMENTS_API_KEY     "Dodo Payments (web card checkout)"
check_optional LEMONSQUEEZY_KEY          "Lemon Squeezy (web card checkout)"
check_optional PUSHER_APP_KEY            "Pusher (instant checkout confirmation)"
check_optional QSTASH_TOKEN              "Upstash QStash queue"
check_optional MAIL_USERNAME             "Outgoing mail (SMTP)"
check_optional GOOGLE_CLIENT_ID          "Google social login"
check_optional FACEBOOK_CLIENT_ID        "Facebook social login"

# ─────────────────────────────────────────────────────────────────────────────
# 10. Wrap up
# ─────────────────────────────────────────────────────────────────────────────

step "Clearing caches"
run_artisan optimize:clear >/dev/null 2>&1 && ok "Config, route, view and event caches cleared" \
    || info "optimize:clear reported an issue (harmless if the database is not up yet)"

printf '\n%s%s  Done.%s\n' "$C_BOLD" "$C_GREEN" "$C_RESET"

if [ -n "$WARNINGS" ]; then
    printf '\n%s  Warnings%s\n' "$C_BOLD$C_YELLOW" "$C_RESET"
    printf '%s' "$WARNINGS" | while IFS= read -r line; do
        [ -n "$line" ] && printf '    %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$line"
    done
fi

if [ -n "$NOTES" ]; then
    printf '\n%s  Notes%s\n' "$C_BOLD" "$C_RESET"
    printf '%s' "$NOTES" | while IFS= read -r line; do
        [ -n "$line" ] && printf '    %s·%s %s\n' "$C_DIM" "$C_RESET" "$line"
    done
fi

if [ -n "$GENERATED_ADMIN_PASSWORD" ]; then
    printf '\n%s  Admin account%s\n' "$C_BOLD" "$C_RESET"
    printf '    email     %s\n' "$(env_get ADMIN_EMAIL || echo '(see ADMIN_EMAIL in .env)')"
    printf '    password  %s%s%s\n' "$C_BOLD" "$GENERATED_ADMIN_PASSWORD" "$C_RESET"
    printf '    %sSaved to .env as ADMIN_PASSWORD. This is the only time it is printed.%s\n' "$C_DIM" "$C_RESET"
fi

printf '\n%s  Start the app%s\n' "$C_BOLD" "$C_RESET"
printf '    %s artisan serve        %s# http://127.0.0.1:8000%s\n' "$PHP_BIN" "$C_DIM" "$C_RESET"
if [ -f package.json ] && [ "$SKIP_NPM" != "1" ]; then
    printf '    npm run dev              %s# hot reload, in a second terminal%s\n' "$C_DIM" "$C_RESET"
fi
printf '\n'
