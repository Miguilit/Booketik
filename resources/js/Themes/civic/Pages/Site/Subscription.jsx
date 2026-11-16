import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, Crown, ExternalLink, Receipt } from 'lucide-react';
import { money } from '@/Core/format';
import { formatDate, useSubscription } from '@/Core/subscription';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/civic/Layout';
import { Button, Card, Container, EmptyState, Notice, Tag } from '@/Themes/civic/components/ui';

/*
 | Subscription & billing: when am I charged again, how do I cancel, what
 | have I paid for. Portal and receipt links are minted per click and opened in
 | a new tab (useSubscription, @/Core/subscription).
 */

export default function Subscription({ subscription, membership, history = [] }) {
    const hasPlus = Boolean(membership?.hasPlus ?? membership?.isPro);
    const { url, busy, openPortal, openCurrentInvoice, openOrderReceipt, ends, goPlus } = useSubscription({ subscription });
    const STATUS_LABELS = { paid: t('paid'), refunded: t('refunded') };

    return (
        <>
            <Head title={t('Subscription & billing')} />
            <Container>
                <div className="mx-auto max-w-3xl py-8 sm:py-12">
                <Link href={url('/account')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    {t('Account')}
                </Link>
                <h1 className="mt-3 font-display text-[36px] font-extrabold leading-tight tracking-[-0.03em] text-ink">{t('Subscription & billing')}</h1>

                {subscription ? (
                    <Card sticker className="mt-6 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <Tag tone="warn" icon={Crown}>{t('Plus')}</Tag>
                                <h2 className="mt-3 font-display text-2xl font-bold text-ink">{subscription.plan}</h2>
                                <p className="mt-1 text-sm text-muted">{t('Billed through :provider', { provider: subscription.providerLabel })}</p>
                            </div>
                            <div className="text-end">
                                {/* A cancelled subscription still runs to the end of what was paid for. */}
                                <p className="font-mono text-xs uppercase tracking-widest text-muted">{ends ? t('Ends') : t('Renews')}</p>
                                <p className="font-display text-xl font-bold text-ink">{formatDate(subscription.renewsAt)}</p>
                            </div>
                        </div>

                        {subscription.cancelsAtPeriodEnd && <Notice tone="warn" className="mt-4">{t('This subscription is set to end. You keep Plus until then.')}</Notice>}

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            {subscription.canManage ? (
                                <Button variant="primary" icon={ExternalLink} loading={busy === 'portal'} disabled={busy !== null} onClick={openPortal}>{t('Manage billing')}</Button>
                            ) : (
                                <p className="text-sm text-body">
                                    {subscription.store === 'web'
                                        ? t('Your subscription is managed by :provider. Use the link in your receipt email to change your card or cancel.', { provider: subscription.providerLabel })
                                        : t("Your subscription is managed by :provider. Change or cancel it from your device's subscription settings.", { provider: subscription.providerLabel })}
                                </p>
                            )}
                            {subscription.canInvoice && (
                                <Button variant="secondary" icon={Receipt} loading={busy === 'current-invoice'} disabled={busy !== null} onClick={openCurrentInvoice}>{t('Latest invoice')}</Button>
                            )}
                            <Button variant="link" href={url('/plus')}>{t('Compare plans')}</Button>
                        </div>
                    </Card>
                ) : (
                    <Card className="mt-6 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-key border-edge bg-tint-2 text-on-tint-2"><Crown className="h-6 w-6" aria-hidden="true" /></span>
                            <div className="min-w-0 flex-1">
                                {hasPlus ? (
                                    <>
                                        <h2 className="font-display text-xl font-bold text-ink">{t('You have Plus')}</h2>
                                        <p className="mt-1 text-[15px] text-body">
                                            {membership.expiresAt
                                                ? t('Your Plus pass runs until :date. It does not renew.', { date: formatDate(membership.expiresAt) })
                                                : t('Your Plus access does not renew and has no end date.')}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="font-display text-xl font-bold text-ink">{t('You are on the free plan')}</h2>
                                        <p className="mt-1 text-[15px] text-body">{t('Plus waives the service fee on most tickets, opens presales early and moves you up waitlists.')}</p>
                                    </>
                                )}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Button variant="cta" icon={Crown} onClick={goPlus}>{hasPlus ? t('Subscribe to Plus') : t('Get Plus')}</Button>
                                    <Button variant="link" href={url('/plus')}>{t('What you get')}</Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <section aria-labelledby="purchases" className="mt-10">
                    <h2 id="purchases" className="mb-4 font-display text-2xl font-bold text-ink">{t('Purchases')}</h2>
                    {history.length === 0 ? (
                        <EmptyState icon={Receipt} title={t('No purchases yet')} />
                    ) : (
                        <Card as="ul" className="divide-y divide-line">
                            {history.map((row) => (
                                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-ink">{row.title}</p>
                                        <p className="font-mono text-xs text-muted">
                                            {formatDate(row.at)}
                                            {row.orderNumber && <span> · {row.orderNumber}</span>}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {row.amountMinor > 0 && <span className="font-mono font-medium text-ink">{money(row.amountMinor, row.currency)}</span>}
                                        <Tag tone={row.status === 'paid' ? 'success' : 'muted'} icon={row.status === 'paid' ? Check : undefined}>{STATUS_LABELS[row.status] ?? row.status}</Tag>
                                        {row.canInvoice && (
                                            <Button variant="secondary" size="sm" icon={Receipt} loading={busy === `order-${row.id}`} disabled={busy !== null} onClick={() => openOrderReceipt(row.id)}>
                                                {t('Receipt')}
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </Card>
                    )}
                </section>
                </div>
            </Container>
        </>
    );
}

Subscription.layout = layout;
