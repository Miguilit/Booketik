<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AiController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\BlogController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CheckInController;
use App\Http\Controllers\Admin\CurrencyController;
use App\Http\Controllers\Admin\DeepLinkController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\ExternalEventsController;
use App\Http\Controllers\Admin\ExternalEventClaimController as AdminExternalEventClaimController;
use App\Http\Controllers\Site\ExternalEventClaimController as SiteExternalEventClaimController;
use App\Http\Controllers\Admin\EventReportController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\FeeSettingsController;
use App\Http\Controllers\Admin\FraudController;
use App\Http\Controllers\Admin\HomeSectionController;
use App\Http\Controllers\Admin\IntegrationSettingsController;
use App\Http\Controllers\Admin\MapsSettingsController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\MediaLibraryController;
use App\Http\Controllers\Admin\MediaStorageController;
use App\Http\Controllers\Admin\OrganizerController as AdminOrganizerController;
use App\Http\Controllers\Admin\PayoutController as AdminPayoutController;
use App\Http\Controllers\Admin\PricingController;
use App\Http\Controllers\Admin\RefundController;
use App\Http\Controllers\Admin\SupportTicketController;
use App\Http\Controllers\Admin\TagController;
use App\Http\Controllers\Admin\ThemeController as AdminThemeController;
use App\Http\Controllers\Admin\TicketTypeController;
use App\Http\Controllers\AdminCaptchaController;
use App\Http\Controllers\AdminEmailTemplatesController;
use App\Http\Controllers\AdminGeneralSettingsController;
use App\Http\Controllers\AdminNewsletterController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminSmtpController;
use App\Http\Controllers\AdminSocialLoginController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ChangePasswordController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\Dashboard\AccountPagesController;
use App\Http\Controllers\Dashboard\EventPagesController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DevMediaController;
use App\Http\Controllers\frontend\Auth\AuthenticatedSessionController;
use App\Http\Controllers\frontend\IndexController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\Site\AccountController as SiteAccountController;
use App\Http\Controllers\Site\AccountSecurityController as SiteAccountSecurityController;
use App\Http\Controllers\Site\BlogController as SiteBlogController;
use App\Http\Controllers\Site\CheckoutController as SiteCheckoutController;
use App\Http\Controllers\Site\CheckoutPageController;
use App\Http\Controllers\Site\ConferencePagesController;
use App\Http\Controllers\Site\ConnectOnboardingController;
use App\Http\Controllers\Site\DiscoverController;
use App\Http\Controllers\Site\EventPageController;
use App\Http\Controllers\Site\HomeController as SiteHomeController;
use App\Http\Controllers\Site\NotificationSettingsController;
use App\Http\Controllers\Site\OgImageController;
use App\Http\Controllers\Site\OrganizerPageController;
use App\Http\Controllers\Site\PlusPageController;
use App\Http\Controllers\Site\SitemapController;
use App\Http\Controllers\Site\ThemeSwitchController;
use App\Http\Controllers\Site\TicketsPageController;
use App\Http\Controllers\SocialiteController;
use App\Http\Controllers\TicketFeedbackController;
use App\Http\Controllers\WellKnownController;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PreventRequestForgery;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\ShareLocales;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Two apps share this file, both under a `/{locale}` prefix:
|
|  1. The public website — home, discover, events, tickets, Plus.
|  2. The admin panel — events and their moderation, organizers, members,
|     the home feed, plans and fees, payouts, billing and content.
|
| Staff (admin OR moderator) work the day-to-day screens. Anything that changes
| what the platform charges or pays out lives behind `admin`, so a compromised
| moderator account cannot rewrite the fees.
*/

/*
 | Deep-link association files.
 |
 | **Before the locale group, and outside every middleware that could touch
 | them.** All three of the ways these break are silent:
 |
 |  • a redirect — iOS does not follow one, so the root redirect below or a
 |    locale redirect would read as "verification failed";
 |  • a content type that is not `application/json` — iOS refuses the file;
 |  • a 503 — maintenance mode here stops every App Link on every phone from
 |    opening the app, and Android re-verifies only on install or update, so it
 |    stays broken for existing users until they reinstall.
 |
 | `withoutMiddleware` drops the session, CSRF and Inertia work a static JSON
 | file has no use for. MaintenanceMode is *global* middleware and cannot be
 | stripped here, so it skips this path itself.
 */
Route::get('/.well-known/assetlinks.json', [WellKnownController::class, 'assetLinks'])
    ->withoutMiddleware([
        PreventRequestForgery::class,
        SecurityHeaders::class,
        ShareLocales::class,
        HandleInertiaRequests::class,
    ])
    ->name('well-known.assetlinks');

/*
 | No `.json` extension, deliberately. iOS looks for this exact filename and
 | refuses one with an extension appended.
 */
Route::get('/.well-known/apple-app-site-association', [WellKnownController::class, 'appleAppSiteAssociation'])
    ->withoutMiddleware([
        PreventRequestForgery::class,
        SecurityHeaders::class,
        ShareLocales::class,
        HandleInertiaRequests::class,
    ])
    ->name('well-known.aasa');

Route::get('/', function () {
    return redirect('/'.config('app.locale'));
});

/*
 | Range-capable media, for local development only.
 |
 | `php artisan serve` answers a byte-range request with `200` and the whole
 | file, so a media element served by it reports `seekable = [[0, 0]]` and
 | ignores every seek — a video scrubber cannot be dragged. This routes
 | the same file through Symfony's BinaryFileResponse, which implements ranges.
 | See App\Support\MediaUrl::seekable().
 |
 | Registered **only** in local: in production the web server already does this
 | properly, and a route that streams whole audio files through PHP workers is
 | something you do not want reachable there.
 |
 | Above the `{locale}` group on purpose — that prefix matches a single leading
 | segment, so `/dev-media/...` would otherwise be read as locale `dev-media`.
 */
if (app()->isLocal()) {
    Route::get('/dev-media/{path}', [DevMediaController::class, 'show'])
        ->where('path', '.*')
        ->name('dev-media');
}

/*
 | Social sign-in.
 |
 | Above the `{locale}` group deliberately: that prefix matches one leading
 | segment, and the provider's redirect URI is a fixed absolute URL registered
 | in a Google or Facebook console — it cannot carry whichever locale the
 | viewer happened to be browsing in. `/auth/google` would otherwise be read as
 | locale `auth`.
 |
 | On the `web` stack rather than under `/api`, because Socialite's `state`
 | nonce lives in the session. Throttled because an unauthenticated redirect
 | endpoint that costs the provider a round trip is worth abusing.
 |
 | Not behind `guest`: a signed-in member uses the same round trip to
 | *connect* a provider from the account page (SocialiteController::link()).
 */
Route::middleware(['throttle:oauth'])
    ->controller(SocialiteController::class)
    ->group(function () {
        Route::get('/auth/{provider}/redirect', 'redirect')
            ->whereIn('provider', ['google', 'facebook'])
            ->name('social.redirect');
        // The pre-Eventgoo spelling, kept so old links and bookmarks still work.
        Route::get('/auth/{provider}', 'redirect')
            ->whereIn('provider', ['google', 'facebook'])
            ->name('social.redirect.legacy');
        Route::get('/auth/{provider}/callback', 'callback')
            ->whereIn('provider', ['google', 'facebook'])
            ->name('social.callback');
    });

/*
 | Sitemaps (SitemapController): an index over pages, events, organizers and
 | one file per city and category. Outside the locale group — crawlers fetch
 | `/sitemap.xml` at the root.
 */
// The event share card (App\Support\OgCard), composed on first request and cached.
Route::get('/og/e/{slug}.jpg', [OgImageController::class, 'event'])
    ->middleware('throttle:120,1')->name('og.event');

Route::controller(SitemapController::class)->middleware('throttle:60,1')->group(function () {
    Route::get('/sitemap.xml', 'index')->name('sitemap');
    Route::get('/sitemaps/pages.xml', 'pages')->name('sitemap.pages');
    Route::get('/sitemaps/events.xml', 'events')->name('sitemap.events');
    Route::get('/sitemaps/organizers.xml', 'organizers')->name('sitemap.organizers');
    Route::get('/sitemaps/city/{city}.xml', 'city')->where('city', '[a-z0-9-]+')->name('sitemap.city');
    Route::get('/sitemaps/category/{category}.xml', 'category')->where('category', '[a-z0-9-]+')->name('sitemap.category');
});

/*
 | Share links — the URLs the apps hand out (App\Support\ShareLink), open as
 | deep links (`/e/`, `/o/`, `/c/`, `/t/`; see WellKnownController) and the
 | canonical address of each page. No locale segment: they render in place in
 | the visitor's language (UseSessionLocale) rather than redirecting.
 | Above the `{locale}` group, whose single-segment prefix would otherwise read
 | `e` as a locale.
 */
/*
 | The link in the newsletter confirmation mail (double opt-in). Signed over
 | the path only, because the mail builds it from APP_URL rather than from the
 | request host. See App\Http\Controllers\NewsletterController.
 */
Route::get('/newsletter/confirm/{newsletter}', [NewsletterController::class, 'confirm'])
    ->middleware(['signed:relative', 'throttle:60,1'])
    ->name('newsletter.confirm');

Route::middleware(['site.enabled', 'session.locale'])->group(function () {
    Route::get('/e/{slug}', [EventPageController::class, 'show'])->name('short.event');
    Route::get('/o/{slug}', [OrganizerPageController::class, 'show'])->name('short.organizer');
    Route::get('/c/{category}', [DiscoverController::class, 'category'])->name('short.category');
    Route::get('/s/{series}', [OrganizerPageController::class, 'series'])->whereUuid('series')->name('short.series');
    Route::get('/t/{code}', [TicketsPageController::class, 'show'])->middleware('auth')->name('short.ticket');
    Route::get('/e/{slug}/people', [ConferencePagesController::class, 'people'])->middleware('auth')->name('short.event.people');

/*
 | The QR in the order email: a signed picture of the ticket's *link* (it
 | opens the live ticket in the app or on the site). Not the door code — that
 | rotates every 30 seconds and lives only on the holder's phone.
 */
Route::get('/qr/t/{code}.png', function (string $code) {
    abort_unless(\App\Models\Ticket::query()->where('code', $code)->exists(), 404);

    return response(\App\Support\QrPng::render(url('/t/'.$code)), 200, ['Content-Type' => 'image/png', 'Cache-Control' => 'public, max-age=86400']);
})->where('code', '[A-Z0-9-]{6,20}')->middleware(['signed', 'throttle:60,1'])->name('ticket.qr');
});

/*
 | Storefront theme switch (demo mode and local only — the controller 403s
 | otherwise). Above the `{locale}` group so `/site-theme` is never read as a
 | locale, and throttled because each call answers with a full page load.
 */
Route::post('/site-theme', ThemeSwitchController::class)
    ->middleware('throttle:30,1')
    ->name('site.theme.switch');

Route::prefix('{locale}')->middleware('setLocale')->group(function () {
    Route::get('/pages/{slug}', [IndexController::class, 'showPage'])->name('pages.show');

    // BOOKETIK_SOLUTIONS_R4: published editorial projection only. No checkout, pricing or drafts.
    Route::get('/solutions', [\App\Http\Controllers\Site\BooketikSolutionsPublicController::class, 'show'])
        ->middleware('site.enabled')->name('site.solutions.show');

    // R1N2E: authenticated lead only; intake gates remain OFF, no ticket entitlement.
    // BOOKETIK R1N2G: authenticated organizer-only form, independently gated OFF.
    Route::get('/solutions/inquiry', [\App\Http\Controllers\Site\BooketikSolutionsInquiryPageController::class, 'show'])
        ->middleware(['site.enabled', 'auth', 'verified.email', 'throttle:30,1'])
        ->name('site.solutions.inquiries.create');
    Route::post('/solutions/inquiries', [\App\Http\Controllers\Site\BooketikSolutionsInquiryController::class, 'store'])
        ->middleware(['auth', 'verified.email', 'throttle:5,1'])->name('site.solutions.inquiries.store');


    /*
     | The organizer dashboard — `/{locale}/organizer/
     | dashboard/{org}/…`, always the Civic theme (ThemeResolver::classicOnly
     | reads the `site.organizer.dashboard` names). Signed out, the auth middleware sends
     | the visitor back with the sign-in dialog open (`?auth=signin`), then
     | here. The admin panel's own `/{locale}/dashboard` is a different page.
     | (It moved from `/dashboard/…` before launch; nothing redirects from there.)
     |
     | Pages only: every write goes from the page to `/api/v1/org/{org}/…`, the
     | same endpoints the app's organizer mode uses. `organizer.page:{role}`
     | is the API's team rule answered as pages (404 off the team, 403 too low).
     */
    Route::prefix('organizer/dashboard')->middleware(['auth'])->name('site.organizer.dashboard.')->group(function () {
    Route::get('/', [App\Http\Controllers\Dashboard\DashboardController::class, 'home'])->name('home');
    Route::get('/invites/{token}', [App\Http\Controllers\Dashboard\DashboardController::class, 'acceptInvite'])
        ->where('token', '[A-Za-z0-9]{20,80}')->middleware('throttle:20,1')->name('invite');

    Route::prefix('{org}')->where(['org' => '[a-z0-9-]+'])->group(function () {
        $dash = App\Http\Controllers\Dashboard\DashboardController::class;
        $events = EventPagesController::class;
        $account = AccountPagesController::class;

        Route::middleware('organizer.page:checkin_staff')->group(function () use ($dash, $events) {
            Route::get('/', [$dash, 'overview'])->name('overview');
            Route::get('/events', [$dash, 'events'])->name('events');
            Route::get('/guests', [$dash, 'guests'])->name('guests');
            Route::get('/events/{id}/guests.csv', [$events, 'exportGuests'])->whereUuid('id')->middleware('throttle:20,1')->name('events.export');
            Route::get('/events/{id}/{tab?}', [$events, 'edit'])->whereUuid('id')
                ->whereIn('tab', array_keys(EventPagesController::TABS))->name('events.edit');
            Route::get('/team', [AccountPagesController::class, 'team'])->name('team');
        });
        // Creating an event needs a confirmed address, as `POST /org/{org}/events` does.
        Route::get('/events/new', [$events, 'create'])->middleware(['organizer.page:editor', 'verified.email'])->name('events.new');
        Route::middleware('organizer.page:admin')->group(function () use ($dash, $account) {
            Route::get('/promote', [$dash, 'promote'])->name('promote');
            Route::get('/payouts', [$account, 'payouts'])->name('payouts');
            Route::get('/refunds', [$account, 'refunds'])->name('refunds');
            Route::get('/profile', [$account, 'profile'])->name('profile');
        });
        Route::get('/billing', [$account, 'billing'])->middleware('organizer.page:owner')->name('billing');
    });
    });

    /* R3-B8-O1: authenticated organizer-claim intake; NOT a ticketing entry point. */
    // O3: explicit session intent, native registration, deferred claim submission.
    Route::prefix('culture/claim')->middleware(['site.enabled','throttle:10,1'])
        ->name('site.external-claims.')->controller(SiteExternalEventClaimController::class)->group(function () {
            Route::post('/{slug}/begin', 'begin')->name('begin');
            Route::middleware(['auth', 'verified.email'])->group(function () {
                Route::get('/{slug}', 'show')->name('show'); // compatibility redirect to event
                Route::post('/{slug}/finish', 'finish')->name('finish');
                Route::post('/{slug}/evidence', 'evidence')->name('evidence');
            });
        });

    // `/{locale}/admin` — the admin panel's home is `/{locale}/dashboard`.
    Route::get('/admin', fn (string $locale) => redirect('/'.$locale.'/dashboard'))->name('admin.home');


    /*
     |--------------------------------------------------------------------------
     | The public site
     |--------------------------------------------------------------------------
     |
     | Inertia + React: the home page lists upcoming events, and the rest is
     | the account, the blog, the CMS pages and auth. Reads take an optional
     | session, which is why they sit outside the `auth` group.
     */
    Route::middleware('site.enabled')->get('/', SiteHomeController::class)->name('index');

    /*
     | The event pages: discovery, the event and its checkout, the
     | organizer hub, a series, the agenda, search. Reads take an optional
     | session. Each renders the API's own resources (Site\Concerns\ReadsApi).
     */
    Route::middleware('site.enabled')->group(function () {
        Route::get('/discover', [DiscoverController::class, 'index'])->name('site.discover');
        Route::get('/search', [DiscoverController::class, 'search'])->name('site.search');
        Route::get('/c/{category}', [DiscoverController::class, 'category'])->name('site.category');
        Route::get('/e/{slug}', [EventPageController::class, 'show'])->name('site.event');
        Route::get('/e/{slug}/agenda', [EventPageController::class, 'agenda'])->name('site.event.agenda');
        Route::get('/e/{slug}/checkout', [CheckoutPageController::class, 'show'])->name('site.event.checkout');
        Route::post('/e/{slug}/rsvp', [CheckoutPageController::class, 'guestRsvp'])->middleware('throttle:10,1')->name('site.event.rsvp');
        Route::get('/o/{slug}', [OrganizerPageController::class, 'show'])->name('site.organizer');
        Route::get('/s/{series}', [OrganizerPageController::class, 'series'])->whereUuid('series')->name('site.series');
        Route::get('/plus', PlusPageController::class)->name('site.plus');

        Route::middleware('auth')->group(function () {
            Route::get('/e/{slug}/confirmed', [CheckoutPageController::class, 'confirmed'])->name('site.event.confirmed');
            Route::get('/tickets', [TicketsPageController::class, 'index'])->name('site.tickets');
            Route::get('/t/{code}', [TicketsPageController::class, 'show'])->name('site.ticket');
            Route::get('/account/notifications', NotificationSettingsController::class)->name('site.account.notifications');
            Route::get('/account/networking', [ConferencePagesController::class, 'networking'])->name('site.account.networking');
            Route::get('/e/{slug}/people', [ConferencePagesController::class, 'people'])->name('site.event.people');
        });
    });

    /*
     | The blog.
     |
     | The admin panel has had full blog CRUD since the first release and there
     | has never been a public route to any of it — operators could write posts
     | that nobody could read. These are those routes.
     |
     | `category/{slug}` before `{slug}`, or the literal segment is matched as a
     | post slug and a category page 404s.
     */
    Route::middleware('site.enabled')->controller(SiteBlogController::class)->group(function () {
        Route::get('/blog', 'index')->name('site.blog');
        Route::get('/blog/category/{category}', 'index')->name('site.blog.category');
        Route::get('/blog/{slug}', 'show')->name('site.blog.show');
    });

    Route::middleware(['site.enabled', 'auth'])
        ->get('/account', [SiteAccountController::class, 'account'])
        ->name('site.account');

    /*
     | The old shop's address. Hosted checkouts (Creem, Dodo, Polar, Lemon
     | Squeezy) were told to send buyers back to `/shop?checkout=done`, and a
     | payment started before the change can still land there. CleanCheckoutReturn
     | has already turned the marker into a `celebrate` flash by the time this
     | runs, so the flash is kept for one more hop to the page that now sells
     | Plus, where CheckoutReturn reads it.
     */
    Route::get('/shop', function (string $locale) {
        session()->reflash();

        return redirect()->to('/'.$locale.'/account/subscription');
    })->name('site.shop.legacy');

    /*
     | Card checkout on the site (Stripe / Paddle / Lemon Squeezy / Creem /
     | Dodo / Polar) and the subscription page.
     |
     | JSON endpoints: the card form is mounted on the shop page and a
     | navigation would unmount it mid-payment. Nothing here grants anything —
     | the provider's webhook does, and the page waits on `/me/entitlement` or
     | the `purchase.settled` push. See App\Http\Controllers\Site\CheckoutController.
     | Names start `site.` so a signed-out visit is sent to the site's sign-in.
     */
    Route::middleware(['site.enabled', 'auth'])->controller(SiteCheckoutController::class)->group(function () {
        Route::post('/checkout/plan/{plan}', 'plan')
            ->whereNumber('plan')->middleware('throttle:20,1')->name('site.checkout.plan');
        Route::post('/checkout/plans', 'plans')->middleware('throttle:60,1')->name('site.checkout.plans');
        Route::get('/me/entitlement', 'entitlement')->middleware('throttle:120,1')->name('site.me.entitlement');

        Route::get('/account/subscription', 'subscription')->name('site.account.subscription');
        Route::post('/account/subscription/portal', 'portalLink')
            ->middleware('throttle:10,1')->name('site.account.subscription.portal');
        Route::post('/account/purchases/{kind}/{id}/invoice', 'invoice')
            ->whereIn('kind', ['subscription', 'order'])->whereNumber('id')
            ->middleware('throttle:20,1')->name('site.account.purchases.invoice');
    });

    /*
     | Stripe Connect onboarding for an organizer's owners and admins (the
     | app's `POST /org/{org}/payments/connect` link returns here).
     */
    Route::middleware(['auth'])->controller(ConnectOnboardingController::class)->group(function () {
        Route::get('/organizers/{slug}/connect', 'start')->middleware(['verified.email', 'throttle:10,1'])->name('site.organizers.connect');
        Route::get('/organizers/{slug}/connect/return', 'back')->name('site.organizers.connect.return');
        Route::get('/organizers/{slug}/connect/refresh', 'start')->middleware(['verified.email', 'throttle:10,1'])->name('site.organizers.connect.refresh');
    });

    /*
     | Signing a viewer out.
     |
     | `user.logout` in the admin group is behind `staff`, so a viewer clicking
     | it got "you are not authorized" instead of being signed out. POST so a
     | prefetch or an image tag cannot end someone's session.
     */
    Route::post('/sign-out', [AuthenticatedSessionController::class, 'destroy'])
        ->middleware('auth')
        ->name('site.sign-out');

    /*
     | Confirming the address, after signing up.
     |
     | Registering signs the member in and mails six digits; the global
     | verify-email dialog posts them here. The guess budget (5 per code) lives
     | in EmailVerification and belongs to the account; the throttles bound
     | the request rate per signed-in user. The old pre-registration
     | `send-verification-code` / `verify-code` pair is gone.
     */
    Route::middleware(['auth'])->controller(AuthenticatedSessionController::class)->group(function () {
        Route::post('/verify-email', 'verifyEmail')
            ->middleware('throttle:10,1')->name('site.verify-email');
        Route::post('/verify-email/resend', 'resendEmailCode')
            ->middleware('throttle:4,1')->name('site.verify-email.resend');
    });

    /* Password and connected sign-in providers, from the account page. */
    Route::middleware(['site.enabled', 'auth'])->controller(SiteAccountSecurityController::class)->group(function () {
        Route::post('/account/password/code', 'sendPasswordCode')
            ->middleware('throttle:4,1')->name('site.account.password.code');
        Route::post('/account/password', 'changePassword')
            ->middleware('throttle:10,1')->name('site.account.password');
        Route::delete('/account/social/{provider}', 'disconnectSocial')
            ->whereIn('provider', ['google', 'facebook'])->name('site.account.social.disconnect');
    });

    /*
     | The public auth surface.
     |
     | Everything that takes a credential or sends mail is rate limited. It was
     | not: web-login, web-register, forgot-password and reset-password (and
     | the since-removed pre-registration code endpoints) all sat here with no
     | throttle at all, while the mobile equivalents in routes/api.php have had
     | `mobile-auth` on them since they were written — so a password spray, or a
     | sweep of a six-digit verification code, ran at whatever rate the server
     | would answer. The limiters are defined in AppServiceProvider:
     |
     |   auth-web   credentials — 10/min per IP, 5/min per address+IP
     |   auth-mail  anything that makes us send mail to a chosen address —
     |              3/min per IP, 5/hour per address
     |
     | The two GETs are only pages and are left off the credential limiter, so a
     | viewer who mistypes a password five times can still reload the form.
     */
    Route::controller(AuthenticatedSessionController::class)->middleware('guest')->group(function () {
        /*
         | No pages: signing in, signing up and the forgotten password are the
         | dialog every theme mounts (AuthRoot), opened over the current page
         | or by `?auth=signin|register|forgot|reset|verify` (App\Support\
         | AuthDialog). These are its endpoints. Fortify's `/login` is the
         | admin panel's and nobody else's.
         */
        Route::middleware('throttle:auth-web')->group(function () {
            Route::post('auth/sign-in', 'store')->name('site.auth.login');
            Route::post('auth/register', 'register')->name('site.auth.register');
        });

        /*
         | Forgotten passwords. Named `site.password.*`, NOT `password.request` /
         | `password.email`: Fortify registers those for the panel, and a
         | duplicate name silently wins the `route()` lookup.
         */
        Route::post('auth/forgot-password', 'sendResetLinkEmail')
            ->middleware('throttle:auth-mail')
            ->name('site.password.email');
        Route::post('auth/reset-password', 'resetPassword')
            ->middleware('throttle:auth-web')
            ->name('site.password.update');
    });

    /*
     | Staff (admin OR moderator) can work the review queues — events,
     | reports, users. Configuration that moves money stays inside the nested
     | `admin` group below, so a compromised moderator account cannot rewrite
     | the fees or what organizers get paid.
     */
    Route::middleware(['auth', 'staff'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');

        /*
         | ── Events ───────────────────────────────────────────
         |
         | Staff, not admin: reviewing, correcting and hiding events is the
         | day-to-day work a moderator account exists for. The controllers
         | deactivate or hide rather than hard-delete anything a guest holds a
         | ticket for, so a mis-click is recoverable.
         */
        Route::prefix('admin/events')->name('admin.events.')->controller(AdminEventController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/{event}/edit', 'edit')->whereUuid('event')->name('edit');
            Route::post('/{event}', 'update')->whereUuid('event')->name('update');
            Route::post('/{event}/approve', 'approve')->whereUuid('event')->name('approve');
            Route::post('/{event}/changes', 'requestChanges')->whereUuid('event')->name('changes');
            Route::post('/{event}/reject', 'reject')->whereUuid('event')->name('reject');
            Route::post('/{event}/hide', 'hide')->whereUuid('event')->name('hide');
            Route::get('/{event}/registrations', 'registrations')->whereUuid('event')->name('registrations');
            Route::post('/{event}/registrations/{registration}/approve', 'approveRegistration')
                ->whereUuid(['event', 'registration'])->name('registrations.approve');
            Route::post('/{event}/registrations/{registration}/decline', 'declineRegistration')
                ->whereUuid(['event', 'registration'])->name('registrations.decline');
        });

        // R2A read-only editorial inventory. Admin-only; no mutations until R2B.
        // Superadmin-only editorial workspace. No automatic import or public activation.
        Route::prefix('admin/external-events')->middleware('admin')->name('admin.external-events.')
            ->controller(ExternalEventsController::class)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/sources', 'storeSource')->name('sources.store');
                Route::post('/sources/{source}/verify', 'verifySource')->whereUuid('source')->name('sources.verify');
                Route::post('/sources/{source}/revoke', 'revokeSource')->whereUuid('source')->name('sources.revoke');
                Route::post('/sources/{source}/sync', 'setSourceSync')->whereUuid('source')->name('sources.sync');
                Route::post('/listings', 'storeListing')->name('listings.store');
                Route::get('/listings/{listing}/edit', 'editListing')->whereUuid('listing')->name('listings.edit');
                Route::put('/listings/{listing}', 'updateListing')->whereUuid('listing')->name('listings.update');
                Route::post('/listings/{listing}/revision/apply', 'applyPublishedEdit')->whereUuid('listing')->name('listings.revision.apply');
                Route::post('/listings/{listing}/revision/cancel', 'cancelPublishedEdit')->whereUuid('listing')->name('listings.revision.cancel');
                Route::post('/listings/{listing}/approve', 'approveListing')->whereUuid('listing')->name('listings.approve');
                Route::post('/listings/{listing}/revoke', 'revokeListing')->whereUuid('listing')->name('listings.revoke');
                Route::post('/listings/{listing}/publish', 'publishListing')->whereUuid('listing')->name('listings.publish');
                Route::post('/listings/{listing}/withdraw', 'withdrawListing')->whereUuid('listing')->name('listings.withdraw');
                Route::post('/listings/{listing}/exclude', 'excludeListing')->whereUuid('listing')->name('listings.exclude');
                Route::post('/listings/{listing}/restore', 'restoreListing')->whereUuid('listing')->name('listings.restore');
            });

        /* R3-B8-O1: manual claim-review inbox, staff+admin only. */
        Route::prefix('admin/external-claims')->middleware('admin')
            ->name('admin.external-claims.')->controller(AdminExternalEventClaimController::class)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/{claim}/approve', 'approve')->whereUuid('claim')->name('approve');
                Route::post('/{claim}/reject', 'reject')->whereUuid('claim')->name('reject');
            });

        Route::prefix('admin/events/{event}/tiers')->whereUuid('event')->name('admin.ticket-types.')
            ->controller(TicketTypeController::class)->group(function () {
                Route::post('/', 'store')->name('store');
                Route::post('/{ticketType}', 'update')->whereUuid('ticketType')->name('update');
                Route::delete('/{ticketType}', 'destroy')->whereUuid('ticketType')->name('delete');
            });

        /*
         | Organizers. Verification and suspension are staff work; assigning a
         | plan is a fee rate on every future sale, so the controller keeps that
         | one admin-only.
         */
        Route::prefix('admin/organizers')->name('admin.organizers.')->controller(AdminOrganizerController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/{organizer}', 'show')->whereUuid('organizer')->name('show');
            Route::post('/{organizer}', 'update')->whereUuid('organizer')->name('update');
            Route::post('/{organizer}/verify', 'verify')->whereUuid('organizer')->name('verify');
            Route::post('/{organizer}/suspend', 'suspend')->whereUuid('organizer')->name('suspend');
            Route::post('/{organizer}/plan', 'plan')->whereUuid('organizer')->name('plan');
            Route::post('/{organizer}/members/{user}/role', 'changeRole')
                ->whereUuid('organizer')->whereNumber('user')->name('members.role');
            Route::delete('/{organizer}/members/{user}', 'removeMember')
                ->whereUuid('organizer')->whereNumber('user')->name('members.delete');
        });

        Route::prefix('admin/categories')->name('admin.categories.')->controller(CategoryController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::post('/{category}', 'update')->whereUuid('category')->name('update');
            Route::delete('/{category}', 'destroy')->whereUuid('category')->middleware('admin')->name('delete');
        });

        /*
         | Tags carry a **merge**, which is the action that makes the
         | difference: a vocabulary accumulates near-duplicates faster than an
         | operator can prevent them, and without a merge the only fix is
         | re-tagging every event.
         */
        Route::prefix('admin/tags')->name('admin.tags.')->controller(TagController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::post('/{tag}', 'update')->name('update');
            Route::post('/{tag}/merge', 'merge')->middleware('admin')->name('merge');
            Route::delete('/{tag}', 'destroy')->middleware('admin')->name('delete');
        });

        // The door's audit log. Read-only by design: a scan is evidence.
        Route::get('/admin/check-ins', [CheckInController::class, 'index'])->name('admin.check-ins.index');

        /*
         | ── Live doors, fraud flags, AI, maps ──────────────────────────────
         |
         | Live check-ins and fraud flags are staff reading work. AI usage and
         | the moderation log are readable by staff; changing what AI may spend
         | and where the maps come from is admin-only (the controllers say so).
         */
        Route::get('/admin/check-ins/live', [CheckInController::class, 'live'])->name('admin.check-ins.live');
        Route::get('/admin/check-ins/live.json', [CheckInController::class, 'liveData'])->middleware('throttle:60,1')->name('admin.check-ins.live.data');
        Route::get('/admin/reports/fraud', [FraudController::class, 'index'])->name('admin.reports.fraud');
        Route::prefix('admin/ai')->name('admin.ai.')->controller(AiController::class)->group(function () {
            Route::get('/', 'usage')->name('usage');
            Route::get('/settings', 'settings')->name('settings');
            Route::post('/settings', 'updateSettings')->name('settings.update');
            Route::get('/moderation', 'moderation')->name('moderation');
        });
        Route::get('/admin/settings/maps', [MapsSettingsController::class, 'edit'])->name('admin.settings.maps');
        Route::post('/admin/settings/maps', [MapsSettingsController::class, 'update'])->name('admin.settings.maps.update');
        // ── end live doors, fraud flags, AI, maps ──────────────────────────────

        /*
         | ── Moderation ───────────────────────────────────────
         |
         | Staff, not admin: triaging what attendees report is exactly the
         | day-to-day work a moderator account exists for. POST for every
         | status change, so a link preloader cannot mark a report handled.
         */
        Route::prefix('admin/reports')->name('admin.reports.')->controller(EventReportController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/{report}/review', 'review')->whereUuid('report')->name('review');
            Route::post('/{report}/dismiss', 'dismiss')->whereUuid('report')->name('dismiss');
            Route::post('/{report}/reopen', 'reopen')->whereUuid('report')->name('reopen');
        });

        Route::prefix('admin/home-sections')->name('admin.home-sections.')->controller(HomeSectionController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::get('/{section}/edit', 'edit')->name('edit');
            Route::post('/{section}', 'update')->name('update');
            Route::delete('/{section}', 'destroy')->middleware('admin')->name('delete');
            Route::post('/{section}/items', 'storeItem')->name('items.store');
            Route::post('/{section}/items/reorder', 'reorderItems')->name('items.reorder');
            Route::delete('/{section}/items/{item}', 'destroyItem')->name('items.delete');
        });

        /*
         | ── Money ────────────────────────────────────────────
         |
         | **Admin, not staff** — everything here moves money: the platform
         | fee on every ticket, and the screen that pays organizers.
         */
        Route::middleware('admin')->group(function () {
            Route::get('/admin/fees', [FeeSettingsController::class, 'edit'])->name('admin.fees.edit');
            Route::post('/admin/fees', [FeeSettingsController::class, 'update'])->name('admin.fees.update');

            Route::prefix('admin/payouts')->name('admin.payouts.')->controller(AdminPayoutController::class)->group(function () {
                Route::get('/', 'index')->name('index');
                // Before `/{payout}`, or the literal segment is read as an id.
                Route::get('/export.csv', 'export')->name('export');
                Route::post('/{payout}/approve', 'approve')->whereNumber('payout')->name('approve');
                Route::post('/{payout}/reject', 'reject')->whereNumber('payout')->name('reject');
                Route::post('/{payout}/paid', 'markPaid')->whereNumber('payout')->name('paid');
                Route::post('/{payout}/failed', 'markFailed')->whereNumber('payout')->name('failed');
                Route::post('/{payout}/retry', 'retry')->whereNumber('payout')->name('retry');
            });

            Route::prefix('admin/refunds')->name('admin.refunds.')->controller(RefundController::class)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/requests/{id}/approve', 'approve')->name('approve');
                Route::post('/requests/{id}/reject', 'reject')->name('reject');
                Route::post('/{id}/done', 'markDone')->name('done');
            });
        });

        /*
         | Single-file uploads from the panel's forms. Public kinds (covers,
         | portraits, icons) go into the media library on the active storage
         | provider. See Admin\MediaController.
         */
        Route::post('/admin/media', [MediaController::class, 'store'])->name('admin.media.store');

        /*
         | ── Media ────────────────────────────────────────────
         |
         | The library and its picker are for anybody editing content; deleting
         | and moving files and choosing where they live are admin decisions.
         | Literal segments come before `{media}`.
         */
        Route::prefix('admin/media')->name('admin.media.')->group(function () {
            Route::controller(MediaStorageController::class)->prefix('storage')->name('storage.')->middleware('admin')->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/options', 'options')->name('options');
                Route::post('/cdn/verify', 'verifyNetwork')->name('cdn.verify');
                Route::post('/cdn/purge', 'purge')->name('cdn.purge');
                Route::post('/cdn/{network}/activate', 'activateNetwork')->name('cdn.activate');
                Route::post('/providers/{provider}/activate', 'activate')->name('activate');
                Route::post('/providers/{provider}/verify', 'verify')->name('verify');
            });

            Route::controller(MediaLibraryController::class)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('/browse', 'browse')->name('browse');
                Route::post('/upload', 'store')->middleware('throttle:60,1')->name('upload');
                Route::post('/import', 'import')->middleware('admin')->name('import');
                Route::delete('/bulk-delete', 'destroyMany')->middleware('admin')->name('destroy-many');
                Route::post('/bulk-move', 'moveMany')->middleware('admin')->name('move-many');
                Route::post('/{media}', 'update')->whereNumber('media')->name('update');
                Route::post('/{media}/purge', 'purge')->whereNumber('media')->middleware('admin')->name('purge');
                Route::post('/{media}/move', 'move')->whereNumber('media')->middleware('admin')->name('move');
                Route::delete('/{media}/delete', 'destroy')->whereNumber('media')->middleware('admin')->name('delete');
            });
        });

        // ── Billing ───────────────────────────────────────────
        Route::prefix('admin/billing')->name('admin.billing.')->controller(BillingController::class)->group(function () {
            Route::get('/subscriptions', 'subscriptions')->name('subscriptions');
            Route::get('/orders', 'orders')->name('orders');
            Route::get('/orders/{id}', 'showOrder')->whereNumber('id')->name('orders.show');
            /*
             | Ask the gateway what really happened, and apply it. Admin-only
             | because it can grant an entitlement; idempotent, because it goes
             | through the same delivery guard the webhooks do.
             */
            Route::post('/orders/{id}/recheck', 'recheckOrder')->whereNumber('id')->name('orders.recheck');
            // The web card provider's own invoice or receipt, fetched when asked
            // for: the links are signed and short-lived, so none is stored.
            Route::get('/orders/{id}/invoice', 'orderInvoice')->whereNumber('id')->name('orders.invoice');
            Route::get('/subscriptions/{id}/invoice', 'subscriptionInvoice')->whereNumber('id')->name('subscriptions.invoice');
            /*
             | Plans & products: Eventgoo Plus and the organizer plans, and which
             | of the six web card providers sells each. Created and edited here
             | in drawers; the per-currency price matrix keeps its own screen.
             */
            Route::get('/catalogue', 'catalogue')->name('catalogue');
            // The old plans screen's address: redirects to the catalogue.
            Route::get('/plans', 'plans')->name('plans');
            Route::post('/plans', 'storePlan')->middleware('admin')->name('plans.store');
            // Each plan's price in every active currency.
            Route::get('/plans/prices', 'prices')->name('plans.prices');
            Route::post('/plans/{id}', 'updatePlan')->whereNumber('id')->middleware('admin')->name('plans.update');
            Route::delete('/plans/{id}', 'destroyPlan')->whereNumber('id')->middleware('admin')->name('plans.delete');

            // On sale or not. The flag is the plan's own.
            Route::post('/sellables/{kind}/{id}/active', 'toggleSellable')
                ->whereIn('kind', ['plan'])
                ->whereNumber('id')->middleware('admin')->name('sellables.active');
            // Re-create at every provider that already sells it, at today's price.
            Route::post('/sellables/{kind}/{id}/resync', 'resyncSellable')
                ->whereIn('kind', ['plan'])
                ->whereNumber('id')->middleware('admin')->name('sellables.resync');

            /*
             | The six web card providers. Credentials and PAYMENTS_DEFAULT are
             | env-only; the actions here talk to the provider (verify, sync) or
             | edit our mapping rows, never the keys.
             */
            Route::get('/providers', 'providers')->name('providers');
            Route::post('/providers/sync', 'syncProducts')->middleware('admin')->name('providers.sync');
            Route::get('/providers/{name}', 'provider')->name('providers.show');
            Route::post('/providers/{name}/verify', 'verifyProvider')
                ->middleware('admin')->name('providers.verify');
            // Add a plan that already exists over there, ids and all.
            Route::post('/providers/{name}/plans', 'storeProviderPlan')
                ->middleware('admin')->name('providers.plans.store');
            // Selling an existing plan through this provider: with
            // ids it is a link, without them the product is created over there.
            Route::post('/providers/{name}/attach', 'attachProduct')
                ->middleware('admin')->name('providers.attach');
            // Unlinks — deletes our mapping row only, never the plan.
            Route::delete('/providers/{name}/products/{kind}/{id}', 'detachProduct')
                ->whereIn('kind', ['plan'])
                ->whereNumber('id')->middleware('admin')->name('providers.detach');
            // Create (or with `replace`, re-create) just this one product there.
            Route::post('/providers/{name}/products/{kind}/{id}/sync', 'syncOne')
                ->whereIn('kind', ['plan'])
                ->whereNumber('id')->middleware('admin')->name('providers.product.sync');
            // Manual override for when the sync cannot produce the ids.
            Route::post('/providers/{name}/products/{kind}/{id}', 'updateProviderProduct')
                ->whereIn('kind', ['plan'])
                ->whereNumber('id')->middleware('admin')->name('providers.product');
        });

        // ── Content ───────────────────────────────────────────
        Route::prefix('admin/faqs')->name('admin.faqs.')->controller(FaqController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::get('/{id}/edit', 'edit')->name('edit');
            Route::post('/{id}', 'update')->name('update');
            Route::delete('/{id}', 'destroy')->name('delete');
        });

        Route::prefix('admin/blogs')->name('admin.blogs.')->controller(BlogController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/create', 'create')->name('create');
            Route::post('/', 'store')->name('store');
            Route::get('/{id}/edit', 'edit')->name('edit');
            Route::post('/{id}', 'update')->name('update');
            Route::delete('/{id}', 'destroy')->name('delete');
            Route::post('/categories', 'storeCategory')->name('categories.store');
            Route::delete('/categories/{id}', 'destroyCategory')->name('categories.delete');
        });

        // Users & sessions
        Route::get('/admin/user/all', [AdminUserController::class, 'allUsers'])->name('admin.all.users');
        Route::get('/admin/users/search', [AdminUserController::class, 'search'])->name('admin.users.search');
        Route::get('/admin/user/{id}', [AdminUserController::class, 'show'])->name('admin.user.show');
        Route::post('/admin/user/update/{id}', [AdminUserController::class, 'update'])->middleware('admin')->name('admin.user.update');
        Route::post('/admin/user/{id}/plus', [AdminUserController::class, 'updatePlus'])
            ->middleware('admin')->name('admin.user.plus');
        Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy'])->middleware('admin')->name('admin.user.delete');
        Route::get('/admin/sessions', [AdminUserController::class, 'allSessions'])->middleware('admin')->name('admin.all.sessions');
        Route::delete('/admin/sessions/{id}', [AdminUserController::class, 'deleteSession'])->middleware('admin')->name('admin.sessions.delete');

        /*
         | Admin only, enforced here and not just hidden in the sidebar: locales,
         | settings, themes, pages, email templates, push to every user and the
         | newsletter. A moderator reviews content and users; they do not configure
         | the platform or message everyone.
         */
        Route::middleware('admin')->group(function () {
            // Locales
            Route::get('/admin/locales/all', [LocaleController::class, 'allLocales'])->name('admin.all.locales');
            Route::post('/admin/locales/add', [LocaleController::class, 'addLocale'])->name('admin.locales.store');
            Route::get('/admin/locales/edit/{id}', [LocaleController::class, 'editLocale'])->name('admin.locales.edit');
            Route::post('/admin/locales/update/{id}', [LocaleController::class, 'updateLocale'])->name('admin.locales.update');
            Route::delete('/admin/locales/{id}', [LocaleController::class, 'destroy'])->name('admin.locales.delete');

            // Settings
            Route::get('/admin/settings/app', [AdminSettingsController::class, 'appSettings'])->name('admin.settings.app');
            Route::post('/admin/settings/app/save', [AdminSettingsController::class, 'saveAppSettings'])->name('admin.save.app.settings');
            Route::get('/admin/settings/web', [AdminSettingsController::class, 'webSettings'])->name('admin.settings.web');
            Route::post('/admin/settings/web/save', [AdminSettingsController::class, 'saveWebSettings'])->name('admin.save.web.settings');
            Route::get('/admin/settings/contact', [AdminSettingsController::class, 'contactSettings'])->name('admin.settings.contact');
            Route::post('/admin/settings/contact/save', [AdminSettingsController::class, 'saveContactSettings'])->name('admin.save.contact.settings');

            Route::get('/admin/settings/smtp', [AdminSmtpController::class, 'index'])->name('admin.settings.smtp');
            Route::post('/admin/settings/update-smtp', [AdminSmtpController::class, 'updateSmtpSettings'])->name('update.env.smtp');
            Route::get('/admin/settings/social-login', [AdminSocialLoginController::class, 'index'])->name('admin.settings.social-login');
            Route::post('/admin/settings/update-social-login', [AdminSocialLoginController::class, 'updateSocialLoginSettings'])->name('update.env.social-login');
            Route::get('/admin/settings/captcha', [AdminCaptchaController::class, 'index'])->name('admin.settings.captcha');
            Route::post('/admin/settings/update-captcha', [AdminCaptchaController::class, 'updateCaptchaSettings'])->name('update.env.captcha');
            /*
             | Gateway and push credentials. Admin-only, not staff: these keys move
             | money and can notify every member on the platform, which is not the
             | day-to-day work a moderator account exists for.
             */
            Route::get('/admin/settings/integrations', [IntegrationSettingsController::class, 'index'])
                ->middleware('admin')->name('admin.settings.integrations');
            // A cheap authenticated read against the gateway — never a charge.
            Route::get('/admin/settings/integrations/test/{gateway}', [IntegrationSettingsController::class, 'test'])
                ->middleware('admin')->name('admin.settings.integrations.test');
            Route::post('/admin/settings/integrations', [IntegrationSettingsController::class, 'update'])
                ->middleware('admin')->name('admin.settings.integrations.save');

            /*
             | Currencies. Admin-only for everything but the list: the `exponent`
             | on this screen decides what a customer is charged, and setting IDR
             | to 2 is a hundredfold overcharge at the gateway.
             */
            Route::prefix('admin/settings/currencies')->name('admin.settings.currencies.')
                ->controller(CurrencyController::class)->group(function () {
                    Route::get('/', 'index')->name('index');
                    Route::get('/preview', 'preview')->name('preview');
                    Route::post('/', 'store')->name('store');
                    Route::post('/{currency}', 'update')->whereNumber('currency')->name('update');
                    Route::post('/{currency}/default', 'makeDefault')->whereNumber('currency')->name('default');
                    Route::post('/{currency}/base', 'makeBase')->whereNumber('currency')->name('base');
                    Route::delete('/{currency}', 'destroy')->whereNumber('currency')->name('delete');
                });

            // Per-currency prices for plans.
            Route::post('/admin/pricing/{type}/{id}', [PricingController::class, 'update'])
                ->whereNumber('id')->name('admin.pricing.update');
            Route::get('/admin/pricing/{type}/{id}/suggest', [PricingController::class, 'suggest'])
                ->whereNumber('id')->name('admin.pricing.suggest');

            /*
             | Deep links. Admin-only: a wrong fingerprint here stops every shared
             | link from opening the app, and does it silently.
             */
            Route::prefix('admin/settings/deep-links')->name('admin.settings.deep-links.')
                ->controller(DeepLinkController::class)->group(function () {
                    Route::get('/', 'index')->name('index');
                    Route::post('/', 'update')->name('save');
                    Route::get('/verify', 'verify')->name('verify');
                });

            /*
             | Storefront themes. Admin-only (the controller says so): the active
             | theme is the whole public site in production.
             */
            Route::get('/admin/themes', [AdminThemeController::class, 'index'])->name('admin.themes.index');
            Route::post('/admin/themes', [AdminThemeController::class, 'update'])->name('admin.themes.update');

            Route::get('/admin/settings/general', [AdminGeneralSettingsController::class, 'index'])->name('admin.settings.general');
            Route::post('/admin/settings/update-general', [AdminGeneralSettingsController::class, 'updateGeneralSettings'])->name('update.env.general');

            // BOOKETIK Solutions R1C: admin-only and disabled by config until reviewed schema activation.
            Route::prefix('admin/solutions')->name('admin.solutions.')
                ->controller(\App\Http\Controllers\Admin\BooketikSolutionsEditorController::class)->group(function () {
                    Route::get('/edit', 'edit')->name('edit');
                    // R1H: authenticated Superadmin-only React preview; no public /plus changes.
                    Route::get('/preview', 'preview')->middleware('throttle:30,1')->name('preview');
                    Route::post('/draft', 'draft')->middleware('throttle:15,1')->name('draft');
                    Route::post('/publish', 'publish')->middleware('throttle:5,1')->name('publish');
                });

            // BOOKETIK Solutions R1M: independent per-event fees, ADMIN ONLY and config-gated OFF.
            Route::get('/admin/solutions/offers', [\App\Http\Controllers\Admin\BooketikSolutionsPricingController::class, 'index'])
                ->name('admin.solutions.offers');
            Route::post('/admin/solutions/offers/{code}', [\App\Http\Controllers\Admin\BooketikSolutionsPricingController::class, 'update'])
                ->middleware('throttle:10,1')->name('admin.solutions.offers.update');

            // R1N2E: read-only admin inbox; independently gated OFF.
            Route::get('/admin/solutions/inquiries', [\App\Http\Controllers\Admin\BooketikCommercialInquiryInboxController::class, 'index'])
                ->middleware('throttle:30,1')->name('admin.solutions.inquiries.index');

            // R1N2J: private Superadmin-only read-only preview of organizer forms.
            Route::get('/admin/solutions/inquiry-preview', [\App\Http\Controllers\Admin\BooketikSolutionsInquiryPreviewController::class, 'show'])
                ->middleware('throttle:30,1')->name('admin.solutions.inquiry-preview');

            // BOOKETIK R1N2AJ: admin-only decision route, separately gated OFF.
            require __DIR__.'/booketik_solutions_decisions.php';

            // Content pages
            Route::get('/admin/content/pages', [AdminSettingsController::class, 'pages'])->name('admin.content.pages');
            Route::post('/admin/content/pages/store', [AdminSettingsController::class, 'store'])->name('admin.content.pages.store');
            Route::get('/admin/content/pages/edit/{id}', [AdminSettingsController::class, 'editPage'])->name('admin.content.pages.edit');
            Route::post('/admin/content/pages/update/{id}', [AdminSettingsController::class, 'updatePage'])->name('admin.content.pages.update');
            Route::delete('/admin/content/pages/{id}', [AdminSettingsController::class, 'destroyPage'])->name('admin.content.pages.delete');

            // Email templates
            Route::get('/admin/email-templates', [AdminEmailTemplatesController::class, 'templates'])->name('admin.email-templates.index');
            Route::post('/admin/email-templates/store', [AdminEmailTemplatesController::class, 'store'])->name('admin.email-templates.store');
            Route::get('/admin/email-templates/edit/{id}', [AdminEmailTemplatesController::class, 'editTemplate'])->name('admin.email-templates.edit');
            // The mail as it will arrive, sample values filled in — framed by the index and edit screens.
            Route::get('/admin/email-templates/{id}/preview', [AdminEmailTemplatesController::class, 'preview'])
                ->whereNumber('id')->name('admin.email-templates.preview');
            Route::post('/admin/email-templates/update/{id}', [AdminEmailTemplatesController::class, 'updateTemplate'])->name('admin.email-templates.update');
            Route::delete('/admin/email-templates/{id}', [AdminEmailTemplatesController::class, 'destroyTemplate'])->name('admin.email-templates.delete');

            // Notifications
            Route::get('/admin/notifications', [NotificationsController::class, 'allNotifications'])->name('admin.all.notifications');
            Route::post('/admin/notifications/send', [NotificationsController::class, 'sendNotification'])->name('admin.send.notification');
            Route::delete('/admin/notifications/{id}', [NotificationsController::class, 'destroy'])->name('admin.notification.delete');

            // Newsletters
            Route::get('/admin/newsletters', [AdminNewsletterController::class, 'allNewsletters'])->name('admin.all.newsletters');
            Route::delete('/admin/newsletters/{id}', [AdminNewsletterController::class, 'destroy'])->name('admin.newsletters.delete');
            Route::post('/admin/update-mailchimp-settings', [AdminNewsletterController::class, 'updateMailchimpSettings'])->name('update.env.mailchimp');
        });

        // Support: requests, with the support assistant's drafts.
        Route::get('/admin/support', [SupportTicketController::class, 'index'])->name('admin.support.index');
        Route::get('/admin/support/{ticket}', [SupportTicketController::class, 'show'])->whereNumber('ticket')->name('admin.support.show');
        Route::post('/admin/support/{ticket}/draft', [SupportTicketController::class, 'draft'])->whereNumber('ticket')->middleware('throttle:20,1')->name('admin.support.draft');
        Route::post('/admin/support/{ticket}/reply', [SupportTicketController::class, 'reply'])->whereNumber('ticket')->middleware('throttle:30,1')->name('admin.support.reply');

        // Support
        Route::get('/admin/contact-messages', [ContactMessageController::class, 'allContactMessages'])->name('admin.all.contactMessages');
        Route::delete('/admin/contact-messages/{id}', [ContactMessageController::class, 'destroy'])->name('admin.contactMessages.delete');
        Route::get('/admin/ticket-feedbacks', [TicketFeedbackController::class, 'allTicketFeedbacks'])->name('admin.all.allTicketFeedbacks');
        Route::delete('/admin/ticket-feedbacks/{id}', [TicketFeedbackController::class, 'destroy'])->name('admin.ticketFeedback.delete');

        // Account
        Route::post('/user/logout', [AdminUserController::class, 'logout'])->name('user.logout');
        /*
         | Changing your own password from inside the panel.
         |
         | `ChangePasswordController::updatePassword` has always existed and was
         | never routed, so the form posted to `password.update` — a *reset*
         | endpoint expecting a token and an email. It could not succeed: the
         | form sends neither, so validation bounced it every time and the
         | screen looked like it simply ignored you. Retiring `password.update`
         | would have turned that silent failure into a 500, so it is wired to
         | its real handler here.
         */
        Route::get('/user/password', [ChangePasswordController::class, 'changePassword'])->name('change.password');
        Route::post('/user/password/update', [ChangePasswordController::class, 'updatePassword'])->name('update.user.password');
        Route::get('/user/profile', [ChangePasswordController::class, 'profileUpdate'])->name('profile.update');
        Route::post('/user/profile/update', [ChangePasswordController::class, 'updateProfile'])->name('update.user.profile');
    });
});

require __DIR__.'/booketik_studios.php';
