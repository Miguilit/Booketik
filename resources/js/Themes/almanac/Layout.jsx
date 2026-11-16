import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Toaster } from 'react-hot-toast';
import { Menu, Palette, Search, X } from 'lucide-react';
import { useFooter, useNavBar, useNewsletter } from '@/Core/chrome';
import { useLocale, useRoute, useViewer } from '@/Core/site';
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
 | Almanac's shell: a masthead like the cover of a printed programme — the
 | name in serif, a dated rule line, a quiet nav — and a colophon footer.
 | Used as a persistent layout (`Page.layout = layout`); Civic pages shown
 | under Almanac are wrapped in this Layout by app.jsx.
 */

/** The masthead's date, in the page's language (works on the SSR server too). */
function today(locale) {
    try {
        return new Intl.DateTimeFormat(locale || 'en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    } catch {
        return '';
    }
}

function SearchField({ className, onDone, id = 'al-search' }) {
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
            <Search className="pointer-events-none absolute start-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
                id={id}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('Search the programme')}
                className="h-10 w-full border-0 border-b border-line bg-transparent ps-6 pe-1 font-display text-[18px] italic text-ink placeholder:text-muted focus:border-ink focus:ring-0"
            />
        </form>
    );
}

function Masthead() {
    const url = useRoute();
    const locale = useLocale();
    const viewer = useViewer();
    const { mobileMenuOpen, setMobileMenuOpen, isActive } = useNavBar();
    const themes = useThemeSwitcher();

    const nav = [
        { href: url('/discover'), label: t('Listings'), active: isActive('/discover') || isActive('/c/') },
        { href: url('/search'), label: t('Search'), active: isActive('/search') },
        ...(viewer ? [{ href: url('/tickets'), label: t('My tickets'), active: isActive('/tickets') || isActive('/t/') }] : []),
        { href: url('/plus'), label: t('Plus'), active: isActive('/plus') },
    ];

    return (
        <header className="relative z-40 bg-bg">
            <a href="#main" className="skip-link">{t('Skip to content')}</a>
            <div className={cn('flex items-center justify-between gap-3 border-b border-line py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted', GUTTER)}>
                <span className="truncate" suppressHydrationWarning>{t('Programme')} · {today(locale)}</span>
                <div className="hidden items-center gap-1 normal-case tracking-normal lg:flex">
                    <LanguageSelector />
                    <ModeToggle />
                    {themes.enabled && (
                        <button type="button" onClick={themes.open} aria-label={t('Themes — currently :name', { name: themes.name })} title={t('Themes')} className="flex h-9 w-9 items-center justify-center rounded-chip text-ink hover:bg-raised">
                            <Palette className="h-[18px] w-[18px]" />
                        </button>
                    )}
                </div>
            </div>
            <nav className={cn('flex items-end gap-6 pb-3 pt-4', GUTTER)} aria-label={t('Main')}>
                <Wordmark size="lg" />
                <ul className="mb-1 hidden items-center gap-5 lg:flex">
                    {nav.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} aria-current={item.active ? 'page' : undefined} className={cn('font-display text-[19px] decoration-1 underline-offset-[6px] hover:underline', item.active ? 'text-ink underline' : 'text-body')}>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="ms-auto mb-0.5 flex items-center gap-2">
                    <SearchField className="hidden w-64 xl:block" />
                    {viewer ? (
                        <>
                            <NotificationsBell />
                            <div className="hidden lg:block"><DropdownUser user={viewer} /></div>
                        </>
                    ) : (
                        <Button variant="secondary" size="sm" href="?auth=signin" onClick={(e) => { e.preventDefault(); openAuthDialog('login'); }} className="hidden sm:inline-flex">
                            {t('Sign in')}
                        </Button>
                    )}
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-chip text-ink hover:bg-raised lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label={t('Open menu')}>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </nav>
            <div className={cn('al-rule-double', GUTTER)} aria-hidden="true" />

            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="relative z-[60] lg:hidden">
                <div className="fixed inset-0 bg-scrim/45" aria-hidden="true" />
                <DialogPanel className="fixed inset-y-0 end-0 flex w-full max-w-sm flex-col overflow-y-auto border-s border-line bg-bg px-6 pb-8 pt-4">
                    <div className="flex h-12 items-center justify-between">
                        <Wordmark size="sm" onNavigate={() => setMobileMenuOpen(false)} />
                        <button type="button" onClick={() => setMobileMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-chip hover:bg-raised" aria-label={t('Close menu')}>
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <SearchField className="mt-4" id="al-search-mobile" onDone={() => setMobileMenuOpen(false)} />
                    <ul className="mt-6 divide-y divide-line border-y border-line">
                        {[...nav, ...(viewer ? [{ href: url('/account'), label: t('Account'), active: isActive('/account') }, viewer.organizer?.count > 0 ? { href: url(viewer.organizer.slug ? `/organizer/dashboard/${viewer.organizer.slug}` : '/organizer/dashboard'), label: t('Organizer dashboard'), active: isActive('/organizer') } : { href: url('/organizer/dashboard'), label: t('Host an event'), active: isActive('/organizer') }] : [])].map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} onClick={() => setMobileMenuOpen(false)} aria-current={item.active ? 'page' : undefined} className={cn('block py-3 font-display text-[24px]', item.active ? 'italic text-link' : 'text-ink')}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6">
                        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{t('Appearance')}</p>
                        <ModeToggle variant="segmented" />
                        {themes.enabled && (
                            <button type="button" onClick={() => { setMobileMenuOpen(false); themes.open(); }} className="mt-2 flex h-12 w-full items-center gap-3 rounded-sm px-1 text-[17px] text-ink hover:bg-raised">
                                <Palette className="h-5 w-5" />
                                {t('Themes')}
                                <span className="ms-auto text-sm text-muted">{themes.name}</span>
                            </button>
                        )}
                    </div>
                    <div className="mt-5 border-t border-line pt-5"><LanguageSelector variant="mobile" /></div>
                    {!viewer && (
                        <Button variant="cta" block size="lg" className="mt-6" onClick={() => { setMobileMenuOpen(false); openAuthDialog('login'); }}>{t('Sign in')}</Button>
                    )}
                </DialogPanel>
            </Dialog>
        </header>
    );
}

function Colophon() {
    const { webSettings, year, companyName, quickLinks, resources, footerPages } = useFooter();
    const { email, setEmail, submitting, subscribe } = useNewsletter();

    return (
        <footer className="mt-24">
            <div className={cn('al-rule-double', GUTTER)} aria-hidden="true" />
            <div className={cn('grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:divide-x md:divide-line rtl:md:divide-x-reverse', GUTTER)}>
                <div className="md:pe-8">
                    <Wordmark />
                    {webSettings?.footer_description && <p className="mt-3 max-w-xs font-display text-[18px] italic text-muted">{webSettings.footer_description}</p>}
                    {webSettings?.footer_newsletter_status ? (
                        <form onSubmit={subscribe} className="mt-5 flex max-w-sm items-end gap-3">
                            <label htmlFor="al-newsletter" className="sr-only">{t('Email')}</label>
                            <input id="al-newsletter" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Your email')} className="h-10 min-w-0 flex-1 border-0 border-b border-line bg-transparent px-0 text-[15px] text-ink placeholder:text-muted focus:border-ink focus:ring-0" />
                            <Button type="submit" variant="primary" size="sm" loading={submitting}>{t('Subscribe')}</Button>
                        </form>
                    ) : null}
                </div>
                {[{ title: t('The programme'), links: quickLinks }, { title: t('Your copy'), links: resources }, { title: t('Colophon'), links: footerPages.map((p) => ({ name: t(p.title), url: p.url })) }].map((col) => (
                    <div key={col.title} className="md:ps-8">
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{col.title}</p>
                        <ul className="mt-3 space-y-2">
                            {col.links.map((l) => (
                                <li key={l.url}><Link href={l.url} className="font-display text-[18px] text-ink hover:italic hover:text-link">{l.name}</Link></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted', GUTTER)}>
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
        <div className="flex min-h-screen flex-col font-sans text-body">
            <Toaster position="bottom-center" toastOptions={{ style: toastStyle }} />
            <Masthead />
            <main id="main" className="w-full flex-1 overflow-x-clip">
                <OpenInAppBanner />
                {children}
            </main>
            <Colophon />
        </div>
    );
}

/** Persistent layout for pages: `Page.layout = layout`. */
export const layout = (page) => <Layout>{page}</Layout>;
