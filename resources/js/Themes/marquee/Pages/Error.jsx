import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Compass, Home, Search } from 'lucide-react';
import Wordmark from '@/Themes/marquee/components/chrome/Wordmark';
import { useErrorPage } from '@/Core/lib/errors';
import { t } from '@/Core/i18n';
import { buttonClass } from '@/Themes/marquee/components/ui';

/**
 * 404, 403, 500, 503 — a bare shell on purpose (no Layout): the layout reads
 * shared props that may be the very thing that failed. So it sets its own
 * background and type, and always offers a way back: home, Discover, search.
 */
export default function ErrorPage({ status }) {
    const { title, description, home } = useErrorPage(status);
    const [q, setQ] = useState('');

    return (
        <div className="min-h-screen bg-bg font-sans text-body">
            <Head title={`${status} — ${title}`} />
            <div className="mq-band">
                <div className="mx-auto w-full max-w-page px-4 py-4 sm:px-6 lg:px-10">
                    <Wordmark onBand />
                </div>
                <p aria-hidden="true" className="select-none overflow-hidden whitespace-nowrap px-2 font-display text-[clamp(160px,42vw,520px)] leading-[0.8] text-ink">
                    {status}
                </p>
            </div>
            <div className="mx-auto flex w-full max-w-page flex-col px-4 py-6 sm:px-6 lg:px-10">

                <main className="py-8">
                    <div>
                        <div className="max-w-2xl">
                            <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">
                                {t('Error :status', { status })}
                            </p>
                            <h1 className="mt-2 font-display text-[52px] text-ink sm:text-[80px]">
                                {title}
                            </h1>
                            <p className="mt-3 text-lg text-body">{description}</p>

                            {status !== 503 && (
                                <form
                                    role="search"
                                    className="mt-7 flex gap-2"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        router.get(`${home}/search`, q.trim() ? { q: q.trim() } : {});
                                    }}
                                >
                                    <label htmlFor="error-search" className="sr-only">{t('Search events')}</label>
                                    <div className="relative min-w-0 flex-1">
                                        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                                        <input
                                            id="error-search"
                                            type="search"
                                            value={q}
                                            onChange={(event) => setQ(event.target.value)}
                                            placeholder={t('Search events')}
                                            className="h-11 w-full rounded-btn border border-edge bg-surface pe-4 ps-10 text-[15px] text-ink placeholder:text-muted focus:border-edge focus:ring-0"
                                        />
                                    </div>
                                    <button type="submit" className={buttonClass({ variant: 'primary' })}>{t('Search')}</button>
                                </form>
                            )}

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href={home} className={buttonClass({ variant: 'cta' })}>
                                    <Home className="h-[18px] w-[18px]" aria-hidden="true" />
                                    {t('Back to home')}
                                </Link>
                                <Link href={`${home}/discover`} className={buttonClass({ variant: 'secondary' })}>
                                    <Compass className="h-[18px] w-[18px]" aria-hidden="true" />
                                    {t('Discover events')}
                                </Link>
                                <button type="button" onClick={() => window.history.back()} className={buttonClass({ variant: 'ghost' })}>
                                    <ArrowLeft className="h-[18px] w-[18px] rtl:rotate-180" aria-hidden="true" />
                                    {t('Go back')}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
