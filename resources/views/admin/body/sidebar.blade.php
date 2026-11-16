{{--
    Eventgoo admin navigation.

    Icons: Material Design Icons 3.0.39, pinned in admin_master.blade.php.
    That release predates many `-outline` variants — using one renders blank
    space, not a fallback glyph. Check an icon exists in 3.0.39 before adding it.

    The menu is data, not markup. Every group and item used to be hand-written
    `<li>` blocks, and the highlight patterns, the open-group test and the links
    drifted apart whenever a screen was added. Here one array says what each
    entry links to, which route names light it up, and who may see it; the
    loop below is the only markup. Highlighting is derived from the current
    route and is mutually exclusive by construction.

    `adminOnly` marks entries only an administrator sees (money, configuration);
    moderators get everything else. The routes enforce the same split — hiding
    a link is a courtesy, not the gate.
--}}
@php
    $locale = app()->getLocale();
    $isAdmin = (bool) auth()->user()?->isAdmin();
    $is = fn (array $patterns): bool => $patterns !== [] && request()->routeIs(...$patterns);
    $lit = fn (array $i): bool => $i['on'] ?? $is($i['active']);

    /*
     | Work waiting, shown as a badge where it is done. Cheap COUNTs on indexed
     | columns; the panel is not a hot path.
     */
    $queue = \App\Models\Event::query()->whereIn('moderation_status', \App\Support\Moderation::QUEUE)->count();
    $pendingSupport = \App\Models\SupportTicket::query()->where('status', 'pending')->count();
    $pendingReports = \App\Models\EventReport::query()->where('status', \App\Models\EventReport::STATUS_PENDING)->count();
    $waitingPayouts = $isAdmin
        ? \App\Models\Payout::query()->where('status', \App\Enums\PayoutStatus::Requested->value)->count()
        : 0;

    // `$on` overrides the route test, for two entries on one route (All events / Review queue).
    $item = fn (string $label, string $route, array $active, bool $adminOnly = false, int $badge = 0, array $params = [], ?bool $on = null) =>
        compact('label', 'route', 'active', 'adminOnly', 'badge', 'params', 'on');
    $onQueue = request()->routeIs('admin.events.index') && request()->query('moderation') === 'queue';

    $menu = [
        ['label' => __('dashboard.dashboard'), 'icon' => 'mdi-view-dashboard-outline', 'item' => $item(__('dashboard.dashboard'), 'dashboard', ['dashboard'])],

        ['label' => __('Events'), 'icon' => 'mdi-calendar', 'id' => 'nav-events', 'items' => [
            $item(__('All events'), 'admin.events.index', ['admin.events.index', 'admin.events.edit', 'admin.events.registrations', 'admin.ticket-types.*'], on: $onQueue ? false : null),
            $item(__('Review queue'), 'admin.events.index', [], badge: $queue, params: ['moderation' => 'queue'], on: $onQueue),
            $item(__('External events'), 'admin.external-events.index', ['admin.external-events.*'], adminOnly: true),
        ]],

        ['label' => __('Check-ins'), 'icon' => 'mdi-qrcode-scan', 'id' => 'nav-checkins', 'items' => [
            $item(__('Live doors'), 'admin.check-ins.live', ['admin.check-ins.live']),
            $item(__('Audit log'), 'admin.check-ins.index', ['admin.check-ins.index']),
        ]],

        ['label' => __('Organizers'), 'icon' => 'mdi-account-multiple', 'id' => 'nav-organizers', 'items' => [
            $item(__('All organizers'), 'admin.organizers.index', ['admin.organizers.*']),
            $item(__('Payouts'), 'admin.payouts.index', ['admin.payouts.*'], adminOnly: true, badge: $waitingPayouts),
            $item(__('Refunds'), 'admin.refunds.index', ['admin.refunds.*'], adminOnly: true),
        ]],

        ['label' => __('Categories & tags'), 'icon' => 'mdi-tag-multiple', 'id' => 'nav-taxonomy', 'items' => [
            $item(__('Categories'), 'admin.categories.index', ['admin.categories.*']),
            $item(__('Tags'), 'admin.tags.index', ['admin.tags.*']),
        ]],

        ['label' => __('Orders'), 'icon' => 'mdi-cash-multiple', 'id' => 'nav-orders', 'items' => [
            $item(__('Orders'), 'admin.billing.orders', ['admin.billing.orders', 'admin.billing.orders.*']),
            $item(__('Subscriptions'), 'admin.billing.subscriptions', ['admin.billing.subscriptions', 'admin.billing.subscriptions.*']),
        ]],

        ['label' => __('Reports'), 'icon' => 'mdi-flag', 'id' => 'nav-reports', 'items' => [
            $item(__('Event reports'), 'admin.reports.index', ['admin.reports.index', 'admin.reports.review', 'admin.reports.dismiss', 'admin.reports.reopen'], badge: $pendingReports),
            $item(__('Fraud flags'), 'admin.reports.fraud', ['admin.reports.fraud']),
        ]],

        ['label' => __('AI'), 'icon' => 'mdi-chip', 'id' => 'nav-ai', 'items' => [
            $item(__('Usage & cost'), 'admin.ai.usage', ['admin.ai.usage']),
            $item(__('Settings'), 'admin.ai.settings', ['admin.ai.settings', 'admin.ai.settings.*'], adminOnly: true),
            $item(__('Moderation log'), 'admin.ai.moderation', ['admin.ai.moderation']),
        ]],

        ['label' => __('dashboard.users'), 'icon' => 'mdi-account', 'id' => 'nav-users', 'items' => [
            $item(__('dashboard.all_users'), 'admin.all.users', ['admin.all.users', 'admin.user.show', 'admin.users.search', 'admin.user.plus']),
            $item(__('dashboard.sessions'), 'admin.all.sessions', ['admin.all.sessions'], adminOnly: true),
        ]],

        ['label' => __('Plans & fees'), 'icon' => 'mdi-percent', 'id' => 'nav-plans', 'items' => [
            $item(__('Ticket fees & payouts'), 'admin.fees.edit', ['admin.fees.*'], adminOnly: true),
            $item(__('Plans'), 'admin.billing.catalogue', ['admin.billing.catalogue', 'admin.billing.plans', 'admin.billing.plans.*', 'admin.billing.sellables.*']),
            $item(__('Payment providers'), 'admin.billing.providers', ['admin.billing.providers', 'admin.billing.providers.*']),
        ]],

        ['label' => __('Home sections'), 'icon' => 'mdi-view-quilt', 'item' => $item(__('Home sections'), 'admin.home-sections.index', ['admin.home-sections.*'])],

        ['label' => __('Media'), 'icon' => 'mdi-folder-multiple-image', 'id' => 'nav-media', 'items' => [
            $item(__('Library'), 'admin.media.index', ['admin.media.index']),
            $item(__('Storage & CDN'), 'admin.media.storage.index', ['admin.media.storage.*'], adminOnly: true),
        ]],

        ['label' => __('dashboard.content'), 'icon' => 'mdi-file-document', 'id' => 'nav-content', 'items' => [
            $item(__('Blog'), 'admin.blogs.index', ['admin.blogs.*']),
            $item(__('FAQs'), 'admin.faqs.index', ['admin.faqs.*']),
            $item(__('dashboard.pages'), 'admin.content.pages', ['admin.content.pages', 'admin.content.pages.*'], adminOnly: true),
            $item(__('dashboard.notifications'), 'admin.all.notifications', ['admin.all.notifications', 'admin.send.notification'], adminOnly: true),
            $item(__('dashboard.newsletters'), 'admin.all.newsletters', ['admin.all.newsletters'], adminOnly: true),
            $item(__('dashboard.email_templates'), 'admin.email-templates.index', ['admin.email-templates.*'], adminOnly: true),
        ]],

        ['label' => __('dashboard.support'), 'icon' => 'mdi-comment-question-outline', 'id' => 'nav-support', 'items' => [
            $item(__('Requests'), 'admin.support.index', ['admin.support.*'], badge: $pendingSupport),
            $item(__('dashboard.contact_messages'), 'admin.all.contactMessages', ['admin.all.contactMessages']),
            $item(__('dashboard.ticket_feedbacks'), 'admin.all.allTicketFeedbacks', ['admin.all.allTicketFeedbacks']),
        ]],

        ['label' => __('Appearance'), 'icon' => 'mdi-palette', 'id' => 'nav-appearance', 'adminOnly' => true, 'items' => [
            $item(__('Themes'), 'admin.themes.index', ['admin.themes.*']),
        ]],

        ['label' => __('dashboard.settings'), 'icon' => 'mdi-settings', 'id' => 'nav-settings', 'adminOnly' => true, 'items' => [
            $item(__('dashboard.general_settings'), 'admin.settings.general', ['admin.settings.general']),
            $item(__('dashboard.app_settings'), 'admin.settings.app', ['admin.settings.app', 'admin.save.app.settings']),
            $item(__('dashboard.web_settings'), 'admin.settings.web', ['admin.settings.web', 'admin.save.web.settings']),
            $item(__('dashboard.contact_settings'), 'admin.settings.contact', ['admin.settings.contact', 'admin.save.contact.settings']),
            $item(__('dashboard.locales'), 'admin.all.locales', ['admin.all.locales', 'admin.locales.*']),
            $item(__('Currencies'), 'admin.settings.currencies.index', ['admin.settings.currencies.*']),
            $item(__('Integrations'), 'admin.settings.integrations', ['admin.settings.integrations', 'admin.settings.integrations.*']),
            $item(__('Deep links'), 'admin.settings.deep-links.index', ['admin.settings.deep-links.*']),
            $item(__('Maps'), 'admin.settings.maps', ['admin.settings.maps', 'admin.settings.maps.*']),
            $item(__('dashboard.smtp_settings'), 'admin.settings.smtp', ['admin.settings.smtp']),
            $item(__('dashboard.social_login'), 'admin.settings.social-login', ['admin.settings.social-login']),
            $item(__('dashboard.captcha'), 'admin.settings.captcha', ['admin.settings.captcha']),
        ]],
    ];

    $visible = fn (array $entry): bool => $isAdmin || ! ($entry['adminOnly'] ?? false);
    $href = fn (array $i): string => route($i['route'], ['locale' => $locale] + $i['params']);
@endphp

<aside class="left-sidebar bg-sidebar">
    <div id="sidebar" class="sidebar sidebar-scrollbar">
        <div class="app-brand">
            <a href="{{ route('dashboard', ['locale' => $locale]) }}">
                <span class="brand-name">{{ \App\Support\SiteBrand::name() }}</span>
            </a>
        </div>

        <div class="sidebar-scrollbar">
            <ul class="nav sidebar-inner" id="sidebar-menu">
                @foreach ($menu as $group)
                    @continue(! $visible($group))

                    @isset($group['item'])
                        <li @class(['has-sub', 'active' => $lit($group['item'])])>
                            <a class="sidenav-item-link" href="{{ $href($group['item']) }}">
                                <i class="mdi {{ $group['icon'] }}"></i>
                                <span class="nav-text">{{ $group['label'] }}</span>
                                @if ($group['item']['badge'] > 0)
                                    <span class="badge badge-pill badge-warning ml-auto">{{ $group['item']['badge'] }}</span>
                                @endif
                            </a>
                        </li>
                    @else
                        @php
                            $items = array_values(array_filter($group['items'], $visible));
                            $groupOpen = collect($items)->contains(fn ($i) => $lit($i));
                        @endphp
                        @continue($items === [])

                        <li @class(['has-sub', 'expand' => $groupOpen])>
                            <a class="sidenav-item-link" href="javascript:void(0)" data-bs-toggle="collapse"
                               data-bs-target="#{{ $group['id'] }}" aria-expanded="{{ $groupOpen ? 'true' : 'false' }}"
                               aria-controls="{{ $group['id'] }}">
                                <i class="mdi {{ $group['icon'] }}"></i>
                                <span class="nav-text">{{ $group['label'] }}</span> <b class="caret"></b>
                            </a>
                            <ul @class(['collapse', 'show' => $groupOpen]) id="{{ $group['id'] }}" data-parent="#sidebar-menu">
                                <div class="sub-menu">
                                    @foreach ($items as $i)
                                        <li @class(['active' => $lit($i)])>
                                            <a class="sidenav-item-link" href="{{ $href($i) }}">
                                                <span class="nav-text">{{ $i['label'] }}</span>
                                                @if ($i['badge'] > 0)
                                                    <span class="badge badge-pill badge-warning ml-auto">{{ $i['badge'] }}</span>
                                                @endif
                                            </a>
                                        </li>
                                    @endforeach
                                </div>
                            </ul>
                        </li>
                    @endisset
                @endforeach
            </ul>
        </div>
    </div>
</aside>
