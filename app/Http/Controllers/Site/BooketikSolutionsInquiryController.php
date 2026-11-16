<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Services\Solutions\BooketikCommercialInquiryIntake;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Prepared controller; NO route is registered in R1N2C stage. */
final class BooketikSolutionsInquiryController extends Controller
{
    public function store(Request $request, string $locale, BooketikCommercialInquiryIntake $intake): JsonResponse|RedirectResponse
    {
        abort_unless(in_array($locale, ['fr', 'nl', 'en'], true), 404);
        abort_unless($request->routeIs('site.solutions.inquiries.store'), 404);
        abort_unless($request->user()?->email_verified_at !== null, 403);
        $input = $request->validate([
            'organizer_id' => ['required', 'uuid'],
            'kind' => ['required', Rule::in(['quote', 'discovery_review'])],
            'request_key' => ['required', 'uuid'],
            'event_id' => ['nullable', 'uuid'],
            'offer_code' => ['nullable', 'string', 'max:64', 'regex:/^[a-z][a-z0-9_\-]*$/'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);
        // A review request is never a grant. Prevent a client from changing its offer.
        if ($input['kind'] === 'discovery_review') {
            $input['offer_code'] = 'decouverte';
        }
        $result = $intake->submit($request->user(), $input);
        if ($request->header('X-Inertia') === 'true') {
            return redirect()->route('site.solutions.inquiries.create', [
                'locale' => $locale,
                'kind' => $input['kind'],
            ])->with('success', 'BOOKETIK commercial inquiry received for manual review.');
        }
        return response()->json([
            'state' => 'review_requested',
            'request_id' => $result['id'],
            'replayed' => $result['replayed'],
            'ticket_sales_enabled' => false,
            'payment_created' => false,
        ], $result['replayed'] ? 200 : 202);
    }
}
