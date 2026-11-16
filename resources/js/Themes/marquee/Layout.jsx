import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Toaster } from 'react-hot-toast';
import { Menu, Palette, Search, X } from 'lucide-react';
import { useFooter, useNavBar, useNewsletter } from '@/Core/chrome';
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
import { Band, Button, cn, GUTTER } from './components/ui';

/*
 | Marquee's shell: a black band across the top (in both modes) with the name
 | in Anton, mono navigation and a search bar; a black band again at the foot.
 | Pages use it as a persistent layout (`Page.layout = layout`); a Civic page
 | Marquee has not drawn is wrapped in this Layout too (app.jsx).
 */

function SearchBar({ className, onDone, id = 'mq-search' }) {
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
            <label htmlFor={id} className="sr-only">{t('Search events')}</label>
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
                id={id}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('Search: techno tonight under €20')}
                className="h-10 w-full rounded-[2px] border border-line bg-surface ps-9 pe-3 font-mono text-[13px] text-ink placeholder:text-muted focus:border-edge focus:outline-none focus:ring-0"
            />
        </form>
    );
}

function Header() {
    const url = useRoute();
    const viewer = useViewer();
    const { mobileMenuOpen, setMobileMenuOpen, isActive } = useNavBar();
    const themes = useThemeSwitcher();

    const nav = [
        { href: url('/discover'), label: t('Discover'), active: isActive('/discover') || isActive('/c/') },
        ...(viewer ? [{ href: url('/tickets'), label: t('My tickets'), active: isActive('/tickets') || isActive('/t/') }] : []),
        { href: url('/plus'), label: t('Plus'), active: isActive('/plus') },
    ];

    return (
        <Band as="header" className="sticky top-0 z-50">
            <a href="#main" className="skip-link">{t('Skip to content')}</a>
            <nav className={cn('flex h-16 items-center gap-4 lg:gap-8', GUTTER)} aria-label={t('Main')}>
                <Wordmark onBand />
                <SearchBar className="hidden max-w-[380px] flex-1 md:block" />
                <ul className="ms-auto hidden items-center lg:flex">
                    {nav.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={item.active ? 'page' : undefined}
                                className={cn('flex h-16 items-center border-b-4 px-4 font-mono text-[13px] font-medium uppercase tracking-[0.1em]', item.active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="ms-auto flex items-center gap-1 lg:ms-0">
                    <Link href={url('/search')} className="flex h-10 w-10 items-center justify-center text-ink md:hidden" aria-label={t('Search')}>
                        <Search className="h-5 w-5" />
                    </Link>
                    <div className="hidden items-center gap-1 lg:flex">
                        <LanguageSelector />
                        <ModeToggle />
                        {themes.enabled && (
                            <button type="button" onClick={themes.open} aria-label={t('Themes — currently :name', { name: themes.name })} title={t('Themes')} className="flex h-10 w-10 items-center justify-center text-ink hover:bg-raised">
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
                    <button type="button" className="flex h-10 w-10 items-center justify-center text-ink lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label={t('Open menu')}>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </nav>

            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="relative z-[60] lg:hidden">
                <div className="fixed inset-0 bg-scrim/70" aria-hidden="true" />
                <DialogPanel className="mq-band fixed inset-0 flex flex-col overflow-y-auto px-5 pb-8 pt-3">
                    <div className="flex h-12 items-center justify-between">
                        <Wordmark onBand size="sm" onNavigate={() => setMobileMenuOpen(false)} />
                        <button type="button" onClick={() => setMobileMenuOpen(false)} className="flex h-10 w-10 items-center justify-center text-ink" aria-label={t('Close menu')}>
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <SearchBar id="mq-search-m" className="mt-4" onDone={() => setMobileMenuOpen(false)} />
                    <ul className="mt-6 border-t border-line">
                        {[...nav, ...(viewer ? [{ href: url('/account'), label: t('Account'), active: isActive('/account') }, viewer.organizer?.count > 0 ? { href: url(viewer.organizer.slug ? `/organizer/dashboard/${viewer.organizer.slug}` : '/organizer/dashboard'), label: t('Organizer dashboard'), active: isActive('/organizer') } : { href: url('/organizer/dashboard'), label: t('Host an event'), active: isActive('/organizer') }] : [])].map((item) => (
                            <li key={item.href} className="border-b border-line">
                                <Link href={item.href} onClick={() => setMobileMenuOpen(false)} aria-current={item.active ? 'page' : undefined} className={cn('block py-3 font-display text-[44px] leading-none', item.active ? 'text-ink underline decoration-4 underline-offset-8' : 'text-muted')}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6">
                        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">{t('Appearance')}</p>
                        <ModeToggle variant="segmented" />
                        {themes.enabled && (
                            <button type="button" onClick={() => { setMobileMenuOpen(false); themes.open(); }} className="mt-2 flex h-12 w-full items-center gap-3 font-mono text-sm uppercase tracking-[0.08em] text-ink">
                                <Palette className="h-5 w-5" />
                                {t('Themes')}
                                <span className="ms-auto text-muted">{themes.name}</span>
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
        </Band>
    );
}

function Footer() {
    const { webSettings, year, companyName, quickLinks, resources, footerPages } = useFooter();
    const { email, setEmail, submitting, subscribe } = useNewsletter();

    return (
        <Band as="footer" className="mt-24">
            <div className={cn('grid gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]', GUTTER)}>
                <div>
                    <p className="font-display text-[64px] leading-[0.85] text-ink sm:text-[88px]">{companyName}</p>
                    {webSettings?.footer_description && <p className="mt-4 max-w-sm text-[15px] text-muted">{webSettings.footer_description}</p>}
                    {webSettings?.footer_newsletter_status ? (
                        <form onSubmit={subscribe} className="mt-6 flex max-w-sm gap-2">
                            <label htmlFor="mq-newsletter" className="sr-only">{t('Email')}</label>
                            <input id="mq-newsletter" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Your email')} className="h-11 min-w-0 flex-1 rounded-[2px] border border-line bg-surface px-3 font-mono text-[13px] text-ink placeholder:text-muted focus:border-edge focus:ring-0" />
                            <Button type="submit" variant="cta" loading={submitting}>{t('Subscribe')}</Button>
                        </form>
                    ) : null}
                </div>
                {[{ title: t('Explore'), links: quickLinks }, { title: t('You'), links: resources }, { title: t('About'), links: footerPages.map((p) => ({ name: t(p.title), url: p.url })) }].map((col) => (
                    <div key={col.title}>
                        <p className="border-b border-line pb-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">{col.title}</p>
                        <ul className="mt-3 space-y-2">
                            {col.links.map((l) => (
                                <li key={l.url}><Link href={l.url} className="font-mono text-[13px] uppercase tracking-[0.06em] text-ink hover:underline">{l.name}</Link></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 font-mono text-xs uppercase tracking-[0.08em] text-muted', GUTTER)}>
                <p>{webSettings?.footer_copyright_text || `© ${year} ${companyName}`}</p>
                <p>{t('Maps © OpenStreetMap contributors')}</p>
            </div>
        </Band>
    );
}

export default function Layout({ children }) {
    const { currencies } = usePage().props;
    if (currencies) setCurrencyRules(currencies);

    return (
        <div className="flex min-h-screen flex-col bg-bg font-sans text-body">
            <Toaster position="bottom-center" toastOptions={{ style: { ...toastStyle, borderRadius: '2px' } }} />
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
