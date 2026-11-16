/**
 * Bridge tokens — colours for code that cannot use a Tailwind class.
 *
 * Every theme defines the same `--t-*` custom properties (RGB triplets) for
 * both modes: `--t-bg`, `--t-card`, `--t-ink`, `--t-muted`, `--t-line`,
 * `--t-accent`, `--t-gold`, `--t-on-accent`, `--t-success`, `--t-danger`,
 * plus `--t-radius` and `--t-font-body`.
 *
 * Two ways to use them:
 *
 *  - `cssColor('card')` → `"rgb(var(--t-card))"`, for anything that ends up
 *    in CSS (inline styles, the toaster, Inertia's progress bar). It follows
 *    light/dark live with no re-render.
 *  - `resolvedColor('card')` → `"rgb(23 26 33)"`, for consumers that need a
 *    literal value — Stripe Elements renders in an iframe and cannot see our
 *    variables, and canvas confetti needs real colours. Re-read it after a
 *    `site-mode-change` event.
 */

export const cssColor = (name, alpha) =>
    alpha === undefined ? `rgb(var(--t-${name}))` : `rgb(var(--t-${name}) / ${alpha})`;

function raw(name) {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(`--t-${name}`).trim();
}

/** A literal `rgb(r g b)` string for the token, as resolved right now. */
export function resolvedColor(name, fallback = '#000000') {
    const triplet = raw(name);
    if (!triplet) return fallback;

    // Stripe's appearance API wants comma syntax; it is valid CSS everywhere.
    const parts = triplet.split(/[\s,]+/).filter(Boolean);
    return parts.length === 3 ? `rgb(${parts.join(', ')})` : fallback;
}

export function resolvedValue(name, fallback = '') {
    return raw(name) || fallback;
}

/** react-hot-toast styles on the bridge tokens — live in both modes. */
export const toastStyle = {
    background: cssColor('card'),
    color: cssColor('ink'),
    border: `1px solid ${cssColor('line')}`,
    boxShadow: '0 12px 40px rgb(0 0 0 / 0.14)',
};
