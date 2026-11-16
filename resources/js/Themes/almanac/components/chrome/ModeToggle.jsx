import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { useMode } from '@/Core/lib/mode';
import { t } from '@/Core/i18n';

/**
 * The light/dark control, in two shapes.
 *
 * `icon` (the desktop bar) is one button that flips light ↔ dark — the
 * header has no room for a three-way control, and "follow the system" is a
 * setting people choose once, not a switch they reach for.
 *
 * `segmented` (the mobile drawer) shows all three, Auto included, because the
 * drawer is where settings live.
 */
export default function ModeToggle({ variant = 'icon', className }) {
    const { mode, dark, setMode, toggleMode } = useMode();

    if (variant === 'segmented') {
        const options = [
            { key: 'light', label: t('Light'), Icon: Sun },
            { key: 'dark', label: t('Dark'), Icon: Moon },
            { key: 'system', label: t('Auto'), Icon: Monitor },
        ];

        return (
            <div
                role="radiogroup"
                aria-label={t('Appearance')}
                className={cn('grid grid-cols-3 gap-1 rounded-chip border-key border-line bg-raised p-1', className)}
            >
                {options.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={mode === key}
                        onClick={() => setMode(key)}
                        className={cn(
                            'flex items-center justify-center gap-1.5 rounded-chip px-2 py-2 text-sm font-semibold transition-colors',
                            mode === key ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
                        )}
                    >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={toggleMode}
            aria-label={dark ? t('Switch to light mode') : t('Switch to dark mode')}
            title={dark ? t('Light mode') : t('Dark mode')}
            className={cn(
                'relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-chip text-ink transition-colors hover:bg-raised',
                className,
            )}
        >
            {/* Both icons stay mounted and trade places, so the swap animates
                instead of popping. */}
            <Sun
                className={cn(
                    'absolute h-[18px] w-[18px] transition-all duration-300 ease-snap',
                    dark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
                )}
                aria-hidden="true"
            />
            <Moon
                className={cn(
                    'absolute h-[18px] w-[18px] transition-all duration-300 ease-snap',
                    dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
                )}
                aria-hidden="true"
            />
        </button>
    );
}
