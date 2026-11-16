import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { BadgeCheck, Check, MessageCircleQuestion, ReceiptText } from 'lucide-react';
import { useDashboard, dashboardHref } from '@/Core/dashboard';
import { HttpError, startCheckout } from '@/Core/payments';
import StripePayment from '@/Core/engines/StripePayment';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { PageHead, Panel, StatTile, Table } from '@/Themes/civic/components/dashboard/kit';
import { Button, Card, cn, Modal, Tag } from '@/Themes/civic/components/ui';

const limitText = (v) => (v === null || v === undefined ? t('Unlimited') : v === true ? t('Yes') : v === false ? t('No') : String(v));
const FEATURE = { event_draft_text: 'Paste-to-event', event_draft_image: 'Flyer reading', describe: 'Copy studio', translate: 'Translation', insights: 'Sales insights', triage: 'Approval triage' };

/** Plan & billing: what the plan allows, what is used this month, and upgrading through the site's card checkout. */
export default function Billing({ plan, usage, plans = [], ai_runs: runs = [] }) {
    const { org, frame } = useDashboard();
    const { locale } = usePage().props;
    const [busy, setBusy] = useState(null);
    const [paying, setPaying] = useState(null);
    const credits = frame?.credits;

    const upgrade = async (p) => {
        setBusy(p.id);
        try {
            await startCheckout(`/${locale}/checkout/plan/${p.id}?organizer=${encodeURIComponent(org.slug)}`, {
                locale,
                onElement: (handoff) => setPaying({ plan: p, handoff }),
                onPaid: () => { toast.success(t('Paid. Your plan switches over in a moment.')); router.reload(); },
            });
        } catch (error) {
            toast.error(error instanceof HttpError ? error.message : t('That could not be started.'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <>
            <Head title={t('Plan & billing')} />
            <PageHead title={t('Plan & billing')} actions={<Button variant="secondary" icon={ReceiptText} href={`/${locale}/account/subscription`}>{t('Receipts and payment method')}</Button>} />

            <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label={t('Current plan')} value={plan.name} note={plan.expires_at ? t('Renews or ends :date', { date: new Date(plan.expires_at).toLocaleDateString() }) : null} />
                <StatTile label={t('Events published this month')} value={`${usage.events_this_month}${plan.limits.events_per_month ? ` / ${plan.limits.events_per_month}` : ''}`} />
                <StatTile label={t('AI credits left')} value={credits ? (credits.remaining >= 999999 ? '∞' : `${credits.remaining} / ${credits.limit}`) : '—'} note={credits ? t('Resets :date', { date: new Date(credits.resets_at).toLocaleDateString() }) : null} />
            </div>

            <h2 className="mb-3 mt-8 font-display text-[24px] font-bold text-ink">{t('Plans')}</h2>
            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((p) => (
                    <Card key={p.id} sticker={p.current} className={cn('flex flex-col p-5', p.current && 'bg-tint/30')}>
                        <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-display text-[22px] font-bold text-ink">{p.name}</h3>
                            {p.current && <Tag tone="ink" icon={BadgeCheck}>{t('Your plan')}</Tag>}
                        </div>
                        <p className="mt-1 font-mono text-lg text-ink">{p.price.amount ? p.price.formatted : t('Free')}{p.price.amount && p.interval ? <span className="text-sm text-muted"> / {p.interval}</span> : null}</p>
                        {p.description && <p className="mt-2 text-sm text-muted">{p.description}</p>}
                        <ul className="mt-4 space-y-1.5 text-sm text-body">
                            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />{t('Events a month: :n', { n: limitText(p.limits.events_per_month) })}</li>
                            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />{t('Team seats: :n', { n: limitText(p.limits.team_seats) })}</li>
                            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />{t('AI credits a month: :n', { n: limitText(p.limits.ai_credits) })}</li>
                            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />{t('Page looks (Marquee, Almanac): :v', { v: limitText(Boolean(p.limits.custom_theme)) })}</li>
                        </ul>
                        <div className="mt-auto pt-5">
                            {!p.current && p.price.amount > 0 && <Button block variant="cta" loading={busy === p.id} onClick={() => upgrade(p)}>{t('Switch to :name', { name: p.name })}</Button>}
                        </div>
                    </Card>
                ))}
            </div>

            <Panel title={t('AI this month')} className="mt-8" bodyClass="py-1">
                <Table caption={t('AI use by feature')} rows={runs} rowKey={(r) => r.feature}
                    empty={<p className="flex items-center gap-2 py-4 text-sm text-muted"><MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />{t('No AI used yet this month.')}</p>}
                    columns={[
                        { key: 'feature', label: t('Feature'), render: (r) => t(FEATURE[r.feature] ?? r.feature) },
                        { key: 'runs', label: t('Runs'), align: 'end', render: (r) => <span className="font-mono">{r.runs}</span> },
                        { key: 'credits', label: t('Credits'), align: 'end', render: (r) => <span className="font-mono">{r.credits}</span> },
                    ]} />
            </Panel>

            <Modal open={Boolean(paying)} onClose={() => setPaying(null)} title={paying ? t('Switch to :name', { name: paying.plan.name }) : ''}>
                {paying && (
                    <StripePayment
                        clientSecret={paying.handoff.client_secret}
                        publishableKey={paying.handoff.publishable_key}
                        amountCents={paying.handoff.amount_cents}
                        currency={paying.handoff.currency}
                        returnUrl={`${window.location.origin}${dashboardHref(org.slug, '/billing')}`}
                        onPaid={() => { setPaying(null); toast.success(t('Paid. Your plan switches over in a moment.')); router.reload(); }}
                    />
                )}
            </Modal>
        </>
    );
}

Billing.layout = dashLayout;
