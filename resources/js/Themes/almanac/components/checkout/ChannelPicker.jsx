import { Banknote, CreditCard, QrCode, Smartphone, Wallet } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { channelOptions } from '@/Core/lib/checkout';
import { t } from '@/Core/i18n';

/**
 * How the buyer wants to pay — Classic's tiles. Channels, not gateways: see
 * `describeChannel` in Site/logic/checkout.
 */
const ICONS = { qr: QrCode, wallet: Wallet, bank: Banknote, phone: Smartphone, card: CreditCard };

export default function ChannelPicker({ channels, value, onChange }) {
    const options = channelOptions(channels).map((option) => ({ ...option, icon: ICONS[option.kind] }));

    return (
        <fieldset className="mx-auto max-w-xl">
            <legend className="mb-3 text-center text-sm font-semibold text-body">
                {t('How would you like to pay?')}
            </legend>

            <div className="grid gap-2 sm:grid-cols-2">
                {options.map(({ value: option, label, hint, icon: Icon }) => {
                    const selected = value === option;

                    return (
                        <label
                            key={option}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-sm border-key px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                                selected
                                    ? 'border-edge bg-tint text-on-tint shadow-key'
                                    : 'border-line bg-surface hover:border-edge',
                            )}
                        >
                            <input
                                type="radio"
                                name="payment-channel"
                                value={option}
                                checked={selected}
                                onChange={() => onChange(option)}
                                className="sr-only"
                            />
                            <Icon
                                className={cn('h-5 w-5 shrink-0', selected ? 'text-ink' : 'text-muted')}
                                aria-hidden
                            />
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold capitalize text-ink">{label}</span>
                                {hint && <span className="block text-xs text-muted">{hint}</span>}
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
