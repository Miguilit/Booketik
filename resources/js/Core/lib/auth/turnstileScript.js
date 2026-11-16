/*
 | Cloudflare Turnstile's script, loaded the first time a form with a
 | challenge mounts rather than on every page (it was ~25 KB of JavaScript on
 | event pages that never show a form).
 */
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export function loadTurnstile() {
    if (typeof document === 'undefined' || window.turnstile || document.getElementById('turnstile-script')) return;
    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}
