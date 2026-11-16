import { useCheckoutReturn } from '@/Core/lib/payments';

/*
 | Coming back from a hosted checkout — headless; see `useCheckoutReturn` in
 | Site/logic/payments.
 */
export default function CheckoutReturn({ locale, userId, celebrate }) {
    useCheckoutReturn({ locale, userId, celebrate });

    return null;
}
