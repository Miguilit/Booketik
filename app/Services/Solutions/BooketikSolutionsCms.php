<?php

declare(strict_types=1);

namespace App\Services\Solutions;

use App\Models\BooketikSolutionsPage;
use App\Models\BooketikSolutionsRevision;
use App\Support\Solutions\SolutionsContentSchema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;
use RuntimeException;

/**
 * A versioned editorial companion to Content -> Pages.
 * No subscription, payment, fee or seat-quota mutation is possible here.
 * No routes call this service until a separate integration release.
 */
final class BooketikSolutionsCms
{
    public function latest(string $pageKey = 'solutions'): ?BooketikSolutionsRevision
    {
        $page = BooketikSolutionsPage::query()->where('page_key', $pageKey)->first();
        return $page?->revisions()->orderByDesc('version')->first();
    }

    public function saveDraft(array $data, int $actorId, int $expectedVersion, string $pageKey = 'solutions'): BooketikSolutionsRevision
    {
        if ($pageKey !== 'solutions' || $actorId < 1 || $expectedVersion < 0) {
            throw new InvalidArgumentException('Invalid page key, actor or version.');
        }
        $payload = SolutionsContentSchema::draft($data);

        return DB::transaction(function () use ($pageKey, $payload, $actorId, $expectedVersion) {
            // The row lock prevents concurrent editors from publishing stale content.
            // Page creation is explicit: the admin should initialise it once in R1C.
            $page = BooketikSolutionsPage::query()->where('page_key', $pageKey)->lockForUpdate()->first();
            if (!$page) {
                if ($expectedVersion !== 0) throw new RuntimeException('STALE_EDITOR_VERSION');
                $page = BooketikSolutionsPage::query()->create(['page_key' => $pageKey]);
            }
            $current = (int) ($page->revisions()->max('version') ?: 0);
            if ($current !== $expectedVersion) throw new RuntimeException('STALE_EDITOR_VERSION');
            return $page->revisions()->create([
                'version' => $current + 1,
                'schema_version' => 1,
                'payload' => $payload,
                'created_by' => $actorId,
                'created_at' => now(),
            ]);
        }, 3);
    }

    public function publish(int $revisionId, int $expectedLatestVersion, int $actorId, string $pageKey = 'solutions'): BooketikSolutionsRevision
    {
        if ($pageKey !== 'solutions' || $revisionId < 1 || $expectedLatestVersion < 1 || $actorId < 1) {
            throw new InvalidArgumentException('Invalid publishing parameters.');
        }
        return DB::transaction(function () use ($pageKey, $revisionId, $expectedLatestVersion, $actorId) {
            $page = BooketikSolutionsPage::query()->where('page_key', $pageKey)->lockForUpdate()->firstOrFail();
            $latest = (int) ($page->revisions()->max('version') ?: 0);
            if ($latest !== $expectedLatestVersion) throw new RuntimeException('STALE_EDITOR_VERSION');
            $revision = $page->revisions()->whereKey($revisionId)->firstOrFail();
            SolutionsContentSchema::assertPublishable($revision->payload);
            $page->forceFill(['published_revision_id' => $revision->id, 'published_by' => $actorId, 'published_at' => now()])->save();
            return $revision;
        }, 3);
    }

    /**
     * Public reads fail closed, even if a caller inadvertently invokes this service.
     * Pricing remains empty until a separate, authoritative per-event billing engine exists.
     */
    public function publishedProjection(string $locale = 'en', string $pageKey = 'solutions'): ?array
    {
        // BOOKETIK_SOLUTIONS_R4: independently enable the published editorial vitrine.
        // Preserve legacy commercial/private-preview boundaries while checkout stays OFF.
        if ($pageKey !== 'solutions'
            || config('booketik_solutions.presentation_public_enabled') !== true
            || config('booketik_solutions.public_enabled') !== false
            || config('booketik_solutions.pricing_public_enabled') !== false
            || config('booketik_solutions.commercial_checkout_enabled') !== false
            || config('booketik_solutions.miguil_pay_enabled') !== false) return null;
        if (!Schema::hasTable('booketik_solutions_pages') || !Schema::hasTable('booketik_solutions_revisions')) return null;
        $page = BooketikSolutionsPage::query()->where('page_key', $pageKey)->first();
        if (!$page || !$page->published_revision_id || !$page->published_at) return null;
        $revision = $page->revisions()->whereKey($page->published_revision_id)->first();
        if (!$revision || $revision->schema_version !== 1) return null;
        $data = SolutionsContentSchema::assertPublishable($revision->payload);
        $sections = array_map(function (array $section) {
            $content = $section['content'];
            if (isset($content['ctas'])) $content['ctas'] = array_map([self::class, 'resolveCta'], $content['ctas']);
            if (isset($content['cta'])) $content['cta'] = self::resolveCta($content['cta']);
            $section['content'] = $content;
            return $section;
        }, $data['sections']);
        $short = strtolower(explode('-', str_replace('_', '-', $locale))[0]);
        return [
            'schema_version' => 1,
            'publication_status' => 'published',
            'locale' => in_array($short, SolutionsContentSchema::LOCALES, true) ? $short : 'en',
            'revision' => $revision->version,
            'sections' => $sections,
            'seo' => [
                'title' => SolutionsContentSchema::englishFallback($data['seo']['title'] ?? [], $short),
                'description' => SolutionsContentSchema::englishFallback($data['seo']['description'] ?? [], $short),
            ],
            'offers' => [], // R1B: NEVER invent or publish commercial prices.
        ];
    }

    /** An editable CTA key is not a commercial permission; only a verified path can be enabled. */
    private static function resolveCta(array $cta): array
    {
        $action = $cta['action_key'];
        return [
            'label' => $cta['label'],
            // R4 pre-launch: CTAs remain visible but disabled, including price navigation.
            'enabled' => false,
            'href' => null,
        ];
    }
}
