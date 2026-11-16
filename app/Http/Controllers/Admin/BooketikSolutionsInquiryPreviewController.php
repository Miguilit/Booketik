<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\OrganizerRole;
use App\Http\Controllers\Controller;
use App\Models\OrganizerMember;
use App\Services\Solutions\BooketikInquiryEventChoices;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * R1N2J: read-only Superadmin form preview. No public route, no lead write,
 * no payment/checkout, and no change to organizer/ticket entitlements.
 * Authorization: the named route lives inside existing auth + staff + admin groups.
 */
final class BooketikSolutionsInquiryPreviewController extends Controller
{
    public function show(Request $request, string $locale, BooketikInquiryEventChoices $choices): Response
    {
        abort_unless(in_array($locale, ['fr', 'nl', 'en'], true), 404);
        abort_unless($request->routeIs('admin.solutions.inquiry-preview'), 404);
        abort_unless(config('booketik_solutions.admin_enabled') === true, 404);
        abort_unless(config('booketik_solutions_inbox.enabled') === true, 404);
        abort_unless(config('booketik_solutions.public_enabled') === false, 409);
        abort_unless(config('booketik_solutions.commercial_checkout_enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiry_page.enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiries.enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiries.quote_enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiries.discovery_review_enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiries.payment_execution_enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiries.mollie_connect_enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiries.miguil_pay_enabled') === false, 409);
        abort_unless($request->user() !== null, 403);

        $kind = (string) $request->query('kind', 'quote');
        abort_unless(in_array($kind, ['quote', 'discovery_review'], true), 422);
        $eventId = (string) $request->query('event_id', '');
        abort_unless($eventId === '' || Str::isUuid($eventId), 422);
        $offerCode = (string) $request->query('offer_code', '');
        abort_unless($offerCode === '' || (bool) preg_match('/^[a-z][a-z0-9_\-]{0,47}$/D', $offerCode), 422);

        // Only the viewing administrator's own eligible organizer memberships.
        // These are read-only ORM SELECTs. Never fetch or expose another organizer's data.
        $orgs = OrganizerMember::query()
            ->with('organizer')
            ->where('user_id', $request->user()->id)
            ->whereIn('role', [OrganizerRole::Owner->value, OrganizerRole::Admin->value])
            ->limit(200)->get()
            ->filter(fn ($m) => $m->organizer !== null && $m->organizer->isActive())
            ->map(fn ($m) => ['id' => (string) $m->organizer->id, 'name' => (string) $m->organizer->name])
            ->unique('id')->values()->all();

        $page = Inertia::render('Site/SolutionsInquiry', [
            'inquiryForm' => [
                'locale' => $locale,
                'kind' => $kind,
                'organizers' => $orgs,
                'events' => $choices->forOrganizers($orgs),
                'previewMode' => true,
                'backUrl' => route('admin.solutions.preview', ['locale' => $locale]),
                'eventId' => $eventId,
                'offerCode' => $kind === 'discovery_review' ? 'decouverte' : $offerCode,
                'requestKey' => (string) Str::uuid(),
                'submissionUrl' => route('site.solutions.inquiries.store', ['locale' => $locale]),
                // Hard-coded FALSE: cannot submit even if an unrelated gate drifts.
                'submissionEnabled' => false,
            ],
        ]);
        $response = $page->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        return $response;
    }
}
