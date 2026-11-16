import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Crown, MailPlus, Trash2, Users } from 'lucide-react';
import { roleLabel, useAction, useDashboard } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { ConfirmDialog, PageHead, Panel, Table } from '@/Themes/civic/components/dashboard/kit';
import { Avatar, Button, Field, IconButton, Input, Notice, Select, Tag } from '@/Themes/civic/components/ui';

const ROLES = ['admin', 'editor', 'checkin_staff'];
const RANK = { owner: 40, admin: 30, editor: 20, checkin_staff: 10 };

/** The team: who can do what, invitations by email, and handing over ownership. */
export default function Team({ team }) {
    const { api, can, role } = useDashboard();
    const { run, busy, errors } = useAction();
    const [email, setEmail] = useState('');
    const [newRole, setNewRole] = useState('editor');
    const [confirm, setConfirm] = useState(null);
    const grantable = ROLES.filter((r) => RANK[r] <= RANK[role]);
    const seats = team?.seats;
    const full = seats?.limit !== null && seats?.limit !== undefined && seats.used >= seats.limit;

    const invite = (e) => {
        e.preventDefault();
        run(() => api.org.post('/team/invites', { email, role: newRole }), { key: 'invite', success: t('Invitation sent to :email.', { email }), reload: ['team'] })
            .then((ok) => ok && setEmail(''));
    };
    const changeRole = (m, value) => run(() => api.org.patch(`/team/${m.user_id}`, { role: value }), { key: `role-${m.user_id}`, success: t('Role changed.'), reload: ['team'] });
    const act = () => {
        const { kind, member, invite: inv } = confirm;
        const call = kind === 'remove' ? () => api.org.del(`/team/${member.user_id}`)
            : kind === 'revoke' ? () => api.org.del(`/team/invites/${inv.id}`)
                : () => api.org.post('/team/transfer', { user_id: Number(member.user_id), confirm: true });
        run(call, { key: 'confirm', success: kind === 'transfer' ? t('Ownership handed over. You are an admin now.') : t('Done.'), reload: ['team', 'frame'] }).then((ok) => ok && setConfirm(null));
    };

    return (
        <>
            <Head title={t('Team')} />
            <PageHead title={t('Team')} subtitle={t('Owner ⊃ admin ⊃ editor ⊃ check-in staff: each role can do everything below it.')} />

            {can.team && (
                <Panel title={t('Invite someone')} className="mb-5">
                    {full ? <Notice tone="warn">{t('Every seat on your plan is taken (:used of :limit).', { used: seats.used, limit: seats.limit })}</Notice> : (
                        <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
                            <Field label={t('Email')} htmlFor="inv-email" error={errors.email}><Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></Field>
                            <Field label={t('Role')} htmlFor="inv-role">
                                <Select id="inv-role" value={newRole} onChange={(e) => setNewRole(e.target.value)}>{grantable.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}</Select>
                            </Field>
                            <Button type="submit" variant="primary" icon={MailPlus} loading={busy === 'invite'}>{t('Send invite')}</Button>
                        </form>
                    )}
                    <p className="mt-3 text-sm text-muted">{t('They get an email with a link; they join once they sign in with that address. Links work for 14 days.')}{seats?.limit ? ` ${t(':used of :limit seats used.', { used: seats.used, limit: seats.limit })}` : ''}</p>
                </Panel>
            )}

            <Panel title={t('Members')} bodyClass="py-1">
                <Table
                    caption={t('Members')}
                    rows={team?.members ?? []}
                    rowKey={(m) => m.user_id}
                    empty={<p className="py-4 text-sm text-muted">{t('Nobody yet.')}</p>}
                    columns={[
                        { key: 'name', label: t('Name'), hideLabel: true, render: (m) => (
                            <span className="flex items-center gap-3"><Avatar image={m.avatar} name={m.name} size={36} />
                                <span className="min-w-0"><span className="block truncate font-semibold text-ink">{m.name}{m.is_me ? ` (${t('you')})` : ''}</span><span className="text-xs text-muted">{m.email}</span></span>
                            </span>
                        ) },
                        { key: 'role', label: t('Role'), render: (m) => (
                            m.role === 'owner' || !can.team || m.is_me || RANK[m.role] > RANK[role]
                                ? <Tag tone={m.role === 'owner' ? 'ink' : 'neutral'} icon={m.role === 'owner' ? Crown : undefined}>{roleLabel(m.role)}</Tag>
                                : (
                                    <Select aria-label={t('Role for :name', { name: m.name })} value={m.role} disabled={busy === `role-${m.user_id}`} onChange={(e) => changeRole(m, e.target.value)} className="h-10 py-1.5">
                                        {grantable.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                                    </Select>
                                )
                        ) },
                        { key: 'actions', label: '', hideLabel: true, align: 'end', render: (m) => (
                            <span className="inline-flex gap-1">
                                {role === 'owner' && !m.is_me && <Button size="sm" variant="ghost" icon={Crown} onClick={() => setConfirm({ kind: 'transfer', member: m })}>{t('Make owner')}</Button>}
                                {can.team && m.role !== 'owner' && !m.is_me && RANK[m.role] <= RANK[role] && <IconButton label={t('Remove :name', { name: m.name })} icon={Trash2} className="h-9 w-9" onClick={() => setConfirm({ kind: 'remove', member: m })} />}
                            </span>
                        ) },
                    ]}
                />
            </Panel>

            {(team?.invites ?? []).length > 0 && (
                <Panel title={t('Pending invitations')} className="mt-5" bodyClass="py-1">
                    <Table caption={t('Pending invitations')} rows={team.invites} columns={[
                        { key: 'email', label: t('Email'), render: (i) => <span className="font-semibold text-ink">{i.email}</span> },
                        { key: 'role', label: t('Role'), render: (i) => roleLabel(i.role) },
                        { key: 'by', label: t('Invited by'), render: (i) => i.invited_by ?? '—' },
                        { key: 'expires', label: t('Expires'), render: (i) => <span className="font-mono text-sm">{new Date(i.expires_at).toLocaleDateString()}</span> },
                        { key: 'x', label: '', hideLabel: true, align: 'end', render: (i) => can.team && <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'revoke', invite: i })}>{t('Withdraw')}</Button> },
                    ]} />
                </Panel>
            )}

            {!can.team && <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Users className="h-4 w-4" aria-hidden="true" />{t('Admins and the owner manage the team.')}</p>}

            <ConfirmDialog
                open={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                title={confirm?.kind === 'transfer' ? t('Make :name the owner?', { name: confirm.member.name }) : confirm?.kind === 'remove' ? t('Remove :name?', { name: confirm.member.name }) : t('Withdraw the invitation?')}
                confirmLabel={confirm?.kind === 'transfer' ? t('Hand over ownership') : confirm?.kind === 'remove' ? t('Remove') : t('Withdraw')}
                onConfirm={act}
                busy={busy === 'confirm'}
            >
                {confirm?.kind === 'transfer' && <p>{t('They take over billing, payouts and the team. You stay on as an admin. Only they can hand it back.')}</p>}
                {confirm?.kind === 'remove' && <p>{t('They lose access to this organizer at once.')}</p>}
                {confirm?.kind === 'revoke' && <p>{t('The link in their email stops working.')}</p>}
            </ConfirmDialog>
        </>
    );
}

Team.layout = dashLayout;
