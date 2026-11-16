<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Enums\OrganizerRole;
use App\Http\Controllers\Controller;
use App\Models\OrganizerMember;
use App\Services\Solutions\BooketikInquiryEventChoices;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/** Private, authenticated frontend; cannot activate ticket sales or payments. */
final class BooketikSolutionsInquiryPageController extends Controller
{
    public function show(Request $request, string $locale, BooketikInquiryEventChoices $choices): Response
    {
        abort_unless(in_array($locale, ['fr', 'nl', 'en'], true), 404);
        abort_unless($request->routeIs('site.solutions.inquiries.create'), 404);
        abort_unless(config('booketik_solutions_inquiry_page.enabled') === true, 404);
        abort_unless(config('booketik_solutions.public_enabled') === false, 409);
        abort_unless(config('booketik_solutions.commercial_checkout_enabled') === false, 409);
        abort_unless(config('booketik_solutions_inquiries.payment_execution_enabled') === false, 409);
        abort_unless($request->user()?->email_verified_at !== null, 403);

        $kind = (string) $request->query('kind', 'quote');
        abort_unless(in_array($kind, ['quote', 'discovery_review'], true), 422);
        $eventId = (string) $request->query('event_id', '');
        abort_unless($eventId === '' || Str::isUuid($eventId), 422);
        $offerCode = (string) $request->query('offer_code', '');
        abort_unless($offerCode === '' || (bool) preg_match('/^[a-z][a-z0-9_\-]{0,47}$/D', $offerCode), 422);

        $orgs = OrganizerMember::query()
            ->with('organizer')
            ->where('user_id', $request->user()->id)
            ->whereIn('role', [OrganizerRole::Owner->value, OrganizerRole::Admin->value])
            ->limit(200)
            ->get()
            ->filter(fn ($m) => $m->organizer !== null && $m->organizer->isActive())
            ->map(fn ($m) => ['id' => (string) $m->organizer->id, 'name' => (string) $m->organizer->name])
            ->unique('id')->values()->all();

        return Inertia::render('Site/SolutionsInquiry', [
            'inquiryForm' => [
                'locale' => $locale,
                'kind' => $kind,
                'organizers' => $orgs,
                'events' => $choices->forOrganizers($orgs),
                'previewMode' => false,
                'backUrl' => '/'.$locale.'/organizer/dashboard',
                'eventId' => $eventId,
                'offerCode' => $kind === 'discovery_review' ? 'decouverte' : $offerCode,
                'requestKey' => (string) Str::uuid(),
                'submissionUrl' => route('site.solutions.inquiries.store', ['locale' => $locale]),
                'submissionEnabled' => config('booketik_solutions_inquiries.enabled') === true
                    && config('booketik_solutions_inquiries.'.($kind === 'quote' ? 'quote_enabled' : 'discovery_review_enabled')) === true,
            ],
        ]);
    }
}
