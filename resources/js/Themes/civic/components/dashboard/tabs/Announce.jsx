import { useState } from 'react';
import { Languages, PenLine, Send } from 'lucide-react';
import { t } from '@/Core/i18n';
import { useAction, useDashboard } from '@/Core/dashboard';
import { Panel, Table } from '../kit';
import { Button, Checkbox, EmptyState, Field, Input, Notice, Select, Textarea } from '../../ui';

const LOCALES = [['en', 'English'], ['de', 'Deutsch'], ['es', 'Español'], ['fr', 'Français'], ['it', 'Italiano'], ['pt', 'Português'], ['ja', '日本語'], ['ko', '한국어'], ['tr', 'Türkçe'], ['zh', '中文'], ['ar', 'العربية'], ['ru', 'Русский']];

function segmentLabel(segment) {
    return { going: t('Everyone going'), waitlist: t('The waitlist'), all: t('Everyone registered'), ticket_type: t('One ticket tier') }[segment] ?? segment;
}

/** Announce: compose to a segment by push and/or email, draft and translate with AI, see the history. */
export default function Announce({ event, data }) {
    const { api } = useDashboard();
    const { run, busy, errors } = useAction();
    const preset = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('compose') : null;
    // The recap's thank-you draft arrives as ?subject=&body= — prefilled, never sent.
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const [form, setForm] = useState({
        subject: params?.get('subject') ?? '',
        body: params?.get('body') ?? '',
        segment: preset === 'waitlist' ? 'waitlist' : 'going',
        ticket_type_id: event.ticket_types?.[0]?.id ?? '',
        channels: ['push', 'email'],
    });
    const [notes, setNotes] = useState('');
    const [tone, setTone] = useState('friendly');
    const [target, setTarget] = useState('de');
    const [limit, setLimit] = useState(data?.limit ?? null);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const toggleChannel = (c, on) => set('channels', on ? [...new Set([...form.channels, c])] : form.channels.filter((x) => x !== c));

    const draft = async () => {
        const done = await run(() => api.post('/ai/describe', { purpose: 'announcement', event_id: event.id, text: notes.trim() || form.body || null, tone }), { key: 'draft' });
        if (done) setForm((f) => ({ ...f, subject: done.subject ?? f.subject, body: done.text ?? f.body }));
    };

    const translate = async () => {
        if (!form.body.trim()) return;
        const body = await run(() => api.post('/ai/translate', { text: form.body, target_locale: target }), { key: 'translate' });
        const subject = form.subject.trim() ? await run(() => api.post('/ai/translate', { text: form.subject, target_locale: target }), { key: 'translate', quiet: true }) : null;
        if (body) setForm((f) => ({ ...f, body: body.text, subject: subject?.text ?? f.subject }));
    };

    const send = async () => {
        const done = await run(() => api.org.post(`/events/${event.id}/announcements`, {
            subject: form.subject.trim() || null,
            body: form.body,
            audience: { segment: form.segment, ticket_type_id: form.segment === 'ticket_type' ? form.ticket_type_id : null },
            channels: form.channels,
        }), { key: 'send', success: (d) => t('Sent to :n people.', { n: d.recipient_count }), reload: ['data'] });
        if (done) {
            setLimit(done.rate_limit);
            setForm((f) => ({ ...f, subject: '', body: '' }));
        }
    };

    const exhausted = limit && limit.remaining <= 0;

    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Panel title={t('New announcement')}>
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={t('Who gets it')} htmlFor="an-seg" error={errors['audience.segment']}>
                            <Select id="an-seg" value={form.segment} onChange={(e) => set('segment', e.target.value)}>
                                {['going', 'waitlist', 'all', 'ticket_type'].map((s) => <option key={s} value={s}>{segmentLabel(s)}</option>)}
                            </Select>
                        </Field>
                        {form.segment === 'ticket_type' && (
                            <Field label={t('Tier')} htmlFor="an-tier" error={errors['audience.ticket_type_id']}>
                                <Select id="an-tier" value={form.ticket_type_id} onChange={(e) => set('ticket_type_id', e.target.value)}>
                                    {event.ticket_types?.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
                                </Select>
                            </Field>
                        )}
                    </div>
                    <fieldset>
                        <legend className="mb-1.5 text-sm font-semibold text-ink">{t('Send by')}</legend>
                        <div className="flex flex-wrap gap-5">
                            <Checkbox label={t('Push notification')} checked={form.channels.includes('push')} onChange={(e) => toggleChannel('push', e.target.checked)} />
                            <Checkbox label={t('Email')} checked={form.channels.includes('email')} onChange={(e) => toggleChannel('email', e.target.checked)} />
                        </div>
                        {errors.channels && <p className="mt-1 text-sm text-danger">{errors.channels}</p>}
                    </fieldset>
                    <Field label={t('Subject')} htmlFor="an-subject" error={errors.subject} hint={<span className="font-mono text-xs text-muted">{form.subject.length}/120</span>}>
                        <Input id="an-subject" maxLength={120} value={form.subject} onChange={(e) => set('subject', e.target.value)} />
                    </Field>
                    <Field label={t('Message')} htmlFor="an-body" error={errors.body} required hint={<span className="font-mono text-xs text-muted">{form.body.length}/2000</span>}>
                        <Textarea id="an-body" rows={7} maxLength={2000} value={form.body} onChange={(e) => set('body', e.target.value)} />
                    </Field>
                    {exhausted && <Notice tone="warn">{t('Today’s announcements are used up. More from :time.', { time: new Date(limit.resets_at).toLocaleString() })}</Notice>}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {limit && <p className="font-mono text-sm text-muted">{t(':n of :max left today', { n: limit.remaining, max: limit.limit })}</p>}
                        <Button variant="cta" icon={Send} loading={busy === 'send'} disabled={exhausted || !form.body.trim() || !form.channels.length} onClick={send}>{t('Send announcement')}</Button>
                    </div>
                </div>
            </Panel>

            <div className="space-y-5">
                <Panel title={t('Draft with AI')}>
                    <div className="space-y-3">
                        <Field label={t('What should it say?')} htmlFor="an-notes">
                            <Textarea id="an-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('e.g. doors open 30 minutes earlier, bring ID')} />
                        </Field>
                        <Field label={t('Tone')} htmlFor="an-tone">
                            <Select id="an-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                                <option value="friendly">{t('Friendly')}</option>
                                <option value="professional">{t('Professional')}</option>
                                <option value="hype">{t('Hype')}</option>
                            </Select>
                        </Field>
                        <Button block variant="secondary" icon={PenLine} loading={busy === 'draft'} onClick={draft}>{t('Write the draft')}</Button>
                        <p className="text-xs text-muted">{t('Fills the subject and message for you to edit. Nothing is sent until you press Send.')}</p>
                    </div>
                </Panel>
                <Panel title={t('Translate')}>
                    <div className="flex items-end gap-2">
                        <Field label={t('Into')} htmlFor="an-lang" className="flex-1">
                            <Select id="an-lang" value={target} onChange={(e) => setTarget(e.target.value)}>
                                {LOCALES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                            </Select>
                        </Field>
                        <Button variant="secondary" icon={Languages} loading={busy === 'translate'} disabled={!form.body.trim()} onClick={translate}>{t('Translate')}</Button>
                    </div>
                </Panel>
            </div>

            <Panel title={t('Sent')} className="lg:col-span-2">
                <Table
                    caption={t('Sent announcements')}
                    rows={data?.history ?? []}
                    empty={<EmptyState title={t('Nothing sent yet')} body={t('Announcements reach guests’ phones and inboxes, and stay on the event’s page for them.')} />}
                    columns={[
                        { key: 'msg', label: t('Message'), render: (a) => (
                            <span className="block max-w-[34rem]">
                                {a.subject && <span className="block font-semibold text-ink">{a.subject}</span>}
                                <span className="line-clamp-2 text-sm text-body">{a.body}</span>
                            </span>
                        ) },
                        { key: 'aud', label: t('To'), render: (a) => segmentLabel(a.audience?.segment) },
                        { key: 'ch', label: t('By'), render: (a) => (a.channels ?? []).join(' + ') },
                        { key: 'n', label: t('People'), align: 'end', render: (a) => <span className="font-mono">{a.recipient_count}</span> },
                        { key: 'who', label: t('From'), render: (a) => a.author ?? '—' },
                        { key: 'at', label: t('When'), render: (a) => <span className="font-mono text-sm">{a.created_at ? new Date(a.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</span> },
                    ]}
                />
            </Panel>
        </div>
    );
}
