import { useState } from 'react';
import { router } from '@inertiajs/react';
import { MessageCircleQuestion, Tag as TagIcon, TicketCheck, Megaphone, TrendingUp } from 'lucide-react';
import { t } from '@/Core/i18n';
import { AskInsightsCard, InsightsAgentProvider } from '@/Themes/civic/components/dashboard/InsightsAgent';
import { useAction, useDashboard } from '@/Core/dashboard';
import { money } from '@/Core/format';
import { BarList, Funnel, VelocityChart } from '../charts';
import { ConfirmDialog, Panel } from '../kit';
import { AiUnavailableNotice, PricingHintsCard, RecapCard, useAiAvailable } from '../AiCards';
import { Button, Chip, Input } from '../../ui';

const SUGGESTIONS = [
    () => t('Why are sales slower than my last event?'),
    () => t('Which channel brings the most guests?'),
    () => t('Should I release the next tier?'),
];

/** What the confirm dialog says each action will do — exactly, before it happens. */
function actionCopy(type) {
    return {
        release_next_tier: { icon: TicketCheck, confirm: t('Release the next tier'), body: t('The next tier that is not on sale yet goes on sale now: it is shown on the event page and its sales window opens today.') },
        create_promo_code: { icon: TagIcon, confirm: t('Create the code'), body: t('A new promo code for this event, 15% off, valid for the next 24 hours. You can edit or switch it off under Promote.') },
        boost_referral: { icon: TrendingUp, confirm: t('Raise the rewards'), body: t('Every percent-based referral link for this event earns 5 points more per sale (up to 50%). If there is no link yet, one is created.') },
        announce_waitlist: { icon: Megaphone, confirm: t('Open the composer'), body: t('Opens Announce with the waitlist selected. Nothing is sent until you write the message and press Send.') },
    }[type] ?? { icon: MessageCircleQuestion, confirm: t('Do it'), body: '' };
}

/** Insights: the funnel, sales velocity against past events, attribution, revenue by tier, and the sales copilot. */
export default function Insights({ event, data }) {
    const f = data?.funnel ?? {};
    const a = data?.attribution ?? {};
    const steps = [
        { label: t('Page views'), value: f.views ?? 0 },
        { label: t('Checkout started'), value: f.checkout_started ?? 0 },
        { label: t('Orders paid'), value: f.orders_paid ?? 0 },
        { label: t('Tickets issued'), value: f.tickets ?? 0, noRate: true },
        { label: t('Checked in'), value: f.checked_in ?? 0 },
    ];
    const toItems = (rows) => (rows ?? []).map((r) => ({ label: r.label, value: r.count }));
    const tiers = data?.revenue_by_tier ?? [];

    return (
        <div className="grid gap-5">
            <RecapCard event={event} recap={data?.recap} ended={data?.ended} />
            <Copilot event={event} />
            <PricingHintsCard event={event} readiness={data?.pricing} />
            <div className="grid gap-5 lg:grid-cols-2">
                <Panel title={t('Funnel')}><Funnel steps={steps} /></Panel>
                <Panel title={t('Sales so far')}><VelocityChart velocity={data?.velocity} /></Panel>
            </div>
            <Panel title={t('Where guests came from')}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        [t('Referral links'), a.referral],
                        [t('UTM source'), a.utm],
                        [t('How they heard'), a.how_heard],
                        [t('Page source'), a.source],
                    ].map(([label, rows]) => (
                        <div key={label}>
                            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{label}</h3>
                            <BarList label={label} items={toItems(rows)} empty={t('None recorded.')} />
                        </div>
                    ))}
                </div>
            </Panel>
            <Panel title={t('Revenue by tier')}>
                <BarList
                    label={t('Revenue by tier')}
                    items={tiers.map((tier) => ({ label: `${tier.name} · ${tier.sold}${tier.quantity ? ` / ${tier.quantity}` : ''}`, value: tier.revenue?.amount ?? 0, currency: tier.revenue?.currency }))}
                    format={(v) => money(v, tiers[0]?.revenue?.currency ?? 'EUR')}
                    empty={t('No tiers yet.')}
                />
                <p className="mt-3 text-xs text-muted">{t('Your price before fees, paid orders only.')}</p>
            </Panel>
        </div>
    );
}

function Copilot({ event }) {
    const { can } = useDashboard();
    if (!can.edit) return null;
    return (
        <InsightsAgentProvider event={event}>
            <Panel title={t('Ask about sales')}>
                <AskInsightsCard />
            </Panel>
        </InsightsAgentProvider>
    );
}
