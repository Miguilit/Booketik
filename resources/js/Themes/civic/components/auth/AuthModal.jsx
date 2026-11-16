import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Eye, EyeOff, MailCheck, X } from 'lucide-react';
import { Field, FIELD_CLASS, SocialButtons, SubmitButton } from '@/Themes/civic/components/AuthShell';
import { useAuthModal } from '@/Core/lib/auth';
import { t } from '@/Core/i18n';
import { withNodes } from '@/Core/lib/format';
import { closeAuthDialog } from '@/Core/lib/auth/authDialog';

/*
 | Sign in, sign up, "forgot password" and the reset link's new password, in a
 | dialog over whatever page the visitor is on — the site has no auth pages.
 |
 | Mounted once in app.jsx (every theme's AuthRoot) so any screen can open it
 | without navigating away. The forms post to `/{locale}/auth/…` with `to` —
 | this page, or where a signed-in page was taking them (`?auth=signin&to=`)
 | — and the server sends them there, where the verify-email dialog opens
 | after a sign-up. `?auth=reset&token=` from the reset mail opens the reset
 | step (App\Support\AuthDialog).
 |
 | Open it with `openAuthDialog(mode, intent)` from ./authDialog. State,
 | submit and mode switching live in `useAuthModal()` (Site/logic/auth).
 */

// A function, not a constant: t() must run at render time, after the dictionary loads.
const copyFor = () => ({
    login: {
        title: t('Welcome back'),
        subtitle: t('Sign in to pick up where you left off.'),
        submit: t('Sign in'),
        alt: t('New here?'),
        altAction: t('Create an account'),
        altMode: 'register',
    },
    register: {
        title: t('Create your account'),
        subtitle: t('It takes a minute. Save events, follow organizers and keep your tickets in one place.'),
        submit: t('Create account'),
        alt: t('Already have an account?'),
        altAction: t('Sign in'),
        altMode: 'login',
    },
    forgot: {
        title: t('Reset your password'),
        subtitle: t("Enter the email on your account and we'll send you a link to set a new one."),
        submit: t('Send reset link'),
        alt: t('Remembered it?'),
        altAction: t('Back to sign in'),
        altMode: 'login',
    },
    reset: {
        title: t('Choose a new password'),
        subtitle: t('At least 8 characters, letters and numbers. Every device signed in to this account is signed out.'),
        submit: t('Set new password'),
        alt: t('Remembered it?'),
        altAction: t('Back to sign in'),
        altMode: 'login',
    },
});

export default function AuthDialog() {
    const {
        visible,
        dialog,
        mode,
        canRegister,
        form,
        errors,
        banner,
        captchaError,
        captcha,
        showPassword,
        setShowPassword,
        resetSent,
        resetEmail,
        bannerTone,
        submit,
        switchMode,
        registerDescription,
        termsUrl,
        privacyUrl,
        returnTo,
    } = useAuthModal();

    const COPY = copyFor();
    const copy = COPY[mode] ?? COPY.login;

    if (!visible) return null;

    return (
        <Dialog open onClose={closeAuthDialog} className="relative z-[70]">
            <div className="fixed inset-0 bg-scrim/55" aria-hidden="true" />

            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-card border-key border-edge bg-surface p-6 font-sans text-ink shadow-key sm:max-w-md sm:rounded-card sm:p-7">
                    <button
                        type="button"
                        onClick={closeAuthDialog}
                        aria-label={t('Close')}
                        className="absolute end-4 top-4 rounded-chip p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/*
                     | Why the dialog appeared. Without it, a sign-in form arriving
                     | over the page someone was reading reads as a paywall rather
                     | than as the one step between them and what they clicked.
                     */}
                    {dialog.intent && (
                        <p className="mb-4 me-8 rounded-sm border border-line bg-tint px-4 py-2.5 text-sm font-medium text-on-tint">
                            {dialog.intent}
                        </p>
                    )}

                    <DialogTitle className="pe-8 font-display text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink">{copy.title}</DialogTitle>
                    <p className="mt-1.5 text-sm text-body">
                        {mode === 'register' && registerDescription
                            ? registerDescription
                            : copy.subtitle}
                    </p>

                    {mode === 'forgot' && resetSent ? (
                        <div className="mt-6 flex items-start gap-3 rounded-sm border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                {t("If that address has an account, a reset link is on its way. It expires in 60 minutes — check your spam folder if it doesn't arrive.")}
                            </span>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="mt-6 space-y-4">
                            {banner && (
                                <div role={bannerTone === 'success' ? 'status' : 'alert'} className={bannerTone === 'success'
                                    ? 'rounded-sm border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium text-success'
                                    : 'rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger'}>
                                    {banner}
                                </div>
                            )}

                            {mode === 'reset' && resetEmail && (
                                <p className="rounded-sm border border-line bg-raised px-4 py-2.5 text-sm text-body">
                                    {t('For :email', { email: resetEmail })}
                                </p>
                            )}

                            {mode === 'register' && (
                                <Field label={t('Name')} error={errors.name}>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.data.name}
                                        onChange={(event) => form.setData('name', event.target.value)}
                                        autoComplete="name"
                                        autoFocus
                                        required
                                        placeholder={t('Your name')}
                                        className={FIELD_CLASS}
                                    />
                                </Field>
                            )}

                            {mode !== 'reset' && <Field label={t('Email')} error={mode === 'login' ? null : errors.email}>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                    autoComplete={mode === 'register' ? 'email' : 'username'}
                                    autoFocus={mode !== 'register'}
                                    required
                                    placeholder="you@example.com"
                                    className={FIELD_CLASS}
                                />
                            </Field>}

                            {mode !== 'forgot' && (
                                <Field
                                    label={t('Password')}
                                    error={errors.password}
                                    hint={
                                        mode === 'login' ? (
                                            <button
                                                type="button"
                                                onClick={() => switchMode('forgot')}
                                                className="text-xs font-semibold text-muted hover:text-ink"
                                            >
                                                {t('Forgot password?')}
                                            </button>
                                        ) : null
                                    }
                                >
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={form.data.password}
                                            onChange={(event) => form.setData('password', event.target.value)}
                                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                            autoFocus={mode === 'reset'}
                                            required
                                            minLength={mode === 'login' ? undefined : 8}
                                            placeholder={mode === 'login' ? '••••••••' : t('At least 8 characters, letters and numbers')}
                                            className={`${FIELD_CLASS} pe-12`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((visible) => !visible)}
                                            aria-label={showPassword ? t('Hide password') : t('Show password')}
                                            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-chip p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </Field>
                            )}

                            {(mode === 'register' || mode === 'reset') && (
                                <Field label={t('Confirm password')} error={errors.password_confirmation}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={form.data.password_confirmation}
                                        onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                        autoComplete="new-password"
                                        required
                                        placeholder={t('Repeat your password')}
                                        className={FIELD_CLASS}
                                    />
                                </Field>
                            )}

                            {mode === 'login' && (
                                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-body">
                                    <input
                                        type="checkbox"
                                        checked={form.data.remember}
                                        onChange={(event) => form.setData('remember', event.target.checked)}
                                        className="form-checkbox h-5 w-5 shrink-0 rounded-[6px] border-key border-edge text-brand focus:ring-0 focus:ring-offset-0"
                                    />
                                    {t('Keep me signed in')}
                                </label>
                            )}

                            {mode === 'register' && (
                                <div>
                                    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-body">
                                        <input
                                            type="checkbox"
                                            checked={form.data.acceptPrivacy}
                                            onChange={(event) => form.setData('acceptPrivacy', event.target.checked)}
                                            required
                                            className="mt-0.5 form-checkbox h-5 w-5 shrink-0 rounded-[6px] border-key border-edge text-brand focus:ring-0 focus:ring-offset-0"
                                        />
                                        <span>
                                            {withNodes(t('I agree to the :terms and the :privacy.'), {
                                                terms: (
                                                    <a href={termsUrl} target="_blank" rel="noreferrer" className="font-semibold text-link underline underline-offset-4 hover:text-ink">
                                                        {t('Terms')}
                                                    </a>
                                                ),
                                                privacy: (
                                                    <a href={privacyUrl} target="_blank" rel="noreferrer" className="font-semibold text-link underline underline-offset-4 hover:text-ink">
                                                        {t('Privacy Policy')}
                                                    </a>
                                                ),
                                            })}
                                        </span>
                                    </label>
                                    {errors.acceptPrivacy && (
                                        <p className="mt-1.5 text-xs font-semibold text-danger">{errors.acceptPrivacy}</p>
                                    )}
                                </div>
                            )}

                            {(mode === 'login' || mode === 'register') && captcha.turnstileOn && <div ref={captcha.containerRef} />}

                            {(mode === 'login' || mode === 'register') && captchaError && (
                                <p className="text-xs font-semibold text-danger">{captchaError}</p>
                            )}

                            <SubmitButton processing={form.processing}>{copy.submit}</SubmitButton>
                        </form>
                    )}

                    {(mode === 'login' || mode === 'register') && (
                        <SocialButtons
                            label={mode === 'register' ? t('or sign up with') : t('or continue with')}
                            to={dialog.to || returnTo}
                            stacked
                        />
                    )}

                    {(copy.altMode !== 'register' || canRegister) && (
                        <p className="mt-6 text-center text-sm text-body">
                            {copy.alt}{' '}
                            <button
                                type="button"
                                onClick={() => switchMode(copy.altMode)}
                                className="font-semibold text-link underline underline-offset-4"
                            >
                                {copy.altAction}
                            </button>
                        </p>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    );
}
