import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Toaster } from 'react-hot-toast';
import { BadgeCheck, CalendarRange, Compass, Menu, Palette, Search, Ticket, User, X } from 'lucide-react';
import { useNavBar, useFooter, useNewsletter } from '@/Core/chrome';
import { useRoute, useViewer } from '@/Core/site';
import { useThemeSwitcher } from '@/Core/switcher';
import { toastStyle } from '@/Core/bridge';
import { openAuthDialog } from '@/Core/auth';
import { setCurrencyRules } from '@/Core/lib/format';
import { t } from '@/Core/i18n';
import Wordmark from './components/chrome/Wordmark';
import DropdownUser from './components/chrome/DropdownUser';
import LanguageSelector from './components/chrome/LanguageSelector';
import ModeToggle from './components/chrome/ModeToggle';
import NotificationsBell from './components/chrome/NotificationsBell';
import OpenInAppBanner from './components/chrome/OpenInAppBanner';
import { Button, cn, GUTTER } from './components/ui';

/*
 | Daylight Civic's shell: a paper header with a search pill, the footer, the
 | toaster and the app banner. Pages use it as a persistent Inertia layout
 | (`Page.layout = layout`), so the header survives navigation; under another
 | theme a Civic page is wrapped in *that* theme's Layout instead (app.jsx).
 */

function SearchPill({ className, onDone }) {
    const url = useRoute();
    const [q, setQ] = useState('');
    return (
        <form
            role="search"
            className={cn('relative', className)}
            onSubmit={(e) => {
                e.preventDefault();
                onDone?.();
                router.get(url('/search'), q.trim() ? { q: q.trim() } : {});
            }}
        >
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor="site-search" className="sr-only">{t('Search events')}</label>
            <input
                id="site-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('Try “jazz this weekend under €20”')}
                className="h-11 w-full rounded-chip border-key border-line bg-surface ps-10 pe-4 text-[15px] text-ink placeholder:text-muted focus:border-edge focus:outline-none focus:ring-0"
            />
        </form>
    );
}

function Header() {
    const url = useRoute();
    const viewer = useViewer();
    const { mobileMenuOpen, setMobileMenuOpen, isScrolled, isActive } = useNavBar();
    const themes = useThemeSwitcher();

    const nav = [
        { href: url('/discover'), label: t('Discover'), icon: Compass, active: isActive('/discover') || isActive('/c/') },
        ...(viewer ? [{ href: url('/tickets'), label: t('My tickets'), icon: Ticket, active: isActive('/tickets') || isActive('/t/') }] : []),
        // BOOKETIK_SOLUTIONS_R4: replace the public entry only; Plus routes and purchase flows remain intact.
        { href: url('/solutions'), label: t('Solutions'), icon: BadgeCheck, active: isActive('/solutions') },
    ];

    return (
        <header className={cn('sticky top-0 z-50 border-b bg-bg transition-colors', isScrolled ? 'border-line' : 'border-transparent')}>
            <a href="#main" className="skip-link">{t('Skip to content')}</a>
            <nav className={cn('flex h-16 items-center gap-3 lg:gap-6', GUTTER)} aria-label={t('Main')}>
                <Wordmark />
                <SearchPill className="hidden max-w-[420px] flex-1 md:block" />
                <ul className="ms-auto hidden items-center gap-1 lg:flex">
                    {nav.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={item.active ? 'page' : undefined}
                                className={cn('flex h-10 items-center gap-1.5 rounded-chip px-3.5 text-[15px] font-semibold', item.active ? 'bg-ink text-bg' : 'text-ink hover:bg-raised')}
                            >
                                <item.icon className="h-4 w-4" aria-hidden="true" />
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="ms-auto flex items-center gap-1 lg:ms-0">
                    <Link href={url('/search')} className="flex h-10 w-10 items-center justify-center rounded-chip text-ink hover:bg-raised md:hidden" aria-label={t('Search')}>
                        <Search className="h-5 w-5" />
                    </Link>
                    <div className="hidden items-center gap-1 lg:flex">
                        <LanguageSelector />
                        <ModeToggle />
                        {themes.enabled && (
                            <button type="button" onClick={themes.open} aria-label={t('Themes — currently :name', { name: themes.name })} title={t('Themes')} className="flex h-10 w-10 items-center justify-center rounded-chip text-ink hover:bg-raised">
                                <Palette className="h-[18px] w-[18px]" />
                            </button>
                        )}
                    </div>
                    {viewer ? (
                        <>
                            <NotificationsBell />
                            <div className="hidden lg:block"><DropdownUser user={viewer} /></div>
                        </>
                    ) : (
                        <Button
                            variant="secondary"
                            size="sm"
                            href="?auth=signin"
                            onClick={(e) => {
                                e.preventDefault();
                                openAuthDialog('login');
                            }}
                            className="hidden sm:inline-flex"
                        >
                            {t('Sign in')}
                        </Button>
                    )}
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-chip text-ink hover:bg-raised lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label={t('Open menu')}>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </nav>

            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="relative z-[60] lg:hidden">
                <div className="fixed inset-0 bg-scrim/50" aria-hidden="true" />
                <DialogPanel className="fixed inset-y-0 end-0 flex w-full max-w-sm flex-col overflow-y-auto border-s-key border-edge bg-bg px-5 pb-8 pt-4">
                    <div className="flex h-12 items-center justify-between">
                        <Wordmark size="sm" onNavigate={() => setMobileMenuOpen(false)} />
                        <button type="button" onClick={() => setMobileMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-chip hover:bg-raised" aria-label={t('Close menu')}>
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <SearchPill className="mt-4" onDone={() => setMobileMenuOpen(false)} />
                    <ul className="mt-5 space-y-1">
                        {[...nav, ...(viewer ? [{ href: url('/account'), label: t('Account'), icon: User, active: isActive('/account') }, viewer.organizer?.count > 0 ? { href: url(viewer.organizer.slug ? `/organizer/dashboard/${viewer.organizer.slug}` : '/organizer/dashboard'), label: t('Organizer dashboard'), icon: CalendarRange, active: isActive('/organizer') } : { href: url('/organizer/dashboard'), label: t('Host an event'), icon: CalendarRange, active: isActive('/organizer') }] : [])].map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} onClick={() => setMobileMenuOpen(false)} className={cn('flex h-12 items-center gap-3 rounded-sm px-3 text-[17px] font-semibold', item.active ? 'bg-ink text-bg' : 'text-ink hover:bg-raised')}>
                                    <item.icon className="h-5 w-5" aria-hidden="true" />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 border-t border-line pt-5">
                        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">{t('Appearance')}</p>
                        <ModeToggle variant="segmented" />
                        {themes.enabled && (
                            <button type="button" onClick={() => { setMobileMenuOpen(false); themes.open(); }} className="mt-2 flex h-12 w-full items-center gap-3 rounded-sm px-3 text-[17px] font-semibold text-ink hover:bg-raised">
                                <Palette className="h-5 w-5" />
                                {t('Themes')}
                                <span className="ms-auto text-sm font-normal text-muted">{themes.name}</span>
                            </button>
                        )}
                    </div>
                    <div className="mt-5 border-t border-line pt-5">
                        <LanguageSelector variant="mobile" />
                    </div>
                    {!viewer && (
                        <Button variant="cta" block size="lg" className="mt-6" onClick={() => { setMobileMenuOpen(false); openAuthDialog('login'); }}>
                            {t('Sign in')}
                        </Button>
                    )}
                </DialogPanel>
            </Dialog>
        </header>
    );
}

function Footer() {
    const { webSettings, year, companyName, quickLinks, resources, footerPages } = useFooter();
    const { email, setEmail, submitting, subscribe } = useNewsletter();

    return (
        <footer className="mt-24 border-t-key border-edge bg-surface">
            <div className={cn('grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]', GUTTER)}>
                <div>
                    <Wordmark />
                    {webSettings?.footer_description && <p className="mt-3 max-w-xs text-[15px] text-muted">{webSettings.footer_description}</p>}
                    {webSettings?.footer_newsletter_status ? (
                        <form onSubmit={subscribe} className="mt-5 flex max-w-sm gap-2">
                            <label htmlFor="newsletter" className="sr-only">{t('Email')}</label>
                            <input id="newsletter" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Your email')} className="h-11 min-w-0 flex-1 rounded-btn border-key border-line bg-bg px-3.5 text-[15px] text-ink placeholder:text-muted focus:border-edge focus:ring-0" />
                            <Button type="submit" variant="primary" loading={submitting}>{t('Subscribe')}</Button>
                        </form>
                    ) : null}
                </div>
                {[{ title: t('Explore'), links: quickLinks }, { title: t('You'), links: resources }, { title: t('About'), links: footerPages.map((p) => ({ name: t(p.title), url: p.url })) }].map((col) => (
                    <div key={col.title}>
                        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">{col.title}</p>
                        <ul className="mt-3 space-y-2">
                            {col.links.map((l) => (
                                <li key={l.url}><Link href={l.url} className="text-[15px] text-ink hover:underline">{l.name}</Link></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-sm text-muted', GUTTER)}>
                <p>{webSettings?.footer_copyright_text || `© ${year} ${companyName}`}</p>
                <p>{t('Maps © OpenStreetMap contributors')}</p>
            </div>
        </footer>
    );
}

export default function Layout({ children }) {
    const { currencies } = usePage().props;
    if (currencies) setCurrencyRules(currencies);

    return (
        <div className="flex min-h-screen flex-col bg-bg font-sans text-body">
            <Toaster position="bottom-center" toastOptions={{ style: toastStyle }} />
            <Header />
            <main id="main" className="w-full flex-1 overflow-x-clip">
                <OpenInAppBanner />
                {children}
            </main>
            <Footer />
        </div>
    );
}

/** Persistent layout for pages: `Page.layout = layout`. */
export const layout = (page) => <Layout>{page}</Layout>;

export function PageHead({ title }) {
    return <Head title={title} />;
}
