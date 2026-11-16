import { X } from 'lucide-react';
import { useAppBanner } from '@/Core/lib/chrome';
import { t } from '@/Core/i18n';
import { buttonClass } from '@/Themes/almanac/components/ui';

/**
 * A dismissible strip on mobile web offering to open the current page in the app.
 *
 * ## Never an interstitial
 *
 * The full-screen "you'd be better off in our app" wall is the pattern this is
 * deliberately not. Google penalises it in mobile search, and it is a wall in
 * front of content someone has already asked for. This is a strip at the top
 * of the page: the page stays readable behind it, and it takes one tap to be
 * rid of it for good.
 *
 * When it appears, and where Open goes on Android vs iOS, is `useAppBanner`
 * (`Site/logic/chrome.js`).
 */
export default function OpenInAppBanner() {
    const { visible, banner: appBanner, href, dismiss } = useAppBanner();

    if (!visible) return null;

    return (
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 md:hidden">
            <button
                type="button"
                onClick={dismiss}
                aria-label={t('Dismiss')}
                className="-ms-1 shrink-0 rounded-full p-1 text-muted hover:bg-raised"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {appBanner.icon ? (
                <img
                    src={appBanner.icon}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-sm object-cover"
                />
            ) : null}

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{appBanner.appName}</p>
                <p className="truncate text-xs text-muted">{t('Open this in the app')}</p>
            </div>

            <a
                href={href}
                onClick={dismiss}
                className={buttonClass({ variant: 'primary', size: 'sm', className: 'shrink-0' })}
            >
                {t('Open')}
            </a>
        </div>
    );
}
