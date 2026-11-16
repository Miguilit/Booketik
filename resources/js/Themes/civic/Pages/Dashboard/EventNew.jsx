import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { timeZones, useAction, useDashboard, useEventDraft } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { DoubtMark, Hint, MoneyInput, PageHead, Panel, ZonedDateTime } from '@/Themes/civic/components/dashboard/kit';
import DraftSource from '@/Themes/civic/components/dashboard/DraftSource';
import RichTextEditor from '@/Themes/civic/components/dashboard/RichTextEditor';
import { Button, Field, IconButton, Input, Notice, Select } from '@/Themes/civic/components/ui';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The draft's `description_blocks` as editor HTML (paragraphs, headings, lists). */
function blocksToHtml(blocks = []) {
    const span = (s) => {
        let out = esc(s.t);
        if (s.b) out = `<strong>${out}</strong>`;
        if (s.i) out = `<em>${out}</em>`;
        return out;
    };
    return blocks.map((b) => {
        const inner = (b.spans ?? []).map(span).join('');
        if (b.kind === 'heading') return `<h2>${inner}</h2>`;
        if (b.kind === 'subheading') return `<h3>${inner}</h3>`;
        if (b.kind === 'quote') return `<blockquote><p>${inner}</p></blockquote>`;
        if (b.kind === 'list') return `<${b.ordered ? 'ol' : 'ul'}>${(b.items ?? []).map((it) => `<li>${(it.spans ?? it ?? []).map?.(span).join('') ?? esc(it)}</li>`).join('')}</${b.ordered ? 'ol' : 'ul'}>`;
        return `<p>${inner}</p>`;
    }).join('');
}

function blank(timezone, currency) {
    const start = new Date(Date.now() + 14 * 86400000);
    start.setUTCMinutes(0, 0, 0);
    return {
        title: '', summary: '', timezone, starts_at: start.toISOString().replace('.000Z', 'Z'), ends_at: null, format: 'in_person',
        venue: { name: '', address: '', city: '' }, category_slug: '', description_html: '', lineup: [], age_min: '',
        ticket_types: [{ name: t('General'), kind: 'free', price: { amount: 0, currency }, quantity: null }],
    };
}

function fromDraft(d, timezone, currency) {
    return {
        ...blank(d.timezone || timezone, currency),
        title: d.title ?? '', summary: d.summary ?? '', starts_at: d.starts_at, ends_at: d.ends_at, format: d.format ?? 'in_person',
        timezone: d.timezone || timezone,
        venue: { name: d.venue?.name ?? '', address: d.venue?.address ?? '', city: d.venue?.city ?? '', lat: d.venue?.lat ?? null, lng: d.venue?.lng ?? null },
        category_slug: d.category?.slug ?? '', description_html: blocksToHtml(d.description_blocks), lineup: d.lineup ?? [], age_min: d.age_min ?? '',
        ticket_types: (d.ticket_types?.length ? d.ticket_types : blank(timezone, currency).ticket_types).map((tt) => ({ name: tt.name, kind: tt.kind, price: { amount: tt.price?.amount ?? 0, currency: tt.price?.currency ?? currency }, quantity: tt.quantity ?? null })),
    };
}

/** Create an event: from a pasted text, a flyer or a link (AI), or from scratch — always as a draft. */
export default function EventNew({ categories = [], timezone }) {
    const { api, org, path, frame } = useDashboard();
    const ai = useEventDraft(api, org?.slug);
    const { run, busy, errors } = useAction();
    const [form, setForm] = useState(null);
    const [editorKey, setEditorKey] = useState(0);

    const set = (field, value, doubtKey = field) => {
        setForm((f) => ({ ...f, [field]: value }));
        ai.confirm(doubtKey);
    };
    const setTier = (i, patch) => {
        setForm((f) => ({ ...f, ticket_types: f.ticket_types.map((tt, j) => (j === i ? { ...tt, ...patch } : tt)) }));
        ai.confirm('ticket_types');
    };

    const draft = async (input) => {
        const data = await ai.draft(input);
        if (data?.draft) {
            setForm(fromDraft(data.draft, timezone, org?.currency ?? 'EUR'));
            setEditorKey((k) => k + 1);
        }
    };

    const create = (e) => {
        e.preventDefault();
        const venue = form.format === 'online' || !form.venue.name.trim() ? null : form.venue;
        const body = {
            title: form.title.trim(), summary: form.summary || null, starts_at: form.starts_at, ends_at: form.ends_at || null, timezone: form.timezone,
            format: form.format, venue, category_slug: form.category_slug || null, description_html: form.description_html || null, lineup: form.lineup,
            age_min: form.age_min === '' ? null : Number(form.age_min),
            ticket_types: form.ticket_types.filter((tt) => tt.name.trim()).map((tt) => ({ ...tt, price: tt.kind === 'free' ? null : tt.price })),
        };
        run(() => api.org.post('/events', body), { key: 'create', success: t('Draft saved. Check the details, then publish.') })
            .then((data) => data?.id && router.visit(path(`/events/${data.id}/basics`)));
    };

    const doubt = (f) => ai.isDoubtful(f);
    const zones = timeZones(form?.timezone);

    return (
        <>
            <Head title={t('Create an event')} />
            <PageHead title={t('Create an event')} subtitle={t('Everything starts as a draft. You can change all of it later.')} />

            {!form && (
                <DraftSource busy={ai.busy} credits={frame?.credits} onDraft={draft} onBlank={() => setForm(blank(timezone, org?.currency ?? 'EUR'))} />
            )}

            {form && (
                <form onSubmit={create} className="space-y-5">
                    <Button variant="link" icon={ArrowLeft} onClick={() => { setForm(null); ai.reset(); }}>{t('Start over')}</Button>
                    {ai.result && (
                        <Notice tone={ai.doubtful.length ? 'warn' : 'success'}>
                            {ai.doubtful.length
                                ? t(':n fields are marked — the reader was not sure about them. Check each one; editing it clears the mark.', { n: ai.doubtful.length })
                                : t('Every field is checked. Have a last look, then save the draft.')}
                        </Notice>
                    )}

                    <Panel title={t('What and when')}>
                        <div className="grid gap-4 md:grid-cols-2">
                            <DoubtMark doubtful={doubt('title')}>
                                <Field label={t('Title')} htmlFor="ev-title" error={errors.title} required>
                                    <Input id="ev-title" value={form.title} onChange={(e) => set('title', e.target.value)} required maxLength={140} />
                                </Field>
                            </DoubtMark>
                            <DoubtMark doubtful={doubt('category')}>
                                <Field label={t('Category')} htmlFor="ev-cat">
                                    <Select id="ev-cat" value={form.category_slug} onChange={(e) => set('category_slug', e.target.value, 'category')}>
                                        <option value="">{t('Choose one')}</option>
                                        {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                    </Select>
                                </Field>
                            </DoubtMark>
                            <DoubtMark doubtful={doubt('summary')}>
                                <Field label={t('One-line summary')} htmlFor="ev-summary" className="md:col-span-2">
                                    <Input id="ev-summary" value={form.summary} onChange={(e) => set('summary', e.target.value)} maxLength={255} />
                                </Field>
                            </DoubtMark>
                            <DoubtMark doubtful={doubt('timezone')}>
                                <Field label={t('Time zone')} htmlFor="ev-tz">
                                    <Select id="ev-tz" value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
                                        {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                                    </Select>
                                </Field>
                            </DoubtMark>
                            <DoubtMark doubtful={doubt('format')}>
                                <Field label={t('Format')} htmlFor="ev-format">
                                    <Select id="ev-format" value={form.format} onChange={(e) => set('format', e.target.value)}>
                                        <option value="in_person">{t('In person')}</option>
                                        <option value="online">{t('Online')}</option>
                                        <option value="hybrid">{t('Hybrid')}</option>
                                    </Select>
                                </Field>
                            </DoubtMark>
                            <DoubtMark doubtful={doubt('starts_at')}>
                                <Field label={t('Starts')} htmlFor="ev-start" error={errors.starts_at} required>
                                    <ZonedDateTime id="ev-start" value={form.starts_at} onChange={(v) => set('starts_at', v)} timeZone={form.timezone} required />
                                </Field>
                            </DoubtMark>
                            <DoubtMark doubtful={doubt('ends_at')}>
                                <Field label={t('Ends')} htmlFor="ev-end" error={errors.ends_at}>
                                    <ZonedDateTime id="ev-end" value={form.ends_at} onChange={(v) => set('ends_at', v)} timeZone={form.timezone} />
                                </Field>
                            </DoubtMark>
                        </div>
                    </Panel>

                    {form.format !== 'online' && (
                        <Panel title={t('Where')}>
                            <DoubtMark doubtful={doubt('venue')}>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label={t('Venue')} htmlFor="ev-venue"><Input id="ev-venue" value={form.venue.name} onChange={(e) => set('venue', { ...form.venue, name: e.target.value })} /></Field>
                                    <Field label={t('Address')} htmlFor="ev-addr"><Input id="ev-addr" value={form.venue.address} onChange={(e) => set('venue', { ...form.venue, address: e.target.value })} /></Field>
                                    <Field label={t('City')} htmlFor="ev-city"><Input id="ev-city" value={form.venue.city} onChange={(e) => set('venue', { ...form.venue, city: e.target.value })} /></Field>
                                </div>
                            </DoubtMark>
                            <Hint>{t('You can pin it on the map in Basics after saving (OpenStreetMap search).')}</Hint>
                        </Panel>
                    )}

                    <Panel title={t('Tickets')}>
                        <DoubtMark doubtful={doubt('ticket_types')}>
                            <div className="space-y-3">
                                {form.ticket_types.map((tt, i) => (
                                    <div key={i} className="grid items-end gap-3 rounded-sm border border-line p-3 sm:grid-cols-[1.4fr_0.9fr_1fr_0.8fr_auto]">
                                        <Field label={t('Name')} htmlFor={`tt-name-${i}`}><Input id={`tt-name-${i}`} value={tt.name} onChange={(e) => setTier(i, { name: e.target.value })} /></Field>
                                        <Field label={t('Kind')} htmlFor={`tt-kind-${i}`}>
                                            <Select id={`tt-kind-${i}`} value={tt.kind} onChange={(e) => setTier(i, { kind: e.target.value })}>
                                                <option value="free">{t('Free')}</option><option value="paid">{t('Paid')}</option><option value="donation">{t('Donation')}</option>
                                            </Select>
                                        </Field>
                                        <Field label={t('Price')} htmlFor={`tt-price-${i}`}>
                                            <MoneyInput id={`tt-price-${i}`} value={tt.price?.amount} currency={tt.price?.currency} disabled={tt.kind === 'free'} onChange={(amount) => setTier(i, { price: { ...tt.price, amount: amount ?? 0 } })} />
                                        </Field>
                                        <Field label={t('Quantity')} htmlFor={`tt-qty-${i}`}><Input id={`tt-qty-${i}`} type="number" min={1} value={tt.quantity ?? ''} placeholder={t('No limit')} onChange={(e) => setTier(i, { quantity: e.target.value ? Number(e.target.value) : null })} /></Field>
                                        <IconButton label={t('Remove tier')} icon={Trash2} onClick={() => setForm((f) => ({ ...f, ticket_types: f.ticket_types.filter((_, j) => j !== i) }))} />
                                    </div>
                                ))}
                                <Button variant="secondary" size="sm" icon={Plus} onClick={() => setForm((f) => ({ ...f, ticket_types: [...f.ticket_types, { name: '', kind: 'paid', price: { amount: 0, currency: org?.currency ?? 'EUR' }, quantity: null }] }))}>{t('Add a tier')}</Button>
                            </div>
                        </DoubtMark>
                        <Hint>{t('Prices are what you get before the platform fee; buyers see the total with fees included.')}</Hint>
                    </Panel>

                    <Panel title={t('Description')}>
                        <DoubtMark doubtful={doubt('description_blocks')}>
                            <RichTextEditor key={editorKey} value={form.description_html} onChange={(html) => set('description_html', html, 'description_blocks')} placeholder={t('What happens, who it is for, what to bring.')} label={t('Description')} />
                        </DoubtMark>
                        {form.lineup.length > 0 && (
                            <DoubtMark doubtful={doubt('lineup')}>
                                <Field label={t('Lineup (comma separated)')} htmlFor="ev-lineup" className="mt-4">
                                    <Input id="ev-lineup" value={form.lineup.join(', ')} onChange={(e) => set('lineup', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
                                </Field>
                            </DoubtMark>
                        )}
                        <DoubtMark doubtful={doubt('age_min')}>
                            <Field label={t('Minimum age')} htmlFor="ev-age" className="mt-4 max-w-[200px]">
                                <Input id="ev-age" type="number" min={0} max={99} value={form.age_min} onChange={(e) => set('age_min', e.target.value)} placeholder={t('All ages')} />
                            </Field>
                        </DoubtMark>
                    </Panel>

                    <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-bg/95 px-4 py-3 sm:mx-0 sm:rounded-card sm:border">
                        {ai.doubtful.length > 0 && <span className="me-auto text-sm font-semibold text-warning">{t(':n to check', { n: ai.doubtful.length })}</span>}
                        <Button type="submit" variant="cta" loading={busy === 'create'} disabled={!form.title.trim() || !form.starts_at}>{t('Save draft')}</Button>
                    </div>
                </form>
            )}
        </>
    );
}

EventNew.layout = dashLayout;
