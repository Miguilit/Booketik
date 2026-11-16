/*
 | Tickets: the rotating QR, transfer and refund requests.
 |
 | The QR payload is `EG1:{code}:{totp}` — RFC 6238 (HMAC-SHA1, 30 s, 8
 | digits) over the ticket's base32 `qr.secret` (TicketService::totp()). It
 | is computed here, so a ticket page that has loaded keeps working at a door
 | with no signal. The QR itself is an SVG string from `qrcode`; a theme
 | injects it into its own frame and chooses the colours (ink on light stock —
 | scanners want dark-on-light whatever the page's mode).
 */
import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { createApi } from './lib/api';
import { t } from './i18n';

function base32ToBytes(secret) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = String(secret).toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
    let bits = '';
    for (const ch of clean) {
        const v = alphabet.indexOf(ch);
        if (v < 0) continue;
        bits += v.toString(2).padStart(5, '0');
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
    return bytes;
}

/** RFC 6238 TOTP. Null where WebCrypto is unavailable (plain http on a LAN IP). */
export async function totp(secret, { period = 30, digits = 8, at = Date.now() } = {}) {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null;
    const counter = Math.floor(at / 1000 / period);
    const msg = new ArrayBuffer(8);
    const view = new DataView(msg);
    view.setUint32(0, Math.floor(counter / 2 ** 32));
    view.setUint32(4, counter >>> 0);
    const key = await crypto.subtle.importKey('raw', base32ToBytes(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
    const offset = mac[mac.length - 1] & 0x0f;
    const code = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
    return String(code % 10 ** digits).padStart(digits, '0');
}

export function qrSvg(payload, { dark = '#13201F', light = '#FFFFFF', margin = 1 } = {}) {
    return QRCode.toString(payload, { type: 'svg', margin, errorCorrectionLevel: 'M', color: { dark, light } });
}

/**
 * `{ payload, svg, secondsLeft, period, rotating, usable }` for a ticket with `qr`.
 * Rotates every period; `usable` is false for transferred/refunded/void tickets.
 */
export function useTicketQr(ticket, colors) {
    const period = ticket?.qr?.period ?? 30;
    const digits = ticket?.qr?.digits ?? 8;
    const secret = ticket?.qr?.secret ?? null;
    const usable = ['valid', 'checked_in'].includes(ticket?.status);
    const [now, setNow] = useState(() => Date.now());
    const [payload, setPayload] = useState(null);
    const [svg, setSvg] = useState(null);

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const windowIndex = Math.floor(now / 1000 / period);

    useEffect(() => {
        let cancelled = false;
        if (!ticket?.code || !usable) {
            setPayload(null);
            setSvg(null);
            return undefined;
        }
        (async () => {
            const code = secret ? await totp(secret, { period, digits, at: windowIndex * period * 1000 }) : null;
            const next = code ? `EG1:${ticket.code}:${code}` : `EG1:${ticket.code}`;
            const markup = await qrSvg(next, colors);
            if (!cancelled) {
                setPayload(next);
                setSvg(markup);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticket?.code, secret, windowIndex, usable, colors?.dark, colors?.light]);

    return {
        payload,
        svg,
        usable,
        rotating: Boolean(secret),
        period,
        secondsLeft: period - (Math.floor(now / 1000) % period),
    };
}

export function ticketStatusLabel(status) {
    return {
        valid: t('Valid'),
        checked_in: t('Checked in'),
        refunded: t('Refunded'),
        transferred: t('Transferred'),
        void: t('Void'),
    }[status] ?? status;
}

/** Transfer to someone else, or ask for a refund — both through `/me/tickets/{code}/…`. */
export function useTicketActions(initial) {
    const { auth } = usePage().props;
    const api = useMemo(() => createApi(auth?.user?.token), [auth?.user?.token]);
    const [ticket, setTicket] = useState(initial);
    const [busy, setBusy] = useState(null);
    const [errors, setErrors] = useState({});
    const [refund, setRefund] = useState(null);

    useEffect(() => setTicket(initial), [initial]);

    const transfer = async ({ name, email }) => {
        setBusy('transfer');
        setErrors({});
        try {
            const next = await api.post(`/me/tickets/${ticket.code}/transfer`, { name, email });
            setTicket(next);
            toast.success(t('Ticket sent to :name.', { name }));
            return true;
        } catch (e) {
            setErrors(e?.fields ?? { form: [e?.message ?? t('Could not transfer the ticket.')] });
            return false;
        } finally {
            setBusy(null);
        }
    };

    const requestRefund = async (reason) => {
        setBusy('refund');
        setErrors({});
        try {
            const result = await api.post(`/me/tickets/${ticket.code}/refund-request`, { reason });
            setRefund(result);
            toast.success(t('Refund requested. The organizer will decide.'));
            return true;
        } catch (e) {
            setErrors({ refund: [e?.message ?? t('Could not request a refund.')] });
            return false;
        } finally {
            setBusy(null);
        }
    };

    return { ticket, busy, errors, refund, transfer, requestRefund };
}
