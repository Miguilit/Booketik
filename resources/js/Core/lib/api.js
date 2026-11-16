import axios from 'axios';

/**
 * A client for the same `/api/v1` the mobile app uses.
 *
 * The browser session carries a bearer token, shared into every Inertia page as
 * `auth.user.token`. Talking to the real API rather than a parallel set of
 * web-only routes means entitlement and rate limits are enforced in exactly one
 * place — a web-only endpoint is a second place for those rules to drift.
 *
 * Every call returns the unwrapped `data` object, and throws an
 * `{ code, message, status }` on the envelope's error — the same contract the
 * mobile client works to.
 */
function client(token) {
    // The page's language, so the API's `formatted` money, labels and errors
    // match the page rather than the browser's Accept-Language.
    const locale = typeof document !== 'undefined' ? document.documentElement?.lang : '';

    return axios.create({
        baseURL: '/api/v1',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(locale ? { 'X-Locale': locale } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

function unwrap(response) {
    const body = response?.data;

    if (body?.error) {
        throw { code: body.error.code, message: body.error.message, status: response.status };
    }

    return body?.data ?? {};
}

function toError(error) {
    const body = error?.response?.data;

    if (body?.error) {
        return { code: body.error.code, message: body.error.message, fields: body.error.fields ?? null, status: error.response.status };
    }

    // A response without the envelope is the server failing (an HTML error
    // page, a proxy timeout), not the network: only no response at all is.
    if (error?.response) {
        return { code: 'SERVER_ERROR', message: error?.message ?? 'Request failed', status: error.response.status };
    }
    return { code: 'NETWORK_ERROR', message: error?.message ?? 'Request failed', status: undefined };
}

export function createApi(token) {
    const http = client(token);

    const call = async (method, path, payload) => {
        try {
            const response = await http.request({ method, url: path, data: payload });
            return unwrap(response);
        } catch (error) {
            throw toError(error);
        }
    };

    const callWithMeta = async (path) => {
        try {
            const response = await http.request({ method: 'get', url: path });
            const body = response?.data;
            if (body?.error) throw { code: body.error.code, message: body.error.message, status: response.status };
            return { data: body?.data ?? [], meta: body?.meta ?? {} };
        } catch (error) {
            throw error?.code ? error : toError(error);
        }
    };

    return {
        /** `{ data, meta }` — for lists, whose `meta.next_cursor` pages them. */
        list: (path) => callWithMeta(path),
        get: (path) => call('get', path),
        post: (path, payload) => call('post', path, payload),
        patch: (path, payload) => call('patch', path, payload),
        put: (path, payload) => call('put', path, payload),
        del: (path) => call('delete', path),
    };
}
