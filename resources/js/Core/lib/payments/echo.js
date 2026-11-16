/*
 | The socket, created once and only when something needs it.
 |
 | Lazy on purpose — including the libraries, which are imported dynamically so
 | Echo and pusher-js stay out of the main bundle. Most visits never wait on a
 | payment, and a websocket per page load would cost every visitor a connection
 | so that the few who are buying get told a second sooner.
 |
 | Resolves null when broadcasting is not configured (no VITE_PUSHER_APP_KEY),
 | so callers fall back to polling rather than crash. That matters: the thing
 | waiting on this is a member who has just been charged.
 */

let echo = null;
let loading = null;

/** The XSRF cookie, which Laravel refreshes on every response. */
function xsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function socket() {
    if (echo !== null) return Promise.resolve(echo);

    const key = import.meta.env.VITE_PUSHER_APP_KEY;

    if (!key) return Promise.resolve(null);

    if (!loading) {
        loading = Promise.all([import('laravel-echo'), import('pusher-js')])
            .then(([{ default: Echo }, { default: Pusher }]) => {
                // Echo looks for it on window rather than taking it as an argument.
                window.Pusher = Pusher;

                echo = new Echo({
                    broadcaster: 'pusher',
                    key,
                    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
                    forceTLS: true,
                    /*
                     | Private channels are authorised by our own server
                     | (routes/channels.php `user.{id}`), which is what stops one
                     | member subscribing to another's purchases. The session
                     | route wants the CSRF token like any other POST — read
                     | from the cookie, not the meta tag, which can be stale.
                     */
                    authEndpoint: '/broadcasting/auth',
                    auth: {
                        headers: {
                            'X-XSRF-TOKEN': xsrfToken(),
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                });

                return echo;
            })
            .catch(() => {
                loading = null;
                return null;
            });
    }

    return loading;
}

/**
 * Wait for one `purchase.settled` on this member's private channel.
 *
 * @param {number|string} userId
 * @param {(payload: object) => boolean} matches  which settlement is being waited for
 * @param {number} timeoutMs                      give up after this long
 * @returns {Promise<object|null>} the payload, or null if nothing arrived
 */
export async function awaitSettlement(userId, matches, timeoutMs) {
    if (!userId) return null;

    const connection = await socket();

    if (connection === null) return null;

    return new Promise((resolve) => {
        const name = `user.${userId}`;
        let done = false;
        let timer = null;

        const handler = (payload) => {
            if (matches(payload ?? {})) finish(payload);
        };

        const finish = (payload) => {
            if (done) return;
            done = true;
            clearTimeout(timer);

            // Stop listening, but do not leave the channel: another purchase
            // in this tab may still be waiting on it.
            try {
                connection.private(name).stopListening('.purchase.settled', handler);
            } catch {
                /* already gone */
            }

            resolve(payload);
        };

        timer = setTimeout(() => finish(null), timeoutMs);

        try {
            // The leading dot means "this is the full event name" — without it
            // Echo prefixes the application namespace and never matches.
            connection.private(name).listen('.purchase.settled', handler);
        } catch {
            finish(null);
        }
    });
}
