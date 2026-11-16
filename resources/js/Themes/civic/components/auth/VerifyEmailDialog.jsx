import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { MailCheck, X } from 'lucide-react';
import { SubmitButton } from '@/Themes/civic/components/AuthShell';
import { buttonClass } from '@/Themes/civic/components/ui';
import { t } from '@/Core/i18n';
import { cn, withNodes } from '@/Core/lib/format';
import { useVerifyEmail } from '@/Core/lib/auth';
import { openVerifyEmailDialog } from '@/Core/lib/auth/authDialog';

/*
 | "Enter the six digits we just emailed you."
 |
 | Opened by the `verify_email` flash — set once by the request that registered
 | the account (and, when the operator requires a confirmed address, by each
 | sign-in and by a resend) — or from code with `openVerifyEmailDialog()`.
 | Deliberately not keyed off `emailVerified === false`, which is true for the
 | whole of a pending account's life and would reopen this on every page.
 |
 | Dismissible. The account and the session are real; what is pending is the
 | proof. What waits on it is the welcome mail and, when the operator requires
 | it, paying for anything (`auth.user.mustVerifyEmail`).
 |
 | Opening, the code boxes, submit and resend live in `useVerifyEmail()`
 | (Site/logic/auth).
 */

export default function VerifyEmailDialog() {
    const {
        visible,
        user,
        length: LENGTH,
        digits,
        codeError,
        notice,
        busy,
        sending,
        done,
        boxes,
        put,
        onKeyDown,
        submit,
        resend,
        close,
    } = useVerifyEmail();

    if (!visible) return null;

    return (
        <Dialog open onClose={close} className="relative z-[80]">
            <div className="fixed inset-0 bg-scrim/55" aria-hidden="true" />

            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-card border-key border-edge bg-surface p-6 font-sans text-ink shadow-key sm:max-w-md sm:rounded-card sm:p-7 text-center">
                    <button
                        type="button"
                        onClick={close}
                        aria-label={t('Close')}
                        className="absolute end-4 top-4 rounded-chip p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-key border-edge bg-tint-2 text-on-tint-2 shadow-key">
                        <MailCheck className="h-7 w-7" aria-hidden="true" />
                    </span>

                    {done ? (
                        <>
                            <DialogTitle className="mt-4 font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink">{t("You're all set")}</DialogTitle>
                            <p className="mt-2 text-sm text-body">
                                {t('Your email is confirmed. You can buy tickets and run your organizer page now.')}
                            </p>
                            <button
                                type="button"
                                onClick={close}
                                className={buttonClass({ variant: 'cta', size: 'lg', block: true, className: 'mt-6' })}
                            >
                                {t('Continue')}
                            </button>
                        </>
                    ) : (
                        <>
                            <DialogTitle className="mt-4 font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink">{t('Confirm your email')}</DialogTitle>
                            <p className="mt-2 text-sm text-body">
                                {withNodes(
                                    (user.mustVerifyEmail || user.mustVerifyForTickets)
                                        ? t('We sent a 6-digit code to :email. Enter it to finish setting up your account — you need a confirmed email to buy tickets.')
                                        : t('We sent a 6-digit code to :email. Enter it to finish setting up your account.'),
                                    { email: <strong className="text-ink">{user.email}</strong> },
                                )}
                            </p>

                            {notice && (
                                <p className="mt-4 rounded-sm bg-raised px-4 py-2.5 text-sm font-semibold text-body">{notice}</p>
                            )}

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    submit();
                                }}
                                className="mt-6"
                            >
                                <div className="flex justify-center gap-2 sm:gap-2.5">
                                    {digits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => {
                                                boxes.current[index] = el;
                                            }}
                                            value={digit}
                                            onChange={(event) => put(index, event.target.value)}
                                            onKeyDown={(event) => onKeyDown(index, event)}
                                            onFocus={(event) => event.target.select()}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            // Only the first box takes the OS's one-time-code fill;
                                            // `put` spreads the whole code from there.
                                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                            maxLength={LENGTH}
                                            autoFocus={index === 0}
                                            aria-label={t('Digit :number', { number: index + 1 })}
                                            className={cn(
                                                'h-14 w-11 rounded-sm border-key bg-surface text-center font-mono text-2xl font-medium text-ink focus:border-edge focus:shadow-key focus:outline-none focus:ring-0 sm:w-12',
                                                codeError ? 'border-danger' : 'border-line',
                                            )}
                                        />
                                    ))}
                                </div>

                                {codeError && (
                                    <p className="mt-3 text-sm font-semibold text-danger">{codeError}</p>
                                )}

                                <div className="mt-6">
                                    <SubmitButton processing={busy}>{t('Confirm')}</SubmitButton>
                                </div>
                            </form>

                            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                                <button
                                    type="button"
                                    onClick={resend}
                                    disabled={sending}
                                    className="font-semibold text-link underline underline-offset-4 disabled:opacity-50"
                                >
                                    {sending ? t('Sending…') : t('Send another code')}
                                </button>
                                <span className="h-4 w-px bg-line" />
                                <button type="button" onClick={close} className="font-semibold text-muted hover:text-ink">
                                    {t('Later')}
                                </button>
                            </div>

                            <p className="mt-4 text-xs text-muted">
                                {t("The code expires in 10 minutes. Check your spam folder if it doesn't arrive.")}
                            </p>
                        </>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    );
}

// Re-exported for callers that only import from here.
export { openVerifyEmailDialog };
