import { useEffect, useRef, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { useRoute } from '@/Core/lib/useSite';
import useCaptcha from '@/Core/lib/auth/useCaptcha';
import useCaptchaWidget from '@/Core/lib/auth/useCaptchaWidget';
import {
    closeAuthDialog,
    closeVerifyEmailDialog,
    currentPath,
    forgetDialogParams,
    openAuthDialog,
    openVerifyEmailDialog,
    subscribeAuthDialog,
    subscribeVerifyDialog,
} from '@/Core/lib/auth/authDialog';
import { t } from '@/Core/i18n';

/*
 | Headless auth: the sign-in / register / forgot dialog, the full-page auth
 | forms, the six-box verify-email dialog, the account page's Security card and
 | the social sign-in links. Classic's components call these and keep only
 | their markup; every theme calls the same ones (re-exported from Core/auth).
 */

/* ── Social providers ─────────────────────────────────────────────────────── */

/** The providers the site knows how to talk to, in the order they are shown. */
export const SOCIAL_PROVIDERS = [
    { id: 'google', label: 'Google' },
    { id: 'facebook', label: 'Facebook' },
];

/**
 * Google / Facebook availability and links. A provider is usable only when the
 * shared `social` flags say so — true only when the operator switched it on
 * *and* a client id is configured (a button to a driver with no credentials is
 * a 500).
 *
 * `to` is where the round trip should land afterwards (sanitised server-side);
 * the member's locale rides along so the callback answers in their language.
 */
export function useSocialProviders({ to = null, stacked = false } = {}) {
    const { social, locale } = usePage().props;

    const google = Boolean(social?.google);
    const facebook = Boolean(social?.facebook);

    // Side by side only when both fit; a lone button, or a stacked pair, can
    // afford the full "Continue with …".
    const sideBySide = !stacked && google && facebook;

    const href = (provider) => {
        const query = new URLSearchParams({ locale: locale ?? 'en' });
        if (to) query.set('to', to);
        return `/auth/${provider}/redirect?${query.toString()}`;
    };

    return { google, facebook, available: google || facebook, sideBySide, href };
}

/* ── The auth dialog (sign in / register / forgot, over any page) ─────────── */

/** Where each dialog mode posts (`/{locale}/auth/…`). There are no auth pages: this dialog is the only way in. */
export const AUTH_ENDPOINTS = { login: '/auth/sign-in', register: '/auth/register', forgot: '/auth/forgot-password', reset: '/auth/reset-password' };

/** Which form fields each dialog mode sends. */
export const AUTH_FIELDS = {
    login: ['email', 'password', 'remember'],
    register: ['name', 'email', 'password', 'password_confirmation', 'acceptPrivacy'],
    forgot: ['email'],
    reset: ['token', 'email', 'password', 'password_confirmation'],
};

/** The mode each mode's "alternative" link switches to. */
export const AUTH_ALT_MODE = { login: 'register', register: 'login', forgot: 'login', reset: 'login' };

/** `?auth=` (the server's `authIntent`) → the dialog mode it opens. */
const INTENT_MODES = { signin: 'login', register: 'register', forgot: 'forgot', reset: 'reset' };

/**
 * Open the dialog the page's address asks for — `?auth=signin&to=…` after
 * a signed-in page bounced a visitor, `?auth=reset&token=…` from the reset
 * mail, `?auth=verify` for the code. Read once per page, then taken off
 * the address bar.
 */
function useAuthIntent(authIntent, user) {
    const key = authIntent ? JSON.stringify(authIntent) : null;
    useEffect(() => {
        if (!authIntent) return;
        forgetDialogParams();
        if (authIntent.mode === 'verify') {
            if (user && !user.emailVerified) openVerifyEmailDialog({ send: false });
            return;
        }
        if (user) return; // Already signed in (another tab): nothing to ask.
        if (authIntent.mode === 'reset' && authIntent.expired) {
            openAuthDialog('forgot', null, { notice: t('That password reset link is invalid or has expired. Request a new one.') });
            return;
        }
        openAuthDialog(INTENT_MODES[authIntent.mode] ?? 'login', authIntent.to ? t('Sign in to continue.') : null, {
            to: authIntent.to ?? null,
            reset: authIntent.mode === 'reset' ? { token: authIntent.token, email: authIntent.email } : null,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
}

/**
 * State and actions for the global auth dialog. Mount the component that
 * uses it once (from the theme's AuthRoot); open it from anywhere with
 * `openAuthDialog(mode, intent)`. Render nothing while `visible` is false.
 */
export function useAuthModal() {
    const url = useRoute();
    const { auth, webSettings, authIntent, flash } = usePage().props;

    const [dialog, setDialog] = useState({ open: false, mode: 'login', intent: null, to: null, reset: null, notice: null });
    const [showPassword, setShowPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    useEffect(() => subscribeAuthDialog((state) => setDialog({ ...state })), []);
    useAuthIntent(authIntent, auth?.user ?? null);

    // Signing in navigates back to this page with a user; the dialog should
    // not survive the arrival.
    useEffect(() => {
        if (auth?.user && dialog.open) closeAuthDialog();
    }, [auth?.user, dialog.open]);

    const canRegister = auth?.canRegister !== false;
    const mode = dialog.mode === 'register' && !canRegister ? 'login' : dialog.mode;

    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        token: '',
        remember: true,
        acceptPrivacy: false,
    });

    const captcha = useCaptchaWidget({ active: dialog.open && (mode === 'login' || mode === 'register'), action: mode });

    // A new mode is a new form: no stale errors, no password carried across.
    useEffect(() => {
        form.clearErrors();
        form.setData((data) => ({
            ...data,
            password: '',
            password_confirmation: '',
            ...(mode === 'reset' && dialog.reset ? { token: dialog.reset.token, email: dialog.reset.email ?? data.email } : {}),
        }));
        setResetSent(false);
        setShowPassword(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, dialog.open]);

    const submit = async (event) => {
        event.preventDefault();

        if (form.processing) return;

        const tokens = mode === 'login' || mode === 'register' ? await captcha.tokens() : {};

        form.transform((data) => ({
            ...Object.fromEntries(AUTH_FIELDS[mode].map((key) => [key, data[key]])),
            ...tokens,
            to: dialog.to || currentPath(),
        }));

        form.post(url(AUTH_ENDPOINTS[mode]), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (mode === 'forgot') setResetSent(true);
            },
            onFinish: () => {
                captcha.reset();
                // Never leave a password in component state after the round
                // trip, whichever way it went.
                form.setData((data) => ({ ...data, password: '', password_confirmation: '' }));
            },
        });
    };

    const errors = form.errors;
    const problem = errors.register || errors.token || (mode === 'login' ? errors.email : null) || dialog.notice;
    // A finished reset lands back here, on sign-in, with this line.
    const status = !problem && mode === 'login' ? flash?.status ?? null : null;
    const banner = problem || status;
    const captchaError = errors.turnstile_token || errors.turnstile || errors.recaptcha;

    const termsUrl = webSettings?.terms_url || url('/pages/terms-and-conditions');
    const privacyUrl = webSettings?.privacy_url || url('/pages/privacy-policy');

    const altMode = AUTH_ALT_MODE[mode] ?? 'register';

    return {
        visible: dialog.open && !auth?.user,
        dialog,
        intent: dialog.intent,
        mode,
        canRegister,
        form,
        errors,
        banner,
        captchaError,
        captcha,
        showPassword,
        setShowPassword,
        toggleShowPassword: () => setShowPassword((visible) => !visible),
        resetSent,
        resetEmail: dialog.reset?.email ?? null,
        bannerTone: status ? 'success' : 'danger',
        submit,
        close: closeAuthDialog,
        switchMode: (next) => openAuthDialog(next, dialog.intent),
        altMode,
        canSwitchTo: (next) => next !== 'register' || canRegister,
        registerDescription: webSettings?.register_description || null,
        termsUrl,
        privacyUrl,
        returnTo: currentPath(),
    };
}

export const VERIFY_CODE_LENGTH = 6;
const LENGTH = VERIFY_CODE_LENGTH;
const EMPTY = () => Array(LENGTH).fill('');

/**
 * State and actions for the global verify-email dialog.
 *
 * Opened by the `verify_email` flash — set once by the request that registered
 * the account (and, when the operator requires a confirmed address, by each
 * sign-in and by a resend) — or from code with `openVerifyEmailDialog()`.
 * Deliberately not keyed off `emailVerified === false`, which is true for the
 * whole of a pending account's life and would reopen this on every page.
 * Render nothing while `visible` is false.
 */
/**
 * `{ page: true, to }` drives the full-page notice (Auth/VerifyEmail) instead
 * of the dialog: always open, and a confirmed code returns to `to`.
 */
export function useVerifyEmail({ page = false, to: toProp = null } = {}) {
    const url = useRoute();
    const { auth, flash, errors, authIntent } = usePage().props;
    // `?auth=verify&to=…` (a checkout that needs a confirmed address): carry on there once confirmed.
    const to = toProp ?? (authIntent?.mode === 'verify' ? authIntent.to ?? null : null);
    const user = auth?.user ?? null;

    const [open, setOpen] = useState(page);
    const [digits, setDigits] = useState(EMPTY);
    const [busy, setBusy] = useState(false);
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const boxes = useRef([]);
    // True while a code is in flight, so the props update that marks the
    // account verified does not close the dialog before "all set" shows.
    const confirming = useRef(false);

    // The server's word, not the store's: a flash opens it.
    useEffect(() => {
        if (flash?.verify_email) {
            setDone(false);
            setDigits(EMPTY());
            setOpen(true);
        }
    }, [flash?.verify_email]);

    // And code can open it too — asking for a code first when it has to.
    useEffect(
        () =>
            subscribeVerifyDialog((state) => {
                if (!state.open) return;
                closeVerifyEmailDialog();
                setDone(false);
                setDigits(EMPTY());
                setOpen(true);
                if (state.send) resend();
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    // Signed out, or confirmed elsewhere (another tab): nothing to ask.
    useEffect(() => {
        if (page) return;
        if (!user || (user.emailVerified && !done && !confirming.current)) setOpen(false);
    }, [user, done, page]);

    const code = digits.join('');
    const codeError = errors?.code;
    const notice = flash?.error || flash?.info;

    const put = (index, value) => {
        const cleaned = value.replace(/\D/g, '');

        // Pasting (or the OS filling a one-time code) into any box fills them all.
        if (cleaned.length > 1) {
            const next = cleaned.slice(0, LENGTH).split('');
            setDigits(Array.from({ length: LENGTH }, (_, i) => next[i] ?? ''));
            boxes.current[Math.min(next.length, LENGTH - 1)]?.focus();

            if (next.length === LENGTH) submit(next.join(''));
            return;
        }

        const next = [...digits];
        next[index] = cleaned;
        setDigits(next);

        if (cleaned && index < LENGTH - 1) boxes.current[index + 1]?.focus();
        if (cleaned && next.every(Boolean)) submit(next.join(''));
    };

    const onKeyDown = (index, event) => {
        // Backspace on an empty box steps back, so fixing a typo needs no mouse.
        if (event.key === 'Backspace' && !digits[index] && index > 0) {
            boxes.current[index - 1]?.focus();
        }
        if (event.key === 'ArrowLeft' && index > 0) boxes.current[index - 1]?.focus();
        if (event.key === 'ArrowRight' && index < LENGTH - 1) boxes.current[index + 1]?.focus();
    };

    function submit(value = code) {
        if (value.length < LENGTH || busy) return;

        router.post(
            url('/verify-email'),
            to ? { code: value, to } : { code: value },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => {
                    confirming.current = true;
                    setBusy(true);
                },
                onFinish: () => {
                    confirming.current = false;
                    setBusy(false);
                },
                onSuccess: (page) => {
                    if (page.props?.errors?.code) return;
                    setDone(true);
                },
                onError: () => {
                    setDigits(EMPTY());
                    boxes.current[0]?.focus();
                },
            },
        );
    }

    function resend() {
        router.post(
            url('/verify-email/resend'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSending(true),
                onFinish: () => setSending(false),
            },
        );
    }

    const close = () => setOpen(false);

    /** `ref` callback for digit box `index` — focus moves between boxes through these. */
    const boxRef = (index) => (el) => {
        boxes.current[index] = el;
    };

    return {
        visible: open && Boolean(user),
        user,
        length: LENGTH,
        digits,
        code,
        codeError,
        notice,
        busy,
        sending,
        done,
        boxes,
        boxRef,
        put,
        onKeyDown,
        submit,
        resend,
        close,
    };
}

/* ── Account ▸ Sign-in & security ─────────────────────────────────────────── */

/** Toast whatever the server flashed, since the site shell does not. */
export function announceFlash(page) {
    const flash = page?.props?.flash ?? {};
    if (flash.error) toast.error(flash.error);
    else if (flash.success) toast.success(flash.success);
    else if (flash.info) toast(flash.info);
}

/**
 * The Security card's frame: the signed-in user (render nothing without one),
 * plus the one-time flash toast on arrival.
 *
 * State comes from `auth.user` (`emailVerified`, `hasPassword`, `linked`) and
 * the shared `social` flags, so the page needs no payload of its own for it.
 * Posts to App\Http\Controllers\Site\AccountSecurityController.
 */
export function useAccountSecurity() {
    const page = usePage();
    const user = page.props.auth?.user;

    // Arriving back from "Connect Google" is a full page load with a flash on
    // it; say what happened once.
    useEffect(() => {
        announceFlash(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { user };
}

/** Set or change the password (first password needs an emailed code). */
export function usePasswordChange(user) {
    const url = useRoute();

    const [open, setOpen] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [sending, setSending] = useState(false);

    const firstPassword = !user.hasPassword;

    const form = useForm({
        current_password: '',
        code: '',
        password: '',
        password_confirmation: '',
    });

    const sendCode = () => {
        router.post(
            url('/account/password/code'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSending(true),
                onFinish: () => setSending(false),
                onSuccess: (page) => {
                    announceFlash(page);
                    if (!page.props?.flash?.error) setCodeSent(true);
                },
            },
        );
    };

    const submit = (event) => {
        event.preventDefault();

        form.post(url('/account/password'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                announceFlash(page);
                if (!page.props?.flash?.error) {
                    form.reset();
                    setOpen(false);
                    setCodeSent(false);
                }
            },
            onFinish: () => form.reset('current_password', 'password', 'password_confirmation'),
        });
    };

    const cancel = () => {
        form.reset();
        form.clearErrors();
        setOpen(false);
    };

    return {
        open,
        start: () => setOpen(true),
        cancel,
        firstPassword,
        form,
        sendCode,
        sending,
        codeSent,
        setCode: (value) => form.setData('code', value.replace(/\D/g, '')),
        submit,
    };
}

/** Connected sign-in providers: which to list, connect links, disconnect. */
export function useConnectedAccounts(user) {
    const url = useRoute();
    const { social: sharedSocial, locale } = usePage().props;
    const social = sharedSocial ?? {};

    const [busy, setBusy] = useState(null);

    // A provider is listed when it can be used now, or when it is already
    // linked (so it can still be disconnected after the operator turns it off).
    const rows = SOCIAL_PROVIDERS.filter(({ id }) => social[id] || user.linked?.[id]).map((provider) => ({
        ...provider,
        linked: Boolean(user.linked?.[provider.id]),
    }));

    const connectHref = (id) => {
        const query = new URLSearchParams({ locale: locale ?? 'en', to: url('/account?tab=settings') });
        return `/auth/${id}/redirect?${query.toString()}`;
    };

    const disconnect = (id, label) => {
        if (!window.confirm(t('Disconnect :provider? You will no longer be able to sign in with it.', { provider: label }))) return;

        router.delete(url(`/account/social/${id}`), {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setBusy(id),
            onFinish: () => setBusy(null),
            onSuccess: announceFlash,
        });
    };

    return { rows, busy, connectHref, disconnect };
}
