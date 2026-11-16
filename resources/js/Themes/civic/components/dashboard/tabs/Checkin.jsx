import { useState } from 'react';
import { Check, RefreshCw, Search, Smartphone, X } from 'lucide-react';
import { t } from '@/Core/i18n';
import { pct, useAction, useDashboard, usePoll } from '@/Core/dashboard';
import { BarList } from '../charts';
import { Panel, StatTile, Table } from '../kit';
import { Button, EmptyState, Field, Input, Notice, Tag } from '../../ui';

const RESULT = {
    valid: () => t('Admitted'),
    already_checked_in: () => t('Already in'),
    wrong_event: () => t('Wrong event'),
    refunded: () => t('Refunded'),
    void: () => t('Void'),
    unknown: () => t('Unknown code'),
    invalid_code: () => t('Invalid code'),
};

const time = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');

/** Check-in: live counts, gates, devices, the last scans and manual check-in. */
export default function Checkin({ event, data }) {
    const { api, frame } = useDashboard();
    const [stats, setStats] = useState(data?.stats ?? {});
    const [updated, setUpdated] = useState(() => new Date());
    const live = ['live', 'upcoming'].includes(event.state);

    const refresh = async () => {
        try {
            setStats(await api.org.get(`/events/${event.id}/checkin/stats`));
            setUpdated(new Date());
        } catch {
            /* the next poll tries again */
        }
    };
    usePoll(refresh, 10000, live);

    const results = Object.entries(stats.results ?? {}).filter(([, n]) => n > 0);

    return (
        <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-3">
                <StatTile label={t('Checked in')} value={`${stats.checked_in ?? 0} / ${stats.total ?? 0}`}>
                    <div className="mt-3 h-2 rounded-chip bg-raised" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((stats.rate ?? 0) * 100)} aria-label={t('Check-in rate')}>
                        <div className="h-2 rounded-chip bg-brand" style={{ width: `${Math.min(100, (stats.rate ?? 0) * 100)}%` }} />
                    </div>
                </StatTile>
                <StatTile label={t('Rate')} value={pct(stats.rate)} note={live ? t('Updates every 10 seconds') : t('Final count')} />
                <StatTile label={t('Devices scanning')} value={stats.devices?.length ?? 0} note={t('Last update :time', { time: updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <Panel title={t('By gate')} action={<Button size="sm" variant="ghost" icon={RefreshCw} onClick={refresh}>{t('Refresh')}</Button>}>
                    <BarList label={t('Admitted by gate')} items={(stats.gates ?? []).map((g) => ({ label: g.gate, value: g.count }))} empty={t('No one is in yet.')} />
                </Panel>
                <Panel title={t('Scan results')}>
                    {results.length ? (
                        <ul className="flex flex-wrap gap-2">
                            {results.map(([key, n]) => <li key={key}><Tag tone={key === 'valid' ? 'success' : 'warn'}>{RESULT[key]?.() ?? key} · {n}</Tag></li>)}
                        </ul>
                    ) : <p className="text-sm text-muted">{t('No scans yet.')}</p>}
                </Panel>
            </div>

            <ManualCheckIn event={event} onDone={refresh} gates={(stats.gates ?? []).map((g) => g.gate)} />

            <div className="grid gap-5 lg:grid-cols-2">
                <Panel title={t('Staff devices')}>
                    <Table
                        caption={t('Staff devices')}
                        rows={stats.devices ?? []}
                        rowKey={(d) => `${d.device_id}-${d.staff}`}
                        empty={<p className="text-sm text-muted">{t('No device has scanned for this event yet.')}</p>}
                        columns={[
                            { key: 'device', label: t('Device'), render: (d) => <span className="font-mono text-sm" title={d.device_id}>{d.device_id.slice(0, 10)}{d.device_id.length > 10 ? '…' : ''}</span> },
                            { key: 'staff', label: t('Staff'), render: (d) => d.staff ?? '—' },
                            { key: 'scans', label: t('Scans'), align: 'end', render: (d) => <span className="font-mono">{d.scans}</span> },
                            { key: 'offline', label: t('Offline'), align: 'end', render: (d) => <span className="font-mono">{d.offline_scans}</span> },
                            { key: 'last', label: t('Last scan'), align: 'end', render: (d) => <span className="font-mono">{time(d.last_at)}</span> },
                        ]}
                    />
                </Panel>
                <Panel title={t('Latest scans')}>
                    {(stats.recent ?? []).length ? (
                        <ul className="divide-y divide-line">
                            {stats.recent.map((s) => (
                                <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                                    {s.result === 'valid' ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <X className="h-4 w-4 text-danger" aria-hidden="true" />}
                                    <span className="min-w-0 flex-1 truncate text-ink">{s.name ?? s.code ?? t('Unknown')} <span className="text-muted">· {RESULT[s.result]?.() ?? s.result}</span></span>
                                    <span className="font-mono text-xs text-muted">{s.gate ?? 'Main'} · {time(s.scanned_at)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted">{t('Scans appear here as they happen.')}</p>}
                </Panel>
            </div>

            <Panel title={t('Scan at the door with the app')}>
                <div className="flex flex-wrap items-start gap-4">
                    <Smartphone className="h-8 w-8 shrink-0 text-brand" aria-hidden="true" />
                    <div className="min-w-0 flex-1 space-y-2 text-[15px]">
                        <p>{t('The Eventgoo app scans tickets with the phone camera, keeps working without signal and syncs when it is back — several staff phones can scan the same event; the first scan of a ticket wins.')}</p>
                        <p className="text-sm text-muted">{t('Sign in with your account, switch to organizer mode and open this event.')}</p>
                        <div className="flex flex-wrap gap-2">
                            {frame?.mobile_app?.ios && <Button size="sm" variant="secondary" href={frame.mobile_app.ios} external>{t('App Store')}</Button>}
                            {frame?.mobile_app?.android && <Button size="sm" variant="secondary" href={frame.mobile_app.android} external>{t('Google Play')}</Button>}
                        </div>
                    </div>
                </div>
            </Panel>
        </div>
    );
}

function ManualCheckIn({ event, onDone, gates }) {
    const { api } = useDashboard();
    const { run, busy } = useAction();
    const [q, setQ] = useState('');
    const [gate, setGate] = useState(gates[0] ?? 'Main');
    const [results, setResults] = useState(null);
    const [outcome, setOutcome] = useState(null);

    const search = async (e) => {
        e.preventDefault();
        if (q.trim().length < 2) return;
        const page = await run(() => api.org.list(`/events/${event.id}/checkin/search?${new URLSearchParams({ q: q.trim() })}`), { key: 'search' });
        if (page) setResults(page.data ?? []);
    };

    const admit = async (ticket) => {
        const done = await run(() => api.org.post(`/events/${event.id}/checkin`, { payload: `EG1:${ticket.code}`, method: 'manual', gate: gate || 'Main', device_id: 'web-dashboard', scanned_at: new Date().toISOString() }), { key: ticket.id });
        if (done) {
            setOutcome(done);
            setResults((list) => list?.map((r) => (r.id === ticket.id && done.result === 'valid' ? { ...r, status: 'checked_in', checked_in_at: done.checked_in_at } : r)));
            onDone();
        }
    };

    return (
        <Panel title={t('Manual check-in')}>
            <form onSubmit={search} className="flex flex-wrap items-end gap-3">
                <Field label={t('Name, email or ticket code')} htmlFor="ci-q" className="min-w-[220px] flex-1">
                    <Input id="ci-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="EGO-…" />
                </Field>
                <Field label={t('Gate')} htmlFor="ci-gate" className="w-32">
                    <Input id="ci-gate" value={gate} onChange={(e) => setGate(e.target.value)} />
                </Field>
                <Button type="submit" variant="secondary" icon={Search} loading={busy === 'search'}>{t('Search')}</Button>
            </form>
            {outcome && (
                <Notice tone={outcome.result === 'valid' ? 'success' : 'warn'} className="mt-4">
                    {RESULT[outcome.result]?.() ?? outcome.result}: {outcome.ticket?.holder_name ?? outcome.ticket?.code ?? ''}{outcome.ticket?.ticket_type ? ` · ${outcome.ticket.ticket_type}` : ''}
                </Notice>
            )}
            {results && (results.length === 0 ? (
                <EmptyState className="mt-4" title={t('No ticket matches')} body={t('Try part of the name, the email, or the code on the ticket.')} />
            ) : (
                <ul className="mt-4 divide-y divide-line">
                    {results.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-ink">{r.name ?? t('Guest')} <span className="font-normal text-muted">· {r.tier}</span></p>
                                <p className="font-mono text-xs text-muted">{r.code}{r.email ? ` · ${r.email}` : ''}</p>
                            </div>
                            {r.status === 'checked_in' ? (
                                <Tag tone="success">{t('In at :time', { time: time(r.checked_in_at) })}</Tag>
                            ) : r.status === 'valid' ? (
                                <Button size="sm" variant="primary" icon={Check} loading={busy === r.id} onClick={() => admit(r)}>{t('Check in')}</Button>
                            ) : (
                                <Tag tone="muted">{RESULT[r.status]?.() ?? r.status}</Tag>
                            )}
                        </li>
                    ))}
                </ul>
            ))}
        </Panel>
    );
}
