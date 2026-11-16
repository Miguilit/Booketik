import { useCallback, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { loadTurnstile } from './turnstileScript';

/*
 | Turnstile and reCAPTCHA v3 for forms that mount and unmount — the auth
 | dialog above all.
 |
 | `hooks/useCaptcha` renders into a fixed `#turnstile-widget` id once per page
 | load and fetches a reCAPTCHA token on mount. Neither survives a dialog: the
 | id is gone the second time it opens, and a v3 token is single-use and dies
 | after two minutes, so the one fetched on mount is stale or spent by the time
 | a member has typed a password and got it wrong once. This renders into a ref,
 | fetches the reCAPTCHA token at submit time, and resets Turnstile after every
 | attempt.
 |
 | Which challenges are on comes from the same shared props the server's
 | App\Support\Captcha reads, so the two cannot disagree.
 */
export default function useCaptchaWidget({ active = true, action = 'login' } = {}) {
    const { webSettings, turnstileSiteKey, recaptchaSiteKey } = usePage().props;

    const turnstileOn = Boolean(webSettings?.is_cloudflare_turnstile_enabled && turnstileSiteKey);
    const recaptchaOn = Boolean(webSettings?.is_google_recaptcha_enabled && recaptchaSiteKey);

    const containerRef = useRef(null);
    const widgetId = useRef(null);
    const turnstileToken = useRef('');

    // Turnstile: explicit render into the container, once the script is there.
    useEffect(() => {
        if (!active || !turnstileOn) return undefined;

        let cancelled = false;
        let timer = null;
        let tries = 0;
        loadTurnstile();

        const mount = () => {
            if (cancelled || !containerRef.current) return;

            if (!window.turnstile) {
                // The script loads on demand (loadTurnstile); give it a few seconds.
                if (tries++ < 50) timer = setTimeout(mount, 100);
                return;
            }

            widgetId.current = window.turnstile.render(containerRef.current, {
                sitekey: turnstileSiteKey,
                callback: (token) => {
                    turnstileToken.current = token;
                },
                'expired-callback': () => {
                    turnstileToken.current = '';
                },
            });
        };

        mount();

        return () => {
            cancelled = true;
            clearTimeout(timer);
            if (widgetId.current !== null && window.turnstile) {
                try {
                    window.turnstile.remove(widgetId.current);
                } catch {
                    // Already gone with its container.
                }
            }
            widgetId.current = null;
            turnstileToken.current = '';
        };
    }, [active, turnstileOn, turnstileSiteKey]);

    // reCAPTCHA v3: load the script once; tokens are fetched per submit.
    useEffect(() => {
        if (!active || !recaptchaOn || document.getElementById('recaptcha-script')) return;

        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }, [active, recaptchaOn, recaptchaSiteKey]);

    /** Resolves to the fields App\Support\Captcha reads. Never rejects. */
    const tokens = useCallback(async () => {
        const out = { turnstile_token: turnstileToken.current, recaptcha_token: '' };

        if (recaptchaOn && window.grecaptcha) {
            out.recaptcha_token = await new Promise((resolve) => {
                window.grecaptcha.ready(() => {
                    window.grecaptcha
                        .execute(recaptchaSiteKey, { action })
                        .then(resolve, () => resolve(''));
                });
            });
        }

        return out;
    }, [recaptchaOn, recaptchaSiteKey, action]);

    /** A Turnstile token is single-use: ask for a fresh one after each attempt. */
    const reset = useCallback(() => {
        turnstileToken.current = '';
        if (widgetId.current !== null && window.turnstile) {
            try {
                window.turnstile.reset(widgetId.current);
            } catch {
                // Nothing to reset.
            }
        }
    }, []);

    return { containerRef, turnstileOn, recaptchaOn, tokens, reset };
}
