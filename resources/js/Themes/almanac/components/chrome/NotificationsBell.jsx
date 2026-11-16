import { Link } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { useRoute } from '@/Core/lib/useSite';
import { timeAgo, useNotifications } from '@/Core/lib/chrome';
import { t } from '@/Core/i18n';

export default function NotificationsBell() {
    const url = useRoute();
    const { open, toggle, items, unread, loaded, ref } = useNotifications();

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={toggle}
                className="relative flex h-10 w-10 items-center justify-center rounded-chip text-ink transition-colors hover:bg-raised"
                aria-label={t('Notifications')}
            >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unread > 0 && (
                    <span className="absolute end-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-key border-bg bg-cta px-1 font-mono text-[10px] font-medium text-on-cta">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute end-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-line bg-surface shadow-key">
                    <div className="border-b border-line px-4 py-3">
                        <p className="font-display text-lg text-ink">{t('Notifications')}</p>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {!loaded ? (
                            <p className="px-4 py-6 text-center text-sm text-muted">{t('Loading…')}</p>
                        ) : items.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-muted">{t('Nothing here yet.')}</p>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'border-b border-line/60 px-4 py-3 last:border-0',
                                        !item.read && 'border-s-[3px] border-s-cta bg-raised',
                                    )}
                                >
                                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                                    {item.body && <p className="mt-0.5 text-xs text-muted">{item.body}</p>}
                                    <p className="mt-1 font-mono text-[11px] text-muted">{timeAgo(item.createdAt)}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        href={url('/account')}
                        className="block border-t border-line px-4 py-2.5 text-center text-xs font-semibold text-muted hover:text-ink"
                    >
                        {t('Open inbox')}
                    </Link>
                </div>
            )}
        </div>
    );
}
