import { BadgeCheck, Check, Loader2 } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { upgradeIntervalLabel as intervalLabel, useUpgradeDialog } from '@/Core/lib/payments';
import PaymentModal from './PaymentModal';
import { CardCheckoutDialog } from './useCardCheckout';
import { buttonClass } from '@/Themes/civic/components/ui';
import { t } from '@/Core/i18n';

/*
 | The Plus offer, over the current page. The behaviour is
 | `useUpgradeDialog` (Core/payments).
 */

export default function UpgradeDialog({ locale, user }) {
    const { open, reason, hasPlus, catalog, list, card, busyId, buyItem, isFeatured, signIn, close } = useUpgradeDialog({
        locale,
        user,
    });

    if (!open) return null;

    // The card form replaces the offer while a Stripe payment is in progress.
    if (card.paying) {
        return <CardCheckoutDialog checkout={card} />;
    }

    return (
        <PaymentModal
            title={t('Plus')}
            subtitle={
                catalog?.cardsEnabled && catalog?.providerLabel
                    ? t('Pay by card · secured by :provider', { provider: catalog.providerLabel })
                    : null
            }
            onClose={close}
        >
            <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-key border-edge bg-tint-2 text-on-tint-2 shadow-key">
                    <BadgeCheck className="h-7 w-7" aria-hidden="true" />
                </span>
                <p className="mt-3 text-[15px] text-body">
                    {reason ?? t('No service fee on most tickets, early access to presales and priority on waitlists.')}
                </p>
            </div>

            {!user && (
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={signIn}
                        className={buttonClass({ variant: 'cta', size: 'lg' })}
                    >
                        {t('Sign in to continue')}
                    </button>
                </div>
            )}

            {user && catalog === null && (
                <div className="mt-6 space-y-3">
                    {[0, 1].map((i) => (
                        <div key={i} className="h-[76px] animate-pulse rounded-card border border-line bg-raised" />
                    ))}
                </div>
            )}

            {user && catalog && catalog.cardsEnabled && list?.length > 0 && (
                <ul className="mt-6 space-y-3">
                    {list.map((item) => {
                        const featured = isFeatured(item);
                        const busy = busyId === item.id;

                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    disabled={Boolean(busyId)}
                                    onClick={() => buyItem(item)}
                                    className={cn(
                                        'group flex w-full items-center gap-4 rounded-card bg-surface px-4 py-4 text-start transition-[transform,box-shadow] duration-150',
                                        'disabled:cursor-not-allowed disabled:opacity-60',
                                        featured
                                            ? 'border-key border-edge shadow-key hover:-translate-x-px hover:-translate-y-px hover:shadow-key-hover'
                                            : 'border-key border-line hover:border-edge',
                                    )}
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-tint-2 text-on-tint-2">
                                        <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2 font-semibold text-ink">
                                            {item.name}
                                            {featured && (
                                                <span className="rounded-chip border-key border-edge bg-cta px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-on-cta">
                                                    {t('Best value')}
                                                </span>
                                            )}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted">
                                            {item.renews ? t('Cancel anytime') : t('No auto-renew')}
                                        </span>
                                    </span>

                                    <span className="shrink-0 text-end">
                                        <span className="block font-mono text-base font-medium text-ink">
                                            {busy ? <Loader2 className="ms-auto h-4 w-4 animate-spin" /> : item.price_formatted}
                                        </span>
                                        <span className="block text-xs text-muted">{intervalLabel(item)}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {user && catalog && (!catalog.cardsEnabled || !list?.length) && (
                <p className="mt-6 rounded-sm border border-line bg-raised p-4 text-center text-sm text-muted">
                    {t('Plus is not on sale on the web yet. You can get it in the Eventgoo app.')}
                </p>
            )}

            {user && !hasPlus && catalog?.cardsEnabled && (
                <ul className="mt-5 space-y-1.5">
                    {[t('No service fee on tickets under the cap'), t('Early access to presales'), t('Priority on waitlists')].map(
                        (line) => (
                            <li key={line} className="flex items-center gap-2 text-sm text-muted">
                                <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                                {line}
                            </li>
                        ),
                    )}
                </ul>
            )}
        </PaymentModal>
    );
}
