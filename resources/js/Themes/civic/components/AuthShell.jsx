import { Head } from '@inertiajs/react';
import { BadgeCheck, CalendarDays } from 'lucide-react';
import AppLogo from './chrome/Wordmark';
import { t } from '@/Core/i18n';
import { cn, withNodes } from '@/Core/lib/format';
import { useSocialProviders } from '@/Core/lib/auth';
import { useSiteBrand } from '@/Core/lib/useSite';

/**
 * Chrome for the signed-out auth screens: no nav or footer (a sign-in page
 * with eight ways out is a sign-in abandoned), the wordmark, a short pitch on
 * wide screens and the form on a sticker card.
 */

// A function, not a constant: t() must run at render time, after the dictionary loads.
const sellingPoints = () => [
    {
        icon: CalendarDays,
        title: t('Find what is on near you'),
        body: t('Concerts, meetups, workshops and conferences — your tickets live in the app and on the web.'),
    },
    {
        icon: BadgeCheck,
        title: t('Go Plus'),
        body: t('No service fee on most tickets, early access to presales and priority on waitlists.'),
    },
];

export default function AuthShell({ title, heading, subheading, children, footer }) {
    const { name: siteName } = useSiteBrand();

    return (
        <div className="min-h-screen bg-bg font-sans text-body">
            <Head title={title} />
            <div className="mx-auto grid min-h-screen w-full max-w-page gap-10 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-center lg:gap-16 lg:px-8">
                <div className="flex flex-col lg:min-h-[560px] lg:justify-between">
                    <AppLogo size="md" />
                    {/* The pitch: on a phone the form is the page. */}
                    <div className="hidden lg:block">
                        <h1 className="font-display text-[56px] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink">
                            {withNodes(t('Your city, :highlight.'), {
                                highlight: <span className="rounded-[14px] border-key border-edge bg-tint-2 px-2 text-on-tint-2 shadow-key">{t('this week')}</span>,
                            })}
                        </h1>
                        <p className="mt-6 max-w-md text-lg text-body">
                            {t('One :site account across the web and the app — your tickets, saved events and the organizers you follow come with you.', { site: siteName })}
                        </p>
                        <ul className="mt-10 grid max-w-lg grid-cols-2 gap-4">
                            {sellingPoints().map(({ icon: Icon, title: pointTitle, body }) => (
                                <li key={pointTitle} className="rounded-card border border-line bg-surface p-4">
                                    <Icon className="h-5 w-5 text-link" aria-hidden="true" />
                                    <p className="mt-2 font-semibold text-ink">{pointTitle}</p>
                                    <p className="mt-1 text-sm text-muted">{body}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <span className="hidden lg:block" />
                </div>

                <div className="w-full">
                    <div className="rounded-card border-key border-edge bg-surface p-6 shadow-key sm:p-8">
                        <h2 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink">{heading}</h2>
                        {subheading && <p className="mt-1.5 text-[15px] text-muted">{subheading}</p>}
                        <div className="mt-6">{children}</div>
                    </div>
                    {footer && <p className="mt-5 text-center text-[15px] text-body">{footer}</p>}
                </div>
            </div>
        </div>
    );
}

/* ── Form primitives ─────────────────────────────────────────────────────────
 |
 | Local to the auth screens rather than in `Shared/`: the components there are
 | from the previous product and carry its own spacing and type scale.
 */

export const FIELD_CLASS =
    'block w-full rounded-sm border-key border-line bg-surface px-3.5 py-3 text-[15px] text-ink placeholder:text-muted focus:border-edge focus:outline-none focus:ring-0';

export function Field({ label, error, hint, children }) {
    return (
        <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
                <label className="text-sm font-semibold text-ink">
                    {label}
                </label>
                {hint}
            </div>
            {children}
            {error && <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p>}
        </div>
    );
}

export function SubmitButton({ processing, children }) {
    return (
        <button
            type="submit"
            disabled={processing}
            className={cn(
                'h-12 w-full rounded-btn border-key border-edge bg-cta px-4 text-base font-semibold text-on-cta shadow-key transition-transform duration-150',
                processing ? 'cursor-not-allowed opacity-60' : 'hover:-translate-x-px hover:-translate-y-px hover:shadow-key-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
            )}
        >
            {processing ? t('Please wait…') : children}
        </button>
    );
}

/**
 * Google / Facebook buttons. Renders nothing unless a provider is usable —
 * availability and the round-trip links come from `useSocialProviders()`
 * (Site/logic/auth).
 */
export function SocialButtons({ label, to = null, stacked = false }) {
    const { google, facebook, sideBySide, href } = useSocialProviders({ to, stacked });

    if (!google && !facebook) {
        return null;
    }

    const labelFor = (name) => (sideBySide ? name : t('Continue with :provider', { provider: name }));

    return (
        <>
            <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    {label}
                </span>
                <span className="h-px flex-1 bg-line" />
            </div>

            <div className={cn('grid gap-3', sideBySide && 'sm:grid-cols-2')}>
                {/* Plain anchors, not Inertia links: these leave the app for the provider. */}
                {google && (
                    <a
                        href={href('google')}
                        className="flex h-12 items-center justify-center gap-2 rounded-btn border-key border-line bg-surface px-4 text-[15px] font-semibold text-ink transition-colors hover:border-edge"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
                            <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3c1.9 3.8 5.8 6.3 10.2 6.3z" />
                            <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
                            <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.6 0 3.7 2.5 1.8 6.1l3.8 3c.9-2.7 3.4-4.3 6.4-4.3z" />
                        </svg>
                        {labelFor('Google')}
                    </a>
                )}

                {facebook && (
                    <a
                        href={href('facebook')}
                        className="flex h-12 items-center justify-center gap-2 rounded-btn border-key border-line bg-surface px-4 text-[15px] font-semibold text-ink transition-colors hover:border-edge"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0866FF" aria-hidden="true">
                            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
                        </svg>
                        {labelFor('Facebook')}
                    </a>
                )}
            </div>
        </>
    );
}
