import { CheckCircle2, KeyRound, Link2, MailWarning } from 'lucide-react';
import { t } from '@/Core/i18n';
import { useAccountSecurity, useConnectedAccounts, usePasswordChange } from '@/Core/account';
import { openVerifyEmailDialog } from '@/Core/auth';
import { Button, Card, Field, Input, Tag } from '@/Themes/civic/components/ui';

/*
 | Sign-in & security on the account page: the email and whether it is
 | confirmed, the password, and the linked sign-in methods (Google, Facebook).
 | State and actions: useAccountSecurity, usePasswordChange,
 | useConnectedAccounts (@/Core/account).
 */

export default function AccountSecurity() {
    const { user } = useAccountSecurity();
    if (!user) return null;

    return (
        <section aria-labelledby="security">
            <h2 id="security" className="mb-4 font-display text-2xl font-bold text-ink">{t('Sign-in & security')}</h2>
            <Card className="divide-y divide-line">
                <EmailRow user={user} />
                <PasswordRow user={user} />
                <ProvidersRow user={user} />
            </Card>
        </section>
    );
}

function Row({ title, description, action, children }) {
    return (
        <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="font-semibold text-ink">{title}</p>
                    {description && <p className="mt-0.5 break-words text-sm text-muted">{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function EmailRow({ user }) {
    return (
        <Row
            title={t('Email')}
            description={user.email}
            action={user.emailVerified ? (
                <Tag tone="success" icon={CheckCircle2}>{t('Confirmed')}</Tag>
            ) : (
                <Button variant="primary" size="sm" icon={MailWarning} onClick={() => openVerifyEmailDialog({ send: true })}>{t('Confirm email')}</Button>
            )}
        />
    );
}

function PasswordRow({ user }) {
    const { open, start, cancel, firstPassword, form, sendCode, sending, codeSent, setCode, submit } = usePasswordChange(user);

    return (
        <Row
            title={t('Password')}
            description={firstPassword
                ? t('You sign in with Google or Facebook. Add a password to sign in with your email too.')
                : t('Changing it signs you out on every other device.')}
            action={!open && (
                <Button variant="secondary" size="sm" icon={KeyRound} onClick={start}>
                    {firstPassword ? t('Set a password') : t('Change password')}
                </Button>
            )}
        >
            {open && (
                <form onSubmit={submit} className="mt-5 max-w-md space-y-4">
                    {firstPassword ? (
                        <Field
                            label={t('Code from your email')}
                            htmlFor="pw-code"
                            error={form.errors.code}
                            hint={(
                                <button type="button" onClick={sendCode} disabled={sending} className="text-sm font-semibold text-link disabled:opacity-50">
                                    {sending ? t('Sending…') : codeSent ? t('Send another') : t('Email me a code')}
                                </button>
                            )}
                        >
                            <Input id="pw-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={form.data.code} onChange={(e) => setCode(e.target.value)} placeholder="000000" required className="font-mono tracking-[0.4em]" />
                        </Field>
                    ) : (
                        <Field label={t('Current password')} htmlFor="pw-current" error={form.errors.current_password}>
                            <Input id="pw-current" type="password" autoComplete="current-password" value={form.data.current_password} onChange={(e) => form.setData('current_password', e.target.value)} required />
                        </Field>
                    )}
                    <Field label={t('New password')} htmlFor="pw-new" error={form.errors.password}>
                        <Input id="pw-new" type="password" autoComplete="new-password" minLength={8} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} placeholder={t('At least 8 characters, letters and numbers')} required />
                    </Field>
                    <Field label={t('Confirm new password')} htmlFor="pw-confirm" error={form.errors.password_confirmation}>
                        <Input id="pw-confirm" type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} required />
                    </Field>
                    <div className="flex flex-wrap gap-3">
                        <Button type="submit" variant="primary" loading={form.processing}>{firstPassword ? t('Set password') : t('Save password')}</Button>
                        <Button variant="ghost" onClick={cancel}>{t('Cancel')}</Button>
                    </div>
                </form>
            )}
        </Row>
    );
}

function ProvidersRow({ user }) {
    const { rows, busy, connectHref, disconnect } = useConnectedAccounts(user);
    if (rows.length === 0) return null;

    return (
        <Row title={t('Linked sign-in methods')} description={t('Sign in with one tap instead of a password.')}>
            <ul className="mt-4 space-y-2">
                {rows.map(({ id, label, linked }) => (
                    <li key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-bg px-4 py-3">
                        <span className="flex items-center gap-2 font-semibold text-ink">
                            <Link2 className="h-4 w-4 text-muted" aria-hidden="true" />
                            {label}
                            {linked && <Tag tone="success">{t('Connected')}</Tag>}
                        </span>
                        {linked ? (
                            <Button variant="danger" size="sm" onClick={() => disconnect(id, label)} loading={busy === id}>{t('Disconnect')}</Button>
                        ) : (
                            // A full navigation: this leaves the site for the provider.
                            <a href={connectHref(id)} className="text-sm font-semibold text-link hover:underline">{t('Connect')}</a>
                        )}
                    </li>
                ))}
            </ul>
        </Row>
    );
}
