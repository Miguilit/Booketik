<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Solutions\BooketikSolutionsCms;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use JsonException;
use RuntimeException;
use Throwable;
use Illuminate\View\View;

/** Staged controller: no routes or sidebar entries are registered in R1B. */
final class BooketikSolutionsEditorController extends Controller
{
    public function edit(BooketikSolutionsCms $cms): View
    {
        $this->assertRoutedAdmin();
        $latest = $cms->latest();
        $fallback = ['schema_version' => 1, 'seo' => [], 'sections' => []];
        return view('admin.solutions.editor', [
            'revision' => $latest,
            'currentVersion' => $latest?->version ?? 0,
            'json' => json_encode($latest?->payload ?? $fallback, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }


    /**
     * R1H: last saved revision, never unsaved browser state. Entire route is
     * protected by the existing auth -> staff -> admin route boundaries.
     * This deliberately does not invoke the public_enabled projection.
     */
    public function preview(Request $request, BooketikSolutionsCms $cms): \Symfony\Component\HttpFoundation\Response
    {
        $this->assertRoutedAdmin();
        abort_unless(config('booketik_solutions.public_enabled') === false, 404);
        $revision = $cms->latest();
        abort_unless($revision && (int) $revision->schema_version === 1, 404, 'Enregistrez un brouillon avant la prévisualisation.');

        // The new React page is only available after the operator rebuilds Vite.
        // Without it, fail closed instead of breaking the visitor bundle.
        $manifest = public_path('build/manifest.json');
        $assetKey = 'resources/js/Themes/civic/Pages/Site/SolutionsPreview.jsx';
        $assets = is_file($manifest) ? json_decode((string) file_get_contents($manifest), true) : null;
        abort_unless(is_array($assets) && isset($assets[$assetKey]['file']), 503, 'Aperçu React non compilé : reconstruire les assets Vite.');

        $document = \App\Support\Solutions\SolutionsContentSchema::draft((array) $revision->payload);
        $rawLocale = strtolower(explode('-', str_replace('_', '-', (string) app()->getLocale()))[0]);
        $locale = in_array($rawLocale, ['fr', 'nl', 'en'], true) ? $rawLocale : 'en';

        // R1N1: ONLY a GET to the existing organizer dashboard can be linked.
        // Not an offer purchase, not a claim approval, not account creation.
        $dashboardPath = null;
        if (config('booketik_solutions.commercial_preview_navigation_enabled') === true
            && config('booketik_solutions.commercial_checkout_enabled') === false
            && config('booketik_solutions.miguil_pay_enabled') === false
            && config('booketik_solutions.public_enabled') === false
            && \Illuminate\Support\Facades\Route::has('site.organizer.dashboard.home')) {
            $dashboardPath = route('site.organizer.dashboard.home', ['locale' => $locale], false);
        }
        $sections = [];
        foreach ($document['sections'] as $section) {
            $content = $section['content'];
            $resolve = static fn (array $cta): array => \App\Support\Solutions\SolutionsCommercialActionPolicy::preview(
                $cta, $dashboardPath
            );
            if (isset($content['ctas'])) $content['ctas'] = array_map($resolve, $content['ctas']);
            if (isset($content['cta'])) $content['cta'] = $resolve($content['cta']);
            $section['content'] = $content;
            $sections[] = $section;
        }
        $response = \Inertia\Inertia::render('Site/SolutionsPreview', [
            'solutionsPreview' => [
                'revision' => (int) $revision->version,
                'editUrl' => route('admin.solutions.edit', ['locale' => app()->getLocale()]),
                'page' => [
                    'schema_version' => 1,
                    'publication_status' => 'preview',
                    'locale' => $locale,
                    'sections' => $sections,
                    // Approved catalog offers ONLY, and only if R1M private preview gate is explicitly enabled.
                    'offers' => app(\App\Services\Solutions\BooketikEventServiceCatalog::class)->previewOffers($locale),
                ],
            ],
        ])->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store, no-cache, max-age=0');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return $response;
    }

    public function draft(Request $request, BooketikSolutionsCms $cms): RedirectResponse
    {
        $this->assertRoutedAdmin();
        $request->validate([
            'expected_version' => 'required|integer|min:0',
            'document' => 'required|string|max:131072',
        ]);
        try {
            $payload = json_decode((string) $request->input('document'), true, 128, JSON_THROW_ON_ERROR);
            if (!is_array($payload)) throw new JsonException('Document must be an object.');
            $new = $cms->saveDraft($payload, (int) Auth::id(), (int) $request->input('expected_version'));
            return back()->with('success', 'Draft revision '.$new->version.' saved. Nothing published.');
        } catch (JsonException | \InvalidArgumentException | RuntimeException $e) {
            throw ValidationException::withMessages(['document' => $e->getMessage()]);
        }
    }

    public function publish(Request $request, BooketikSolutionsCms $cms): RedirectResponse
    {
        $this->assertRoutedAdmin();
        $validated = $request->validate([
            'revision_id' => 'required|integer|min:1',
            'expected_version' => 'required|integer|min:1',
        ]);
        try {
            $cms->publish((int) $validated['revision_id'], (int) $validated['expected_version'], (int) Auth::id());
            return back()->with('success', 'Editorial revision published internally. Public Solutions remains gated OFF.');
        } catch (\InvalidArgumentException | RuntimeException $e) {
            throw ValidationException::withMessages(['publication' => $e->getMessage()]);
        }
    }

    private function assertRoutedAdmin(): void
    {
        // Explicit second boundary; R1C must additionally register routes inside existing admin middleware.
        abort_unless(config('booketik_solutions.admin_enabled') === true && Auth::check(), 404);
    }
}
