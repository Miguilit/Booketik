import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CalendarDays, Copy, Download, PenLine, Pencil, Plus, Trash2 } from 'lucide-react';
import { t } from '@/Core/i18n';
import { copyText, useAction, useDashboard } from '@/Core/dashboard';
import { money } from '@/Core/format';
import { ConfirmDialog, Panel, StatusPill, Table } from '../kit';
import { Button, EmptyState, Field, IconButton, Select, Textarea } from '../../ui';
import PromoCodeForm from './PromoCodeForm';
import ReferralLinks from './ReferralLinks';

/** Promote: the event's promo codes, its referral links and a share kit. */
export default function Promote({ event, data }) {
    const currency = event.ticket_types?.find((tier) => tier.price_cents > 0)?.currency ?? 'EUR';
    return (
        <div className="grid gap-6">
            <PromoCodes event={event} codes={data?.promo_codes ?? []} currency={currency} />
            <ReferralLinks event={event} links={data?.referral_links ?? []} />
            <ShareKit event={event} share={data?.share ?? {}} />
        </div>
    );
}

function PromoCodes({ event, codes, currency }) {
    const { api, can } = useDashboard();
    const { run, busy } = useAction();
    const [editing, setEditing] = useState(null);
    const [removing, setRemoving] = useState(null);

    const remove = async () => {
        const done = await run(() => api.org.del(`/promo-codes/${removing.id}`), {
            success: (d) => (d.deactivated ? t('The code was used, so it is switched off rather than deleted.') : t('Code deleted.')),
            reload: ['data'],
        });
        if (done) setRemoving(null);
    };

    const discount = (p) => (p.percent_off ? `${p.percent_off}%` : money(p.amount_off_cents, currency));

    return (
        <Panel title={t('Promo codes')} action={can.sales && <Button size="sm" variant="secondary" icon={Plus} onClick={() => setEditing({})}>{t('New code')}</Button>}>
            <Table
                caption={t('Promo codes')}
                rows={codes}
                empty={<EmptyState title={t('No promo codes')} body={t('Codes made here work for this event; organizer-wide codes live under Promote in the sidebar.')} />}
                columns={[
                    { key: 'code', label: t('Code'), render: (p) => <span className="font-mono font-medium text-ink">{p.code}</span> },
                    { key: 'discount', label: t('Discount'), render: discount },
                    { key: 'scope', label: t('Applies to'), render: (p) => (p.event ? t('This event') : t('Every event')) },
                    { key: 'used', label: t('Used'), align: 'end', render: (p) => <span className="font-mono">{p.used}{p.max_uses ? ` / ${p.max_uses}` : ''}</span> },
                    { key: 'state', label: t('State'), render: (p) => <StatusPill status={p.redeemable ? 'approved' : 'declined'} label={p.redeemable ? t('Redeemable') : p.is_active ? t('Out of window') : t('Off')} /> },
                    { key: 'actions', label: '', hideLabel: true, align: 'end', render: (p) => can.sales && (
                        <span className="inline-flex gap-1">
                            <IconButton label={t('Edit :code', { code: p.code })} icon={Pencil} className="h-8 w-8" onClick={() => setEditing(p)} />
                            <IconButton label={t('Delete :code', { code: p.code })} icon={Trash2} className="h-8 w-8" onClick={() => setRemoving(p)} />
                        </span>
                    ) },
                ]}
            />
            {editing && (
                <PromoCodeForm open onClose={() => setEditing(null)} promo={editing.id ? editing : null} event={event} currency={currency} timeZone={event.timezone} />
            )}
            <ConfirmDialog open={Boolean(removing)} onClose={() => setRemoving(null)} title={t('Delete :code?', { code: removing?.code ?? '' })} confirmLabel={t('Delete code')} busy={busy === 'default'} onConfirm={remove}>
                <p>{t('A code that has been used is switched off instead, so past orders keep their discount on record.')}</p>
            </ConfirmDialog>
        </Panel>
    );
}

function ShareKit({ event, share }) {
    const { api } = useDashboard();
    const { run, busy } = useAction();
    const [qr, setQr] = useState(null);
    const [tone, setTone] = useState('friendly');
    const [post, setPost] = useState('');

    useEffect(() => {
        if (!share.url) return;
        QRCode.toDataURL(share.url, { margin: 1, width: 360, color: { dark: '#13201F', light: '#FFFFFF' } }).then(setQr).catch(() => setQr(null));
    }, [share.url]);

    const text = encodeURIComponent(event.title);
    const url = encodeURIComponent(share.url ?? '');
    const intents = [
        { label: 'X', href: `https://twitter.com/intent/tweet?text=${text}&url=${url}` },
        { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
        { label: 'WhatsApp', href: `https://wa.me/?text=${text}%20${url}` },
        { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    ];

    const write = async () => {
        const done = await run(() => api.post('/ai/describe', { purpose: 'announcement', event_id: event.id, tone, text: t('A short social post inviting people to the event, with the link at the end.') }), { key: 'post' });
        if (done) setPost([done.subject, done.text, share.url].filter(Boolean).join('\n\n'));
    };

    return (
        <Panel title={t('Share kit')}>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_200px]">
                <div className="min-w-0 space-y-5">
                    <Field label={t('Event link')} htmlFor="share-url">
                        <div className="flex gap-2">
                            <input id="share-url" readOnly value={share.url ?? ''} className="form-input block w-full min-w-0 rounded-sm border-key border-line bg-raised px-3.5 py-2.5 font-mono text-sm text-ink" onFocus={(e) => e.target.select()} />
                            <Button variant="secondary" icon={Copy} onClick={() => copyText(share.url, t('Link copied'))}>{t('Copy')}</Button>
                        </div>
                    </Field>
                    <div>
                        <p className="mb-2 text-sm font-semibold text-ink">{t('Share to')}</p>
                        <div className="flex flex-wrap gap-2">
                            {intents.map((i) => <Button key={i.label} size="sm" variant="quiet" href={i.href} external>{i.label}</Button>)}
                        </div>
                    </div>
                    {share.calendar && (
                        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                            <CalendarDays className="h-4 w-4" aria-hidden="true" />
                            {t('Calendar feed of all your events:')}
                            <button type="button" className="font-mono text-link hover:underline" onClick={() => copyText(share.calendar, t('Feed copied'))}>{t('copy the .ics link')}</button>
                        </p>
                    )}
                    <div className="rounded-sm border border-line p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <Field label={t('Tone')} htmlFor="share-tone" className="w-40">
                                <Select id="share-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                                    <option value="friendly">{t('Friendly')}</option>
                                    <option value="professional">{t('Professional')}</option>
                                    <option value="hype">{t('Hype')}</option>
                                </Select>
                            </Field>
                            <Button variant="secondary" icon={PenLine} loading={busy === 'post'} onClick={write}>{t('Write a social post')}</Button>
                        </div>
                        {post && (
                            <div className="mt-3">
                                <label htmlFor="share-post" className="sr-only">{t('Social post')}</label>
                                <Textarea id="share-post" value={post} onChange={(e) => setPost(e.target.value)} rows={6} />
                                <div className="mt-2 flex justify-end"><Button size="sm" variant="quiet" icon={Copy} onClick={() => copyText(post)}>{t('Copy post')}</Button></div>
                            </div>
                        )}
                    </div>
                    {share.og_image && (
                        <div>
                            <p className="mb-2 text-sm font-semibold text-ink">{t('Share image (what a link preview shows)')}</p>
                            <img src={share.og_image} alt={t('Share image for :title', { title: event.title })} className="w-full max-w-md rounded-sm border border-line" loading="lazy" />
                        </div>
                    )}
                </div>
                <div className="text-center">
                    {qr ? (
                        <>
                            <img src={qr} alt={t('QR code for the event link')} width="180" height="180" className="mx-auto rounded-sm border border-line bg-white p-2" />
                            <Button size="sm" variant="quiet" icon={Download} className="mt-2" href={qr} external download={`${event.slug}-qr.png`}>{t('Download QR')}</Button>
                        </>
                    ) : null}
                </div>
            </div>
        </Panel>
    );
}
