/*
 | One auth dialog and one verify-email dialog for the whole site, opened from
 | anywhere.
 |
 | A deliberately tiny store rather than a context: both dialogs are mounted
 | once at the root (resources/js/app.jsx), and the things that open them — the
 | nav's "Sign in", a Save button, an RSVP, the Plus dialog's Buy — have
 | no useful ancestor in common.
 |
 | `intent` is what the member was trying to do. It is shown at the top of the
 | dialog, because "Sign in" arriving unexplained over the page they were
 | reading is indistinguishable from a paywall.
 |
 |     import { openAuthDialog, requireAccount, requireVerifiedAccount } from '@/Core/lib/auth/authDialog';
 |
 |     requireAccount(viewer, 'Sign in to save this event.', () => save());
 |     requireVerifiedAccount(viewer, 'Create an account to get Plus.', () => startCheckout());
 |
 | `viewer` is `usePage().props.auth.user` (or `useViewer()`), which carries
 | `emailVerified` and `mustVerifyEmail` — the latter true only when the
 | operator requires a confirmed address and this one is not confirmed yet.
 */

let authState = { open: false, mode: 'login', intent: null, to: null, reset: null, notice: null };
let verifyState = { open: false, send: false };

const authListeners = new Set();
const verifyListeners = new Set();

function emitAuth() {
    authState = { ...authState };
    authListeners.forEach((fn) => fn(authState));
}

function emitVerify() {
    verifyState = { ...verifyState };
    verifyListeners.forEach((fn) => fn(verifyState));
}

export function subscribeAuthDialog(fn) {
    authListeners.add(fn);
    fn(authState);
    return () => authListeners.delete(fn);
}

export function subscribeVerifyDialog(fn) {
    verifyListeners.add(fn);
    fn(verifyState);
    return () => verifyListeners.delete(fn);
}

/**
 * @param {'login'|'register'|'forgot'|'reset'} mode
 * @param {string|null} intent  why the dialog opened, shown at its top
 * @param {{ to?: string|null, reset?: {token: string, email: string}|null, notice?: string|null }} extra
 *   `to`: where to go once signed in (else the current page); `reset`: the
 *   reset link's token; `notice`: a line to show (an expired link).
 */
export function openAuthDialog(mode = 'login', intent = null, extra = {}) {
    const wasOpen = authState.open;
    authState.open = true;
    authState.mode = mode;
    authState.intent = intent;
    // Switching modes inside the open dialog keeps where it is going.
    authState.to = extra.to !== undefined ? extra.to : wasOpen ? authState.to : null;
    authState.reset = extra.reset !== undefined ? extra.reset : mode === 'reset' ? authState.reset : null;
    authState.notice = extra.notice ?? null;
    emitAuth();
}

export function closeAuthDialog() {
    authState.open = false;
    emitAuth();
}

/**
 * Open the six-box code dialog.
 *
 * `send: true` asks the server for a code first (it answers "check your inbox"
 * instead of sending when one went out in the last minute) — use it whenever
 * the dialog is opened by something other than the sign-up that already sent
 * one.
 */
export function openVerifyEmailDialog({ send = true } = {}) {
    verifyState.open = true;
    verifyState.send = send;
    emitVerify();
}

export function closeVerifyEmailDialog() {
    verifyState.open = false;
    verifyState.send = false;
    emitVerify();
}

/**
 * Run `action` if there is an account behind this session; otherwise open the
 * dialog and explain why.
 *
 * The guard is here rather than on each button so that "what needs an account"
 * is one list — and so a screen added later cannot quietly forget to ask.
 */
export function requireAccount(user, intent, action, mode = 'register') {
    if (user) return action();
    openAuthDialog(mode, intent);
    return undefined;
}

/**
 * {@link requireAccount}, plus: when the operator requires a confirmed email
 * and this account has not confirmed it, open the code dialog instead of
 * running `action`. For anything that takes money. The server re-checks with
 * EmailVerification::mustVerify(), so this is the affordance, not the gate.
 */
export function requireVerifiedAccount(user, intent, action, mode = 'register') {
    if (!user) {
        openAuthDialog(mode, intent);
        return undefined;
    }

    if (user.mustVerifyEmail) {
        openVerifyEmailDialog({ send: true });
        return undefined;
    }

    return action();
}

const DIALOG_PARAMS = ['auth', 'to', 'token'];

/** The current page as a same-site path, for the server's `to` return target (minus the dialog's own query). */
export function currentPath() {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    DIALOG_PARAMS.forEach((k) => params.delete(k));
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

/** Take `?auth=…&to=…&token=…` off the address bar once the dialog has read them. */
export function forgetDialogParams() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!DIALOG_PARAMS.some((k) => params.has(k))) return;
    window.history.replaceState(window.history.state, '', currentPath() + window.location.hash);
}
