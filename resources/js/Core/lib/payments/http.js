import axios from 'axios';
import { t } from '@/Core/i18n';

/*
 | JSON calls to the site's own session routes (`/{locale}/checkout/...`,
 | `/{locale}/me/entitlement`, the billing portal).
 |
 | Not `Site/api.js`: that one talks to `/api/v1` with the bearer token. These
 | routes are session-authenticated web routes, so they need the CSRF token —
 | which axios sends on its own from the `XSRF-TOKEN` cookie Laravel refreshes
 | on every response. The `<meta name="csrf-token">` tag is deliberately not
 | used: it is rendered once per full page load and goes stale after signing in
 | through an Inertia visit, and Laravel reads that header *before* the cookie,
 | so a stale one would fail a request the cookie alone would have passed.
 */

export class HttpError extends Error {
    constructor(message, status, body) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

const http = axios.create({
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    withXSRFToken: true,
});

async function call(method, url, data) {
    try {
        const response = await http.request({ method, url, data });
        return response.data ?? {};
    } catch (error) {
        const status = error?.response?.status ?? 0;
        const body = error?.response?.data ?? null;

        const message =
            body?.error?.message ??
            (typeof body?.error === 'string' ? body.error : null) ??
            body?.message ??
            (status === 401
                ? t('Please sign in first.')
                : status === 419
                  ? t('Your session expired. Refresh the page and try again.')
                  : status === 429
                    ? t('Too many attempts. Wait a moment and try again.')
                    : t('Something went wrong. Please try again.'));

        throw new HttpError(message, status, body);
    }
}

export const get = (url) => call('get', url);
export const post = (url, data = {}) => call('post', url, data);
