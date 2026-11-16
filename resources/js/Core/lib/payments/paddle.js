/*
 | Opening Paddle's card window over the page you are already on.
 |
 | Paddle hosts no payment page: its script draws the card window wherever it is
 | loaded, so the buyer stays on the shop exactly as they do with Stripe.
 |
 | Loaded on demand rather than in the layout — most visitors never buy anything,
 | and a payment SDK on every page is a third-party script for people who are
 | only reading.
 */

let loading = null;

function load() {
    if (window.Paddle) return Promise.resolve(window.Paddle);

    if (!loading) {
        loading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
            script.async = true;
            script.onload = () => resolve(window.Paddle);
            script.onerror = () => {
                // Cleared so a later attempt can try again rather than being
                // stuck behind a promise that will never resolve.
                loading = null;
                script.remove();
                reject(new Error('Paddle could not be loaded.'));
            };
            document.head.appendChild(script);
        });
    }

    return loading;
}

let ready = false;

/*
 | Paddle takes one event callback, at Initialize, for the life of the page.
 | The current checkout's handlers are swapped in here so a second purchase in
 | the same visit reports to its own caller rather than the first one's.
 */
let handlers = { onPaid: null, onClose: null };

/**
 * Open the card window for a transaction.
 *
 * @param {{transactionId: string, token: string, sandbox: boolean, onClose?: Function, onPaid?: Function}} options
 */
export async function openPaddle({ transactionId, token, sandbox, onClose, onPaid }) {
    const Paddle = await load();

    handlers = { onPaid, onClose };

    if (!ready) {
        // Sandbox has to be declared *before* setup, or the token is checked
        // against live and rejected.
        if (sandbox) Paddle.Environment.set('sandbox');

        Paddle.Initialize({
            token,
            eventCallback: (event) => {
                if (event?.name === 'checkout.completed') handlers.onPaid?.(event);
                if (event?.name === 'checkout.closed') handlers.onClose?.(event);
            },
        });

        // Initialising twice throws; the script is a singleton on the page.
        ready = true;
    }

    Paddle.Checkout.open({ transactionId });
}
