<?php

declare(strict_types=1);

/*
 | php scripts/i18n-scan-admin.php [path …] [--quiet]
 |
 | Likely untranslated English in the admin panel's Blade views: literal text
 | between tags, and literal placeholder / title / aria-label / alt / label
 | attributes, that is not inside `{{ }}`, `{!! !!}`, a directive, a Blade
 | comment, `@php`, `<script>` or `<style>`. A heuristic — it does not read
 | `@php` arrays or inline scripts, so labels built there still need __() by
 | hand. Exit 1 when it finds something. tests/Feature/Admin/AdminTranslationTest
 | runs it over resources/views/admin and resources/views/components/admin.
 |
 | Text that is the same in every language (brand and protocol names, units)
 | goes in ALLOW below; a line that must stay literal can carry
 | `{{-- i18n-ignore --}}`.
 */

$root = dirname(__DIR__);
$quiet = in_array('--quiet', $argv, true);
$paths = array_values(array_filter(array_slice($argv, 1), fn ($a) => ! str_starts_with($a, '--')));
if ($paths === []) {
    $paths = ['resources/views/admin', 'resources/views/components/admin'];
}

/** Text nodes that read the same in every language. Compared after trimming. */
const ALLOW = [
    'Eventgoo', 'Stripe', 'PayPal', 'Paddle', 'Polar', 'Creem', 'Dodo', 'Lemon', 'Lemon Squeezy', 'Midtrans', 'Duitku',
    'RevenueCat', 'Google', 'Apple', 'Facebook', 'GitHub', 'Firebase', 'Mapbox', 'OpenAI', 'Anthropic', 'Gemini', 'SMTP', 'API',
    'URL', 'JSON', 'CSV', 'HTML', 'SVG', 'PNG', 'ICS', 'QR', 'ID', 'UUID', 'SKU', 'SEO', 'OG', 'iOS', 'Android', 'AASA',
    'reCAPTCHA', 'hCaptcha', 'Turnstile', 'Cloudflare', 'S3', 'R2', 'Cloudinary', 'Bunny', 'Wasabi', 'Backblaze', 'MinIO',
    'Telegram', 'WhatsApp', 'Slack', 'Discord', 'Webhook', 'OAuth', 'TOTP', 'Ko-fi', 'X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube',
];

function files(string $path): array
{
    if (is_file($path)) {
        return str_ends_with($path, '.blade.php') ? [$path] : [];
    }
    if (! is_dir($path)) {
        return [];
    }
    $out = [];
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)) as $f) {
        if (str_ends_with($f->getPathname(), '.blade.php')) {
            $out[] = $f->getPathname();
        }
    }
    sort($out);

    return $out;
}

/** Blank out a match but keep its newlines, so line numbers survive. */
function blank(string $src, string $pattern): string
{
    return (string) preg_replace_callback($pattern, fn ($m) => preg_replace('/[^\n]/', ' ', $m[0]), $src);
}

/** @return list<array{int, string}> [line, text] */
function scan(string $src): array
{
    $src = blank($src, '/\{\{--.*?--\}\}/s');
    $src = blank($src, '/@php\b(?!\s*\().*?@endphp/s');
    $src = blank($src, '/<(script|style)\b.*?<\/\1>/is');
    $src = blank($src, '/\{!!.*?!!\}/s');
    $src = blank($src, '/\{\{.*?\}\}/s');
    // Directives with a (balanced, possibly multi-line) argument list.
    $src = blank($src, '/@[a-zA-Z]+\s*(\((?:[^()]++|(?1))*\))/s');
    $src = blank($src, '/@[a-zA-Z]+/');
    // Component tags: their attributes are PHP or props, not copy.
    $src = blank($src, '/<\/?x-(?:[^>"\']|"[^"]*"|\'[^\']*\')*>/s');

    $found = [];
    $lineOf = fn (int $offset) => substr_count(substr($src, 0, $offset), "\n") + 1;

    // Tag attributes first, then remove whole tags so only text nodes remain.
    preg_match_all('/\b(placeholder|title|aria-label|alt|label|data-confirm)\s*=\s*(["\'])(.*?)\2/s', $src, $m, PREG_OFFSET_CAPTURE);
    foreach ($m[3] as [$text, $offset]) {
        if (looksEnglish($text)) {
            $found[] = [$lineOf($offset), trim($text)];
        }
    }

    $text = blank($src, '/<[^>]*>/s');
    preg_match_all('/[^\s][^\n]*/', $text, $m, PREG_OFFSET_CAPTURE);
    foreach ($m[0] as [$chunk, $offset]) {
        if (looksEnglish($chunk)) {
            $found[] = [$lineOf($offset), trim($chunk)];
        }
    }

    usort($found, fn ($a, $b) => $a[0] <=> $b[0]);

    return $found;
}

function looksEnglish(string $text): bool
{
    $text = trim(html_entity_decode($text, ENT_QUOTES | ENT_HTML5));
    if ($text === '' || in_array($text, ALLOW, true)) {
        return false;
    }
    // A word: two or more letters with at least one lowercase — "Save", "e.g.", not "ID", "—", "·", "3".
    if (! preg_match('/\b[A-Za-z]*[a-z][A-Za-z]+\b/', $text)) {
        return false;
    }
    // Leftovers that are code, not copy.
    if (preg_match('/^[\w.\-]+\(|^[$#.]|^(https?:)?\/\/|^[a-z_]+(\.[a-z_]+)+$|^[a-z0-9_\-]+$|=>|;\s*$/', $text)) {
        return false;
    }
    // Every word is an allowed name.
    $words = preg_split('/[\s,\/+&·—–()]+/u', $text, -1, PREG_SPLIT_NO_EMPTY);

    return array_filter($words, fn ($w) => ! in_array($w, ALLOW, true) && preg_match('/[a-z]{2,}/i', $w)) !== [];
}

$total = 0;
foreach ($paths as $p) {
    foreach (files(str_starts_with($p, '/') ? $p : "{$root}/{$p}") as $file) {
        $lines = file($file);
        foreach (scan((string) file_get_contents($file)) as [$line, $text]) {
            if (str_contains($lines[$line - 1] ?? '', 'i18n-ignore')) {
                continue;
            }
            $total++;
            if (! $quiet) {
                echo substr($file, strlen($root) + 1), ":{$line}  {$text}\n";
            }
        }
    }
}

echo $total === 0 ? "No untranslated admin text found.\n" : "{$total} likely untranslated string(s).\n";
exit($total === 0 ? 0 : 1);
