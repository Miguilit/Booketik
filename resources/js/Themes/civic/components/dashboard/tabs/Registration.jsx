import { useState } from 'react';
import { ListChecks, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { Button, Checkbox, EmptyState, Field, Input, Modal, Select, Tag, Toggle } from '../../ui';
import { ConfirmDialog, Panel } from '../kit';
import { RELOAD, Section, useEventSave } from './shared';

const TYPES = { text: 'Short answer', select: 'Choose one', checkbox: 'Yes / no' };

function QuestionForm({ event, question, onClose }) {
    const { api } = useDashboard();
    const { run, busy, errors } = useAction();
    const [form, setForm] = useState(() => ({ label: question?.label ?? '', type: question?.type ?? 'text', options: question?.options ?? [], required: question?.required ?? false }));
    const [option, setOption] = useState('');
    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        const body = { ...form, options: form.type === 'select' ? form.options : [] };
        const ok = await run(() => (question ? api.org.patch(`/events/${event.id}/questions/${question.id}`, body) : api.org.post(`/events/${event.id}/questions`, body)), {
            success: t('Question saved'), reload: RELOAD,
        });
        if (ok) onClose();
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Field label={t('Question')} htmlFor="q-label" required error={errors.label}>
                <Input id="q-label" value={form.label} onChange={(e) => set('label')(e.target.value)} placeholder={t('What do you work on?')} />
            </Field>
            <Field label={t('Answer type')} htmlFor="q-type">
                <Select id="q-type" value={form.type} onChange={(e) => set('type')(e.target.value)}>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
                </Select>
            </Field>
            {form.type === 'select' && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-ink">{t('Options')}</p>
                    <ul className="flex flex-wrap gap-2">
                        {form.options.map((o) => (
                            <li key={o}><button type="button" onClick={() => set('options')(form.options.filter((x) => x !== o))} className="rounded-chip bg-raised px-3 py-1 text-sm text-ink hover:bg-line" aria-label={t('Remove :o', { o })}>{o} ×</button></li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <Input aria-label={t('New option')} value={option} onChange={(e) => setOption(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (option.trim()) { set('options')([...new Set([...form.options, option.trim()])]); setOption(''); } } }} placeholder={t('Add an option and press Enter')} />
                        <Button variant="secondary" onClick={() => { if (option.trim()) { set('options')([...new Set([...form.options, option.trim()])]); setOption(''); } }}>{t('Add')}</Button>
                    </div>
                    {errors.options && <p className="text-sm text-danger">{errors.options}</p>}
                </div>
            )}
            <Checkbox label={t('Required')} checked={form.required} onChange={(e) => set('required')(e.target.checked)} />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
                <Button type="submit" variant="primary" loading={!!busy}>{t('Save question')}</Button>
            </div>
        </form>
    );
}

export default function Registration({ event }) {
    const { api } = useDashboard();
    const { save, busy, errors } = useEventSave(event);
    const remover = useAction();
    const [form, setForm] = useState({
        approval_required: event.approval_required,
        capacity: event.capacity ?? '',
        waitlist_enabled: event.waitlist_enabled,
        waitlist_claim_hours: event.waitlist_claim_hours ?? '',
        guest_list_visibility: event.guest_list_visibility,
    });
    const [editing, setEditing] = useState(null);
    const [removing, setRemoving] = useState(null);
    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        save({
            approval_required: form.approval_required,
            capacity: form.capacity === '' ? null : Number(form.capacity),
            waitlist_enabled: form.waitlist_enabled,
            waitlist_claim_hours: form.waitlist_claim_hours === '' ? null : Number(form.waitlist_claim_hours),
            guest_list_visibility: form.guest_list_visibility,
        }, { success: t('Saved') });
    };

    return (
        <div className="space-y-6">
            <form onSubmit={submit}>
                <Section title={t('Who gets in')} description={t('Approval puts every request in your queue; capacity caps the whole event across tiers.')}>
                    <Toggle checked={form.approval_required} onChange={set('approval_required')} label={t('Approve each guest')} description={t('People request a place; you approve or decline from Guests.')} />
                    <Field label={t('Capacity')} htmlFor="capacity" error={errors.capacity}>
                        <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => set('capacity')(e.target.value)} placeholder={t('No overall limit')} />
                    </Field>
                </Section>
                <Section title={t('Waitlist')} description={t('When it is full, people join a waitlist. A freed seat is offered to the next person, held for the claim window.')}>
                    <Toggle checked={form.waitlist_enabled} onChange={set('waitlist_enabled')} label={t('Waitlist when full')} />
                    {form.waitlist_enabled && (
                        <Field label={t('Claim window (hours)')} htmlFor="claim" error={errors.waitlist_claim_hours}>
                            <Input id="claim" type="number" min={1} max={168} value={form.waitlist_claim_hours} onChange={(e) => set('waitlist_claim_hours')(e.target.value)} placeholder={t('Default: :n hours', { n: event.waitlist_claim_hours_default })} />
                        </Field>
                    )}
                </Section>
                <Section title={t('Guest list')} description={t('Who can see who is going on the event page.')}>
                    <Field label={t('Guest list visibility')} htmlFor="glv">
                        <Select id="glv" value={form.guest_list_visibility} onChange={(e) => set('guest_list_visibility')(e.target.value)}>
                            <option value="public">{t('Everyone sees who is going')}</option>
                            <option value="after_rsvp">{t('Only guests who registered')}</option>
                            <option value="count_only">{t('Only the count')}</option>
                            <option value="hidden">{t('Hidden')}</option>
                        </Select>
                    </Field>
                </Section>
                <div className="flex justify-end"><Button type="submit" variant="primary" icon={Save} loading={busy === 'save'}>{t('Save')}</Button></div>
            </form>

            <Panel title={t('Questions at registration')} action={<Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing('new')}>{t('Add question')}</Button>}>
                {(event.questions ?? []).length === 0 ? (
                    <EmptyState icon={ListChecks} title={t('No questions')} body={t('Ask what you need to know — answers show up on the guest list and in the CSV export.')} />
                ) : (
                    <ul className="divide-y divide-line">
                        {event.questions.map((q) => (
                            <li key={q.id} className="flex flex-wrap items-center gap-3 py-3">
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold text-ink">{q.label}</span>
                                    <span className="text-sm text-muted">{t(TYPES[q.type] ?? q.type)}{q.type === 'select' ? ` · ${q.options.join(', ')}` : ''}</span>
                                </span>
                                {q.required && <Tag tone="warn">{t('Required')}</Tag>}
                                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(q)}>{t('Edit')}</Button>
                                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setRemoving(q)} aria-label={t('Delete question')} />
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? t('New question') : t('Edit question')}>
                {editing && <QuestionForm event={event} question={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
            </Modal>
            <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} title={t('Delete this question?')} confirmLabel={t('Delete')} busy={!!remover.busy}
                onConfirm={async () => { await remover.run(() => api.org.del(`/events/${event.id}/questions/${removing.id}`), { success: t('Question deleted'), reload: RELOAD }); setRemoving(null); }}>
                <p>{t('Answers people already gave stay on their registrations.')}</p>
            </ConfirmDialog>
        </div>
    );
}
