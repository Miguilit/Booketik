import AuthModal from './components/auth/AuthModal';
import VerifyEmailDialog from './components/auth/VerifyEmailDialog';
import { usePaymentsRoot } from '@/Core/payments';
import CheckoutReturn from './components/payments/CheckoutReturn';
import SuccessDialog from './components/payments/SuccessDialog';
import UpgradeDialog from './components/payments/UpgradeDialog';

/*
 | The global dialogs: sign in / sign up, the
 | verify-email code, and the Plus upgrade, success and checkout-return
 | dialogs. Rendered once from app.jsx, inside the Inertia app but outside the
 | page, so they survive the navigation their own submit causes.
 */
export function AuthRoot() {
    return (
        <>
            <AuthModal />
            <VerifyEmailDialog />
        </>
    );
}

export function PaymentsRoot({ initialPage }) {
    const { active, locale, user, userId, celebrate } = usePaymentsRoot(initialPage);
    if (!active) return null;
    return (
        <>
            <UpgradeDialog locale={locale} user={user} />
            <SuccessDialog />
            <CheckoutReturn locale={locale} userId={userId} celebrate={celebrate} />
        </>
    );
}
