import { Head } from '@inertiajs/react';
import { BadgePercent, Clock, Crown, ListOrdered } from 'lucide-react';
import { openUpgradeDialog, upgradeIntervalLabel } from '@/Core/payments';
import { requireAccount } from '@/Core/auth';
import { useRoute, useViewer } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/civic/Layout';
import { Button, Card, CheckLine, cn, Container, Notice, Tag } from '@/Themes/civic/components/ui';

/*
 | Eventgoo Plus — the attendee membership (`GET /shop` plans and premium
 | features). Buying opens the shared upgrade dialog (roots.jsx), the same
 | checkout the account page uses.
 */

const PILLARS = () => [
    { icon: BadgePercent, title: t('No service fee'), body: t('On most tickets, up to your plan’s monthly cap.') },
    { icon: Clock, title: t('Presales first'), body: t('Get into on-sales before everyone else.') },
    { icon: ListOrdered, title: t('Waitlist priority'), body: t('When a spot frees up, you hear first.') },
];

export default function Plus({ catalog, hasPlus }) {
    const url = useRoute();
    const viewer = useViewer();
    const plans = [...(catalog?.subscriptionPlans ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const features = catalog?.premiumFeatures ?? [];
    const buy = () => requireAccount(viewer, t('Create an account to get Plus.'), () => openUpgradeDialog());

    return (
        <>
            <Head title={t('Plus')} />
            <Container className="py-10 sm:py-16">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
                    <div>
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{t('Membership')}</p>
                        <h1 className="mt-2 font-display text-[48px] font-extrabold leading-[0.98] tracking-[-0.04em] text-ink sm:text-[72px]">
                            {t('Go out more,')}{' '}
                            <span className="inline-block rotate-[-2deg] rounded-[14px] border-key border-edge bg-tint-2 px-3 text-on-tint-2 shadow-key">{t('pay less')}</span>
                        </h1>
                        <p className="mt-6 max-w-lg text-lg text-body">{t('Plus is for people who go to things. It pays for itself after a couple of tickets.')}</p>

                        <ul className="mt-10 space-y-5">
                            {PILLARS().map(({ icon: Icon, title, body }) => (
                                <li key={title} className="flex gap-4">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tint text-on-tint"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                                    <span>
                                        <span className="block font-display text-lg font-bold text-ink">{title}</span>
                                        <span className="block text-[15px] text-muted">{body}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {features.length > 0 && (
                            <section aria-labelledby="included" className="mt-10 border-t border-line pt-8">
                                <h2 id="included" className="font-display text-2xl font-bold text-ink">{t('Everything included')}</h2>
                                <ul className="mt-4 space-y-3 text-[15px] text-body">
                                    {features.map((f) => (
                                        <CheckLine key={f.slug}><strong className="text-ink">{f.name}</strong>{f.description ? <> — {f.description}</> : null}</CheckLine>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    <div className="space-y-4 lg:sticky lg:top-24">
                        {hasPlus && (
                            <Notice tone="success" icon={Crown}>
                                {t('You have Plus.')}{' '}
                                <a href={url('/account/subscription')} className="font-semibold underline">{t('Manage your membership')}</a>
                            </Notice>
                        )}
                        {plans.length === 0 ? (
                            <Card className="p-6 text-[15px] text-muted">{t('Plus is not on sale right now.')}</Card>
                        ) : (
                            plans.map((plan, i) => {
                                const featured = i === plans.length - 1 && plans.length > 1;
                                return (
                                    <Card key={plan.id} sticker={featured} className={cn('p-6', featured && 'bg-surface')}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-display text-xl font-bold text-ink">{plan.name}</h3>
                                                {plan.description && <p className="mt-1 text-sm text-muted">{plan.description}</p>}
                                            </div>
                                            {featured && <Tag tone="warn" icon={BadgePercent}>{t('Best value')}</Tag>}
                                        </div>
                                        <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
                                            <span className="font-display text-[40px] font-extrabold leading-none tracking-[-0.03em] text-ink">{plan.priceFormatted}</span>
                                            <span className="font-mono text-sm text-muted">{upgradeIntervalLabel(plan)}</span>
                                            {plan.compareAtFormatted && <s className="font-mono text-sm text-muted">{plan.compareAtFormatted}</s>}
                                        </p>
                                        {plan.trialDays > 0 && <p className="mt-1 text-sm font-semibold text-success">{t(':count days free', { count: plan.trialDays })}</p>}
                                        {plan.features?.length > 0 && (
                                            <ul className="mt-4 space-y-2 text-sm text-body">{plan.features.map((f) => <CheckLine key={f}>{f}</CheckLine>)}</ul>
                                        )}
                                        <Button variant={featured ? 'cta' : 'secondary'} block size="lg" className="mt-6" onClick={buy} disabled={hasPlus}>
                                            {hasPlus ? t('You have Plus') : t('Get :plan', { plan: plan.name })}
                                        </Button>
                                    </Card>
                                );
                            })
                        )}
                        <p className="text-center text-xs text-muted">{t('Cancel any time from your account.')}</p>
                    </div>
                </div>
            </Container>
        </>
    );
}

Plus.layout = layout;
