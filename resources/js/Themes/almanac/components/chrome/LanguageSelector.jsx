import { Check, Globe } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { useLanguageSelector } from '@/Core/lib/chrome';
import { t } from '@/Core/i18n';

/**
 * The language switcher. Behaviour (and why switching is a navigation) lives in
 * `useLanguageSelector` (`Site/logic/chrome.js`).
 */
export default function LanguageSelector({ className, variant = 'desktop' }) {
    const { enabled, locales, locale, current, open, setOpen, change, ref } = useLanguageSelector();

    if (!enabled) {
        return null;
    }

    if (variant === 'mobile') {
        return (
            <div className="space-y-2">
                <div className="px-3 font-mono text-xs uppercase tracking-widest text-muted">{t('Language')}</div>
                <div className="space-y-1">
                    {locales.map((item) => (
                        <button
                            key={item.code}
                            type="button"
                            onClick={() => change(item.code)}
                            className={cn(
                                'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
                                item.code === locale ? 'bg-ink font-semibold text-bg' : 'text-ink hover:bg-raised',
                            )}
                        >
                            <span className="w-8 font-mono text-xs opacity-70">
                                {item.code.toUpperCase()}
                            </span>
                            <span className="flex-1 text-start">{item.name}</span>
                            {item.code === locale && <Check className="h-4 w-4" aria-hidden="true" />}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className={cn('relative', className)}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex h-10 items-center gap-1.5 rounded-chip px-3 text-sm font-semibold text-ink transition-colors hover:bg-raised"
                aria-label={t('Change language')}
            >
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span className="hidden xl:inline">{current?.code?.toUpperCase()}</span>
            </button>

            {open && (
                <div className="absolute end-0 z-50 mt-2 w-48 overflow-hidden rounded-card border border-line bg-surface p-1.5 shadow-key">
                    {locales.map((item) => (
                        <button
                            key={item.code}
                            type="button"
                            onClick={() => change(item.code)}
                            className={cn(
                                'flex w-full items-center gap-3 rounded-sm px-3 py-2 text-[15px] transition-colors',
                                item.code === locale
                                    ? 'bg-ink font-semibold text-bg'
                                    : 'text-ink hover:bg-raised',
                            )}
                        >
                            <span className="w-7 font-mono text-xs opacity-70">
                                {item.code.toUpperCase()}
                            </span>
                            <span className="flex-1 text-start">{item.name}</span>
                            {item.code === locale && <Check className="h-4 w-4" aria-hidden="true" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
