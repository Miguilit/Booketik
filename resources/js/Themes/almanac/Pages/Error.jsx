import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Compass, Home, Search } from 'lucide-react';
import Wordmark from '@/Themes/almanac/components/chrome/Wordmark';
import { useErrorPage } from '@/Core/lib/errors';
import { t } from '@/Core/i18n';
import { buttonClass } from '@/Themes/almanac/components/ui';

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
            <div className="mx-auto flex min-h-screen w-full max-w-page flex-col px-4 py-6 sm:px-6 lg:px-8">
                <Wordmark />

                <main className="flex flex-1 items-center py-12">
                    <div className="grid w-full items-center gap-10 md:grid-cols-[auto_1fr] md:gap-16">
                        <p
                            aria-hidden="true"
                            className="mx-auto w-fit border-y-4 border-double border-ink px-2 py-2 font-display text-[120px] italic leading-none text-link sm:text-[200px] md:mx-0"
                        >
                            {status}
                        </p>

                        <div className="max-w-xl">
                            <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">
                                {t('Error :status', { status })}
                            </p>
                            <h1 className="mt-2 font-display text-[42px] leading-[1.02] text-ink sm:text-[60px]">
                                {title}
                            </h1>
                            <p className="mt-3 font-display text-[22px] italic text-muted">{description}</p>

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
                                            className="h-11 w-full rounded-btn border-key border-line bg-surface pe-4 ps-10 text-[15px] text-ink placeholder:text-muted focus:border-edge focus:ring-0"
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
