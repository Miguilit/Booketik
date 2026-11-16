/*
 | Lemon Squeezy's checkout, drawn over the page instead of navigated to.
 |
 | The server asks for an embeddable checkout; this script is what opens it in a
 | frame over the shop. Loaded on demand for the same reason as Paddle's.
 |
 | `lemon.js` defines `createLemonSqueezy()` and nothing else — `window
 | .LemonSqueezy` stays undefined until that is called — so the initialiser is
 | run on load rather than the global being read straight away.
 */

let loading = null;

function load() {
    if (window.LemonSqueezy) return Promise.resolve(window.LemonSqueezy);

    if (!loading) {
        loading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
            script.defer = true;
            script.onload = () => {
                if (typeof window.createLemonSqueezy !== 'function') {
                    loading = null;
                    reject(new Error('Lemon Squeezy loaded without its initialiser.'));
                    return;
                }

                window.createLemonSqueezy();
                resolve(window.LemonSqueezy);
            };
            script.onerror = () => {
                loading = null;
                script.remove();
                reject(new Error('Lemon Squeezy could not be loaded.'));
            };
            document.head.appendChild(script);
        });
    }

    return loading;
}

/**
 * Open a checkout URL as an overlay.
 *
 * @param {{url: string, onClose?: Function, onPaid?: Function}} options
 */
export async function openLemonSqueezy({ url, onClose, onPaid }) {
    const LemonSqueezy = await load();

    LemonSqueezy.Setup({
        eventHandler: (event) => {
            if (event?.event === 'Checkout.Success') onPaid?.(event);
            if (event?.event === 'Checkout.Closed' || event?.event === 'PaymentMethodUpdate.Closed') onClose?.(event);
        },
    });

    // `embed=1` on the URL as well as in the checkout's own options: the
    // parameter is what stops the page drawing its own header and footer
    // inside our frame.
    const embedded = url.includes('embed=1') ? url : `${url}${url.includes('?') ? '&' : '?'}embed=1`;

    LemonSqueezy.Url.Open(embedded);
}
