import { useCountdown } from '@/Core/lib/checkout';
import { t } from '@/Core/i18n';

/**
 * Time left on a payment code — Classic's look. Ticking and why: `useCountdown`
 * in Site/logic/checkout.
 */
export default function Countdown({ expiresAt, onExpire }) {
    const { expired, label } = useCountdown(expiresAt, onExpire);

    if (!expiresAt) {
        return null;
    }

    if (expired) {
        return <span className="font-semibold text-danger">{t('Expired')}</span>;
    }

    return (
        // Tabular digits: a number that changes every second must not shift the layout.
        <span className="font-mono font-medium tabular-nums text-ink" role="timer">
            {label}
        </span>
    );
}
