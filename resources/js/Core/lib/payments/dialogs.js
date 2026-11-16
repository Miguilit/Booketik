/*
 | Two tiny stores for the dialogs mounted once at the app root
 | (see PaymentsRoot): the Plus upgrade dialog and the "payment complete" one.
 |
 | Stores rather than context because the things that open them — the
 | subscription page, a Plus perk's prompt, the code that notices a webhook has landed — have
 | no useful ancestor in common, and the success dialog must survive whatever
 | the page underneath does.
 */

function createStore(initial) {
    let state = { ...initial };
    const listeners = new Set();

    return {
        get: () => state,
        set(patch) {
            state = { ...state, ...patch };
            listeners.forEach((fn) => fn(state));
        },
        subscribe(fn) {
            listeners.add(fn);
            fn(state);
            return () => listeners.delete(fn);
        },
    };
}

const upgrade = createStore({ open: false, reason: null });
const success = createStore({ open: false, title: null, message: null, actions: [] });

export const subscribeUpgradeDialog = upgrade.subscribe;

/**
 * Open the Plus upgrade dialog over the current page.
 *
 * @param {string|null} reason  shown under the heading — "Plus members skip the waitlist."
 */
export function openUpgradeDialog(reason = null) {
    upgrade.set({ open: true, reason });
}

export function closeUpgradeDialog() {
    upgrade.set({ open: false });
}

export const subscribeSuccessDialog = success.subscribe;

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string} [options.message]
 * @param {Array<{label: string, href?: string, primary?: boolean}>} [options.actions]
 */
export function openSuccessDialog({ title, message = null, actions = [] }) {
    success.set({ open: true, title, message, actions });
}

export function closeSuccessDialog() {
    success.set({ open: false });
}

/*
 | Exposed on window too, so a component that cannot import this module (a
 | lazily-loaded chunk, the auth agent's dialog, a Blade page) can still open the
 | upgrade dialog. Harmless when nothing uses it.
 */
if (typeof window !== 'undefined') {
    window.openUpgradeDialog = openUpgradeDialog;
}
