import { Link } from '@inertiajs/react';
import { BadgeCheck, Bell, CalendarPlus, CalendarRange, ChevronDown, LayoutDashboard, LogOut, Settings, Ticket } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { useRoute } from '@/Core/lib/useSite';
import { useUserMenu } from '@/Core/lib/chrome';
import { t } from '@/Core/i18n';

/**
 * The signed-in account menu.
 *
 * A name and a chevron rather than an avatar and the word "Account": the header
 * already has six things competing for the right edge, and the visitor's own
 * name is the one label that tells them *which* account they are in — which is
 * the question this menu exists to answer.
 *
 * Sign-out is a POST through Inertia, not a link. A GET that ends a session can
 * be fired by a prefetch or an image tag.
 */
export default function DropdownUser({ user }) {
    const url = useRoute();
    const { open, setOpen, ref, displayName, signOut } = useUserMenu(user);

    const itemClass =
        'flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-raised';

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-chip ps-1 pe-3 text-sm font-semibold text-ink transition-colors hover:bg-raised"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border-key border-edge bg-tint-2 text-xs font-bold text-on-tint-2" aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
            </button>

            {open && (
                <div className="absolute end-0 z-50 mt-2 flex w-60 flex-col overflow-hidden rounded-card border-key border-edge bg-surface p-1.5 shadow-key">
                    <Link href={url('/account')} onClick={() => setOpen(false)} className={itemClass}>
                        <Settings className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        {t('Account settings')}
                    </Link>

                    <Link href={url('/tickets')} onClick={() => setOpen(false)} className={itemClass}>
                        <Ticket className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        {t('My tickets')}
                    </Link>

                    <Link href={url('/account/notifications')} onClick={() => setOpen(false)} className={itemClass}>
                        <Bell className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        {t('Notifications')}
                    </Link>

                    <Link href={url('/account/subscription')} onClick={() => setOpen(false)} className={itemClass}>
                        <BadgeCheck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        {t('Plus and billing')}
                    </Link>

                    {user?.organizer?.count > 0 ? (
                        <Link href={url(user.organizer.slug ? `/organizer/dashboard/${user.organizer.slug}` : '/organizer/dashboard')} onClick={() => setOpen(false)} className={itemClass}>
                            <CalendarRange className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                            {t('Organizer dashboard')}
                        </Link>
                    ) : (
                        <Link href={url('/organizer/dashboard')} onClick={() => setOpen(false)} className={itemClass}>
                            <CalendarPlus className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                            {t('Host an event')}
                        </Link>
                    )}

                    {user?.isAdmin && (
                        <Link href={url('/dashboard')} onClick={() => setOpen(false)} className={itemClass}>
                            <LayoutDashboard className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                            {t('Admin dashboard')}
                        </Link>
                    )}

                    <span className="my-1 h-px bg-line" />

                    <button type="button" onClick={signOut} className={itemClass}>
                        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        {t('Log out')}
                    </button>
                </div>
            )}
        </div>
    );
}
