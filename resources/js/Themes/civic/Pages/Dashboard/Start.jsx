import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { ArrowRight, BadgeCheck, Store } from 'lucide-react';
import { orgApi, useAction, dashboardHref } from '@/Core/dashboard';
import { openVerifyEmailDialog } from '@/Core/auth';
import { toastStyle } from '@/Core/bridge';
import { t } from '@/Core/i18n';
import Wordmark from '@/Themes/civic/components/chrome/Wordmark';
import { roleName } from '@/Themes/civic/components/dashboard/Shell';
import { Avatar, Button, Card, Field, Input, Notice } from '@/Themes/civic/components/ui';
import CityPicker from '@/Themes/civic/components/CityPicker';

/** The dashboard with no single team: pick one, or start an organizer. */
export default function Start({ orgs = [], cities = [], must_verify_email: mustVerify }) {
    const { auth, flash } = usePage().props;
    const api = orgApi(auth?.user?.token, '');
    const { run, busy, errors } = useAction();
    const [name, setName] = useState('');
    const [city, setCity] = useState('');

    const create = (e) => {
        e.preventDefault();
        run(() => api.post('/org', { name, city_slug: city || null }), { key: 'create' })
            .then((data) => data?.organizer && router.visit(dashboardHref(data.organizer.slug)));
    };

    return (
        <div className="min-h-screen bg-bg font-sans text-body">
            <Head title={t('Organizer dashboard')} />
            <Toaster position="bottom-center" toastOptions={{ style: toastStyle }} />
            <header className="mx-auto flex h-16 w-full max-w-[880px] items-center px-4"><Wordmark /></header>
            <main id="main" className="mx-auto w-full max-w-[880px] px-4 pb-16 pt-6">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t('Organizer dashboard')}</p>
                <h1 className="mt-1 font-display text-[38px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[48px]">
                    {orgs.length ? t('Which organizer?') : t('Start running events')}
                </h1>
                {flash?.error && <Notice tone="danger" className="mt-5">{flash.error}</Notice>}

                {orgs.length > 0 && (
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {orgs.map((o) => (
                            <li key={o.slug}>
                                <Link href={dashboardHref(o.slug)} className="flex items-center gap-3 rounded-card border-key border-edge bg-surface p-4 shadow-key transition-transform hover:-translate-x-px hover:-translate-y-px">
                                    <Avatar image={o.avatar} name={o.name} size={44} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-display text-lg font-bold text-ink">{o.name}</span>
                                        <span className="font-mono text-xs uppercase tracking-wider text-muted">{roleName(o.role)}</span>
                                    </span>
                                    <ArrowRight className="h-5 w-5 text-ink rtl:rotate-180" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <Card className="mt-8 p-6">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink"><Store className="h-5 w-5" aria-hidden="true" />{t('Start a new organizer')}</h2>
                    <p className="mt-1 text-[15px] text-muted">{t('An organizer is your public hub: its events, followers, team and payouts. You will be its owner.')}</p>
                    {mustVerify && (
                        <Notice tone="warn" icon={BadgeCheck} className="mt-4">
                            <span className="flex flex-wrap items-center gap-3">{t('Confirm your email address first.')}<Button size="sm" variant="secondary" onClick={() => openVerifyEmailDialog()}>{t('Send the code')}</Button></span>
                        </Notice>
                    )}
                    <form onSubmit={create} className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end">
                        <Field label={t('Name')} htmlFor="org-name" error={errors.name} required>
                            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} placeholder={t('e.g. Berlin Tech Collective')} />
                        </Field>
                        <Field label={t('Home city')}>
                            <CityPicker cities={cities} value={city} onChange={setCity} allowNone noneLabel={t('Not yet')} buttonClassName="h-11 w-full justify-between rounded-md border-key border-edge bg-surface px-3 text-[15px] text-ink hover:bg-raised" />
                        </Field>
                        <Button type="submit" variant="cta" loading={busy === 'create'} disabled={!name.trim()}>{t('Create')}</Button>
                    </form>
                </Card>
            </main>
        </div>
    );
}
