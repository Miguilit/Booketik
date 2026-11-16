<?php

declare(strict_types=1);

/*
 | php scripts/i18n-check-locale.php <locale> [--quiet]
 |
 | Compares resources/lang/<locale>.json and resources/lang/<locale>/{group}.php
 | with English: every key present and non-empty, no extra keys, and the same
 | placeholders (`:name` in UI strings, `{{ $name }}` in email templates, the
 | number of `|` choices in a pluralised string). Exit 1 on any problem.
 | tests/Feature/LocalizationCompletenessTest runs the same rules for every locale.
 */

$root = dirname(__DIR__);
$locale = $argv[1] ?? null;
$quiet = in_array('--quiet', $argv, true);

if ($locale === null) {
    fwrite(STDERR, "usage: php scripts/i18n-check-locale.php <locale>\n");
    exit(2);
}

const GROUPS = ['dashboard', 'messages', 'payments', 'media', 'emails'];

function placeholders(string $text): array
{
    preg_match_all('/\{\{\s*\$([a-z_]+)\s*\}\}|(?<![\w:]):([a-z_][a-z0-9_]*)/i', $text, $m);
    $names = array_filter(array_merge($m[1], $m[2]));
    sort($names);

    return array_values(array_unique($names));
}

function flatten(array $a, string $prefix = ''): array
{
    $out = [];
    foreach ($a as $k => $v) {
        $key = $prefix === '' ? (string) $k : $prefix.'.'.$k;
        if (is_array($v)) {
            $out += flatten($v, $key);
        } else {
            $out[$key] = (string) $v;
        }
    }

    return $out;
}

/** How many `|` forms a pluralised string has in a language (Laravel's MessageSelector rules). */
function pluralForms(string $locale): array
{
    return match ($locale) {
        'ar' => [6],
        'ru' => [3],
        'ja', 'ko', 'zh', 'tr' => [1, 2],
        default => [2],
    };
}

function compare(string $label, array $en, array $tr, string $locale = 'en'): array
{
    $problems = [];
    foreach ($en as $key => $text) {
        if (! array_key_exists($key, $tr) || trim((string) $tr[$key]) === '') {
            $problems[] = "{$label}: missing ".json_encode($key, JSON_UNESCAPED_UNICODE);
            continue;
        }
        if (placeholders($text) !== placeholders((string) $tr[$key])) {
            $problems[] = "{$label}: placeholders differ for ".json_encode($key, JSON_UNESCAPED_UNICODE).' — en '.json_encode(placeholders($text)).' vs '.json_encode(placeholders((string) $tr[$key]));
        }
        if (preg_match('/^[^|<]+(\|[^|]+)+$/', $text) && ! in_array(substr_count((string) $tr[$key], '|') + 1, $locale === 'en' ? [substr_count($text, '|') + 1] : pluralForms($locale), true)) {
            $problems[] = "{$label}: plural forms for ".json_encode($key, JSON_UNESCAPED_UNICODE).' must be '.implode(' or ', pluralForms($locale)).' |-separated forms';
        }
    }
    foreach (array_diff_key($tr, $en) as $key => $_) {
        $problems[] = "{$label}: extra key ".json_encode($key, JSON_UNESCAPED_UNICODE);
    }

    return $problems;
}

$problems = [];
$en = json_decode((string) file_get_contents("{$root}/resources/lang/en.json"), true);
$path = "{$root}/resources/lang/{$locale}.json";
$tr = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
if (! is_array($tr)) {
    $problems[] = "{$locale}.json: missing or not valid JSON";
    $tr = [];
}
$problems = array_merge($problems, compare("{$locale}.json", $en, $tr, $locale));

foreach (GROUPS as $group) {
    $enGroup = flatten(require "{$root}/resources/lang/en/{$group}.php");
    $file = "{$root}/resources/lang/{$locale}/{$group}.php";
    $trGroup = is_file($file) ? flatten(require $file) : [];
    $problems = array_merge($problems, compare("{$locale}/{$group}.php", $enGroup, $trGroup, $locale));
}

if (! $quiet) {
    foreach (array_slice($problems, 0, 60) as $p) {
        echo $p, "\n";
    }
}
echo count($problems) === 0 ? "{$locale}: OK\n" : "{$locale}: ".count($problems)." problem(s)\n";
exit(count($problems) === 0 ? 0 : 1);
