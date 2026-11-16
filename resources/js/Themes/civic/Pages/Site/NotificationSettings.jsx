import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BellOff, Check, Loader2, Moon } from 'lucide-react';
import { categoryCopy, useNotificationPreferences } from '@/Core/preferences';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/civic/Layout';
import { Avatar, Button, Card, Container, Field, Input, Toggle } from '@/Themes/civic/components/ui';

/*
 | Notification settings — the `/me/preferences` contract the app's settings
 | screen edits too: push and email, one switch per category, quiet hours and
 | muted organizers. Every change saves as it happens (PATCH, merged).
 */

const DEFAULT_OFF = ['promotions'];

export default function NotificationSettings({ preferences, categories = [] }) {
    const url = useRoute();
    const p = useNotificationPreferences(preferences);

    return (
        <>
            <Head title={t('Notification settings')} />
            <Container>
                <div className="mx-auto max-w-2xl py-8 sm:py-12">
                    <Link href={url('/account')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        {t('Account')}
                    </Link>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                        <h1 className="font-display text-[36px] font-extrabold leading-tight tracking-[-0.03em] text-ink">{t('Notifications')}</h1>
                        <p className="flex items-center gap-1.5 text-sm text-muted" aria-live="polite">
                            {p.saving ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t('Saving…')}</> : <><Check className="h-4 w-4" aria-hidden="true" />{t('Saved')}</>}
                        </p>
                    </div>
                    <p className="mt-2 text-[15px] text-body">{t('The same settings as the app. Your phone’s own notification permission is separate.')}</p>

                    <section aria-labelledby="channels" className="mt-8">
                        <h2 id="channels" className="mb-3 font-display text-xl font-bold text-ink">{t('How we reach you')}</h2>
                        <Card className="divide-y divide-line px-5">
                            <Toggle checked={p.push} onChange={p.setPush} label={t('Push notifications')} description={t('On your phones with the app. Off silences every category.')} />
                            <Toggle checked={p.email} onChange={p.setEmail} label={t('Email')} description={t('Order confirmations always arrive, whatever you choose here.')} />
                        </Card>
                    </section>

                    <section aria-labelledby="categories" className="mt-8">
                        <h2 id="categories" className="mb-3 font-display text-xl font-bold text-ink">{t('What we tell you about')}</h2>
                        <Card className="divide-y divide-line px-5">
                            {categories.map((key) => {
                                const [title, description] = categoryCopy(key);
                                const value = p.categories[key] ?? !DEFAULT_OFF.includes(key);
                                return <Toggle key={key} checked={value} onChange={(v) => p.setCategory(key, v)} label={title} description={description} />;
                            })}
                        </Card>
                    </section>

                    <section aria-labelledby="quiet" className="mt-8">
                        <h2 id="quiet" className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink"><Moon className="h-5 w-5" aria-hidden="true" />{t('Quiet hours')}</h2>
                        <Card className="px-5 pb-5">
                            <Toggle
                                checked={p.quiet.enabled}
                                onChange={(v) => p.setQuiet({ enabled: v })}
                                label={t('Hold pushes overnight')}
                                description={t('Anything urgent — an event starting, a spot you can claim, a cancellation — still comes through.')}
                            />
                            <div className="mt-2 grid grid-cols-2 gap-4">
                                <Field label={t('From')} htmlFor="quiet-start">
                                    <Input id="quiet-start" type="time" value={p.quiet.start ?? '22:00'} disabled={!p.quiet.enabled} onChange={(e) => p.setQuiet({ start: e.target.value })} className="font-mono" />
                                </Field>
                                <Field label={t('Until')} htmlFor="quiet-end">
                                    <Input id="quiet-end" type="time" value={p.quiet.end ?? '08:00'} disabled={!p.quiet.enabled} onChange={(e) => p.setQuiet({ end: e.target.value })} className="font-mono" />
                                </Field>
                            </div>
                            <p className="mt-3 font-mono text-xs text-muted">{t('Time zone: :zone', { zone: p.quiet.timezone ?? 'UTC' })}</p>
                        </Card>
                    </section>

                    <section aria-labelledby="muted" className="mt-8">
                        <h2 id="muted" className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink"><BellOff className="h-5 w-5" aria-hidden="true" />{t('Muted organizers')}</h2>
                        {p.muted.length === 0 ? (
                            <p className="rounded-card border border-dashed border-line px-5 py-6 text-[15px] text-muted">{t('Nobody is muted. Mute an organizer from a notification in the app to stop hearing from them without unfollowing.')}</p>
                        ) : (
                            <Card as="ul" className="divide-y divide-line">
                                {p.muted.map((o) => (
                                    <li key={o.slug} className="flex items-center gap-3 p-4">
                                        <Avatar image={o.avatar} name={o.name} size={40} />
                                        <Link href={url(`/o/${o.slug}`)} className="min-w-0 flex-1 truncate font-semibold text-ink hover:underline">{o.name}</Link>
                                        <Button variant="secondary" size="sm" onClick={() => p.unmute(o.slug)}>{t('Unmute')}</Button>
                                    </li>
                                ))}
                            </Card>
                        )}
                    </section>
                </div>
            </Container>
        </>
    );
}

NotificationSettings.layout = layout;
