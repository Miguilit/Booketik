/*
 | The organizer dashboard's shell: a paper sidebar (the hub, its sections,
 | badges), the organizer switcher, the verify-email and suspension notices,
 | the toaster and flash messages. Always Civic. Pages use `dashLayout`.
 */
import { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Dialog, DialogPanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import toast, { Toaster } from 'react-hot-toast';
import {
    BadgeCheck, CalendarDays, Check, ChevronsUpDown, CreditCard, ExternalLink, Gauge, Landmark, Megaphone, Menu as MenuIcon,
    MessageCircleQuestion, Plus, ReceiptText, Store, UserRound, Users, UsersRound, X,
} from 'lucide-react';
import { useDashboard, dashboardHref } from '@/Core/dashboard';
import { openVerifyEmailDialog } from '@/Core/auth';
import { toastStyle } from '@/Core/bridge';
import { setCurrencyRules } from '@/Core/lib/format';
import { t } from '@/Core/i18n';
import Wordmark from '../chrome/Wordmark';
import ModeToggle from '../chrome/ModeToggle';
import { Avatar, Button, cn, Notice } from '../ui';

function useNav() {
    const { frame, path, can, role } = useDashboard();
    const badges = frame?.badges ?? {};
    return [
        { href: path(''), label: t('Overview'), icon: Gauge, exact: true },
        { href: path('/events'), label: t('Events'), icon: CalendarDays },
        { href: path('/guests'), label: t('Guests'), icon: UsersRound, badge: badges.approvals },
        can.sales && { href: path('/promote'), label: t('Promote'), icon: Megaphone },
        can.sales && { href: path('/payouts'), label: t('Payouts'), icon: Landmark },
        can.sales && { href: path('/refunds'), label: t('Refund requests'), icon: ReceiptText, badge: badges.refunds },
        role !== 'checkin_staff' && { href: path('/team'), label: t('Team'), icon: Users },
        can.billing && { href: path('/billing'), label: t('Plan & billing'), icon: CreditCard },
        can.team && { href: path('/profile'), label: t('Organizer profile'), icon: Store },
    ].filter(Boolean);
}

function NavList({ onNavigate }) {
    const nav = useNav();
    const { url } = usePage();
    const here = url.split('?')[0];
    return (
        <ul className="space-y-0.5">
            {nav.map((item) => {
                const active = item.exact ? here === item.href : here === item.href || here.startsWith(`${item.href}/`);
                return (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            className={cn('flex h-11 items-center gap-3 rounded-sm px-3 text-[15px] font-semibold transition-colors', active ? 'bg-ink text-bg' : 'text-ink hover:bg-raised')}
                        >
                            <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {item.badge ? <span className={cn('rounded-chip px-2 py-0.5 font-mono text-xs', active ? 'bg-bg/20' : 'bg-tint-2 text-on-tint-2')}>{item.badge}</span> : null}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

/** The current hub and a menu of the others the viewer is on. */
function OrgSwitcher() {
    const { frame, org } = useDashboard();
    const others = frame?.orgs ?? [];
    return (
        <Menu as="div" className="relative">
            <MenuButton className="flex w-full items-center gap-3 rounded-card border-key border-edge bg-surface p-2.5 text-start shadow-key">
                <Avatar image={org?.avatar} name={org?.name} size={36} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[16px] font-bold text-ink">{org?.name}</span>
                    <span className="block font-mono text-[11px] uppercase tracking-wider text-muted">{org?.plan?.name} · {roleName(frame?.role)}</span>
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            </MenuButton>
            <MenuItems anchor="bottom start" className="z-[70] mt-1 w-[260px] rounded-card border-key border-edge bg-surface p-1.5 shadow-key focus:outline-none">
                {others.map((m) => (
                    <MenuItem key={m.organizer.slug}>
                        <Link href={dashboardHref(m.organizer.slug)} className="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-ink data-[focus]:bg-raised">
                            <Avatar image={m.organizer.avatar} name={m.organizer.name} size={28} />
                            <span className="min-w-0 flex-1 truncate font-semibold">{m.organizer.name}</span>
                            {m.organizer.slug === org?.slug && <Check className="h-4 w-4 text-brand" aria-label={t('Current')} />}
                        </Link>
                    </MenuItem>
                ))}
                <MenuItem>
                    <Link href={dashboardHref(null, '?pick=1')} className="mt-1 flex items-center gap-2.5 rounded-sm border-t border-line px-2.5 py-2 text-sm font-semibold text-link data-[focus]:bg-raised">
                        <Plus className="h-4 w-4" aria-hidden="true" />{t('Start another organizer')}
                    </Link>
                </MenuItem>
            </MenuItems>
        </Menu>
    );
}

export function roleName(role) {
    return { owner: t('Owner'), admin: t('Admin'), editor: t('Editor'), checkin_staff: t('Check-in staff') }[role] ?? '';
}

function Sidebar({ onNavigate }) {
    const { frame, org } = useDashboard();
    const credits = frame?.credits;
    return (
        <div className="flex h-full flex-col gap-5">
            <div className="flex h-12 items-center"><Wordmark size="sm" onNavigate={onNavigate} /></div>
            <OrgSwitcher />
            <nav aria-label={t('Dashboard')}><NavList onNavigate={onNavigate} /></nav>
            <div className="mt-auto space-y-3 border-t border-line pt-4 text-sm">
                {credits && (
                    <p className="flex items-center gap-2 text-muted" title={t('Resets :date', { date: new Date(credits.resets_at).toLocaleDateString() })}>
                        <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
                        {t(':n AI credits left this month', { n: credits.remaining >= 999999 ? '∞' : credits.remaining })}
                    </p>
                )}
                <a href={org?.public_url} className="flex items-center gap-2 font-semibold text-link hover:underline" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />{t('View public page')}
                </a>
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted hover:text-ink"><UserRound className="h-4 w-4" aria-hidden="true" />{t('Back to the site')}</Link>
                    <ModeToggle />
                </div>
            </div>
        </div>
    );
}

function Flash() {
    const { flash } = usePage().props;
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.info) toast(flash.info);
    }, [flash?.success, flash?.error, flash?.info]);
    return null;
}

export default function Shell({ children }) {
    const { frame, org } = useDashboard();
    const { currencies } = usePage().props;
    const [open, setOpen] = useState(false);
    if (currencies) setCurrencyRules(currencies);

    return (
        <div className="min-h-screen bg-bg font-sans text-body">
            <Head><meta name="robots" content="noindex" /></Head>
            <Toaster position="bottom-center" toastOptions={{ style: toastStyle }} />
            <Flash />
            <a href="#main" className="skip-link">{t('Skip to content')}</a>

            <aside className="fixed inset-y-0 start-0 hidden w-[272px] overflow-y-auto border-e border-line bg-surface px-4 pb-5 pt-3 lg:block">
                <Sidebar />
            </aside>

            <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-bg px-4 lg:hidden">
                <button type="button" onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-chip text-ink hover:bg-raised" aria-label={t('Open menu')}>
                    <MenuIcon className="h-6 w-6" />
                </button>
                <span className="min-w-0 flex-1 truncate font-display text-lg font-bold text-ink">{org?.name}</span>
                <ModeToggle />
            </header>

            <Dialog open={open} onClose={setOpen} className="relative z-[60] lg:hidden">
                <div className="fixed inset-0 bg-scrim/50" aria-hidden="true" />
                <DialogPanel className="fixed inset-y-0 start-0 flex w-[86%] max-w-[320px] flex-col overflow-y-auto border-e-key border-edge bg-surface px-4 pb-6 pt-3">
                    <button type="button" onClick={() => setOpen(false)} className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-chip hover:bg-raised" aria-label={t('Close menu')}>
                        <X className="h-6 w-6" />
                    </button>
                    <Sidebar onNavigate={() => setOpen(false)} />
                </DialogPanel>
            </Dialog>

            <main id="main" className="overflow-x-clip lg:ps-[272px]">
                <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
                    {frame?.must_verify_email && (
                        <Notice tone="warn" icon={BadgeCheck} className="mb-5">
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                {t('Confirm your email address to create, publish and announce events and to get paid.')}
                                <Button size="sm" variant="secondary" onClick={() => openVerifyEmailDialog()}>{t('Send the code')}</Button>
                            </span>
                        </Notice>
                    )}
                    {org?.suspended && <Notice tone="danger" className="mb-5">{t('This organizer is suspended. You can look around, but changes are off until the platform team lifts it.')}</Notice>}
                    {children}
                </div>
            </main>
        </div>
    );
}

export const dashLayout = (page) => <Shell>{page}</Shell>;
