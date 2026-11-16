import { useState } from 'react';
import { CalendarRange, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { AgendaBuilder } from '../AiCards';
import { Button, EmptyState, Modal, Notice, Tabs, Tag } from '../../ui';
import { ConfirmDialog, Panel } from '../kit';
import { CallForSpeakers, ItemForm } from './agendaParts';
import { RELOAD, useEventSave, zonedLabel } from './shared';

const KINDS = [
    { value: 'sessions', label: 'Sessions', module: 'agenda', singular: 'session' },
    { value: 'tracks', label: 'Tracks', module: 'agenda', singular: 'track' },
    { value: 'speakers', label: 'Speakers', module: 'speakers', singular: 'speaker' },
    { value: 'sponsors', label: 'Sponsors', module: 'sponsors', singular: 'sponsor' },
    { value: 'cfs', label: 'Call for speakers', module: 'speakers' },
];

function line(kind, item, event, programme) {
    switch (kind) {
        case 'sessions': {
            const track = programme.tracks.find((tr) => tr.id === item.track_id);
            return [zonedLabel(item.starts_at, event.timezone), item.room, track?.name, item.speakers?.join(', ')].filter(Boolean).join(' · ');
        }
        case 'tracks': return item.color ?? '';
        case 'speakers': return [item.headline, item.company, item.availability?.length ? t(':n times given', { n: item.availability.length }) : null].filter(Boolean).join(' · ');
        case 'sponsors': return [item.tier, item.url].filter(Boolean).join(' · ');
        default: return '';
    }
}

export default function Agenda({ event, data }) {
    const { api } = useDashboard();
    const { save, busy: saving } = useEventSave(event);
    const remover = useAction();
    const programme = data?.programme ?? { tracks: [], sessions: [], speakers: [], sponsors: [], conflicts: [] };
    const modules = event.modules ?? {};
    const available = KINDS.filter((k) => modules[k.module] || (k.value === 'speakers' && modules.agenda));
    const [kind, setKind] = useState(available[0]?.value ?? 'sessions');
    const [editing, setEditing] = useState(null);
    const [removing, setRemoving] = useState(null);

    if (!available.length) {
        return (
            <EmptyState
                icon={CalendarRange}
                title={t('No programme on this event')}
                body={t('Switch on the agenda and speakers to build tracks, sessions and a call for speakers. This makes the event a conference.')}
                action={<Button variant="primary" loading={saving === 'save'} onClick={() => save({ modules: { ...modules, agenda: true, speakers: true } }, { success: t('Agenda switched on') })}>{t('Switch on the agenda')}</Button>}
            />
        );
    }

    const current = available.find((k) => k.value === kind) ?? available[0];
    const items = current.value === 'cfs' ? [] : programme[current.value] ?? [];

    return (
        <div className="space-y-5">
            {data?.cfs?.submissions?.length > 0 && <AgendaBuilder event={event} />}
            {programme.conflicts?.map((c) => (
                <Notice key={`${c.type}-${c.session_ids.join('-')}-${c.label}`} tone="warn" icon={TriangleAlert}>{c.label}</Notice>
            ))}
            <Tabs label={t('Programme')} value={current.value} onChange={setKind}
                tabs={available.map((k) => ({ value: k.value, label: t(k.label), count: k.value === 'cfs' ? (data?.cfs?.submissions?.length || null) : (programme[k.value]?.length || null) }))} />

            {current.value === 'cfs' ? <CallForSpeakers event={event} cfs={data?.cfs} programmeDays={programme.days ?? []} /> : (
                <Panel title={t(current.label)} action={<Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing('new')}>{t('Add :what', { what: t(current.singular) })}</Button>}>
                    {items.length === 0 ? <EmptyState title={t('Nothing here yet')} /> : (
                        <ul className="divide-y divide-line">
                            {items.map((item) => (
                                <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                                    {current.value === 'tracks' && <span className="h-4 w-4 rounded-full border border-line" style={{ background: item.color || 'transparent' }} aria-hidden="true" />}
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-semibold text-ink">{item.title ?? item.name}</span>
                                        <span className="block truncate text-sm text-muted">{line(current.value, item, event, programme)}</span>
                                    </span>
                                    {current.value === 'sessions' && programme.conflicts?.some((c) => c.session_ids.includes(item.id)) && <Tag tone="warn">{t('Clash')}</Tag>}
                                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(item)}>{t('Edit')}</Button>
                                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setRemoving(item)} aria-label={t('Delete')} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            )}

            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? t('Add :what', { what: t(current.singular ?? '') }) : t('Edit')} size="lg">
                {editing && <ItemForm kind={current.value} item={editing === 'new' ? null : editing} event={event} programme={programme} onClose={() => setEditing(null)} />}
            </Modal>
            <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} title={t('Delete it?')} confirmLabel={t('Delete')} busy={!!remover.busy}
                onConfirm={async () => { await remover.run(() => api.org.del(`/events/${event.id}/${current.value}/${removing.id}`), { success: t('Deleted'), reload: RELOAD }); setRemoving(null); }}>
                <p>{current.value === 'tracks' ? t('Its sessions stay on the agenda without a track.') : t('This cannot be undone.')}</p>
            </ConfirmDialog>
        </div>
    );
}
