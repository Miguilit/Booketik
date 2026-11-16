import { useEffect, useState } from "react";
import { loadTurnstile } from "./turnstileScript";

export default function useCaptcha({ turnstileSiteKey, recaptchaSiteKey, setData, turnstileEnabled, recaptchaEnabled }) {
    const [turnstileInitialized, setTurnstileInitialized] = useState(false);
    const [recaptchaInitialized, setRecaptchaInitialized] = useState(false);
    const [localErrors, setLocalErrors] = useState({});

    useEffect(() => {
        // Initialize Turnstile CAPTCHA only if enabled
        if (turnstileEnabled && turnstileSiteKey && !turnstileInitialized) {
            const initializeTurnstile = () => {
                if (window.turnstile) {
                    window.turnstile.render('#turnstile-widget', {
                        sitekey: turnstileSiteKey,
                        callback: (token) => {
                            setData('turnstile_token', token);
                        },
                    });
                    setTurnstileInitialized(true);
                }
            };

            if (window.turnstile) {
                initializeTurnstile();
            } else {
                // Loaded on demand now; wait for it rather than for window load.
                loadTurnstile();
                let tries = 0;
                const wait = () => (window.turnstile ? initializeTurnstile() : tries++ < 80 && setTimeout(wait, 100));
                wait();
            }
        }

        // Initialize Google reCAPTCHA only if enabled
        if (recaptchaEnabled && recaptchaSiteKey && !recaptchaInitialized) {
            const loadRecaptcha = () => {
                if (window.grecaptcha) {
                    grecaptcha.ready(() => {
                        grecaptcha.execute(recaptchaSiteKey, { action: 'login' }).then((token) => {
                            setData('recaptcha_token', token);
                        });
                    });
                    setRecaptchaInitialized(true);
                }
            };

            const scriptId = "recaptcha-script";
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
                script.async = true;
                script.defer = true;
                script.onload = loadRecaptcha;
                document.body.appendChild(script);
            } else {
                loadRecaptcha();
            }
        }
    }, [turnstileSiteKey, recaptchaSiteKey, turnstileInitialized, recaptchaInitialized, setData, turnstileEnabled, recaptchaEnabled]);

    return { localErrors, setLocalErrors };
}
