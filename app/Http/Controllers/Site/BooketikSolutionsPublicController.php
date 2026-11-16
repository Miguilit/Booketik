<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Services\Solutions\BooketikSolutionsCms;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/** BOOKETIK R4: editorial presentation only, never a checkout or private draft. */
final class BooketikSolutionsPublicController extends Controller
{
    public function show(Request $request, string $locale, BooketikSolutionsCms $cms): Response
    {
        abort_unless(in_array($locale, ['fr', 'nl', 'en'], true), 404);
        abort_unless($request->routeIs('site.solutions.show'), 404);

        $page = $cms->publishedProjection($locale);
        abort_unless(is_array($page) && ($page['publication_status'] ?? null) === 'published'
            && ($page['offers'] ?? null) === [], 404);

        return Inertia::render('Site/SolutionsPublic', [
            'solutionsPublic' => ['page' => $page],
        ])->toResponse($request);
    }
}
