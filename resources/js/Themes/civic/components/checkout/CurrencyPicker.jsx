import { useCurrencyPicker } from '@/Core/lib/checkout';
import { t } from '@/Core/i18n';

/**
 * Which currency to price this page in — Classic's select. Why a query
 * parameter and when it hides: `useCurrencyPicker` in Site/logic/checkout.
 */
export default function CurrencyPicker({ value }) {
    const { currencies, visible, change } = useCurrencyPicker();

    if (!visible) {
        return null;
    }

    return (
        <label className="inline-flex items-center gap-2 text-sm text-muted">
            <span>{t('Prices in')}</span>
            <select
                value={value}
                onChange={(event) => change(event.target.value)}
                className="form-select rounded-sm border-key border-line bg-surface py-1.5 pe-8 ps-2.5 text-sm font-semibold text-ink focus:border-edge focus:ring-0"
            >
                {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                        {currency.code} {currency.symbol ? `(${currency.symbol})` : ''}
                    </option>
                ))}
            </select>
        </label>
    );
}
