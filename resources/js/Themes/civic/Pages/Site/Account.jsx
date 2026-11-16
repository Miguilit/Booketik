import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, Bell, BellRing, CreditCard, Handshake, LogOut, Settings, Ticket, User } from 'lucide-react';
import { formatAccountDate as formatDate, profileInitial, useAccountPage } from '@/Core/account';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/civic/Layout';
import AccountSecurity from '@/Themes/civic/components/auth/AccountSecurity';
import { Button, Card, cn, Container, EmptyState, Tag, Toggle } from '@/Themes/civic/components/ui';

/*
 | The account: who you are, Plus, the inbox, what you have paid for, and the
 | ways out to My tickets, notification settings and Plus. Tabs and saving:
 | useAccountPage (@/Core/account).
 */

const TABS = [
    { id: 'profile', icon: User },
    { id: 'inbox', icon: Bell },
    { id: 'billing', icon: CreditCard },
    { id: 'settings', icon: Settings },
];

function Shortcut({ href, icon: Icon, title, body }) {
    return (
        <Link href={href} className="group flex items-center gap-3 rounded-card border border-line bg-surface p-4 transition-colors hover:border-edge">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint text-on-tint"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="min-w-0">
                <span className="block font-semibold text-ink">{title}</span>
                <span className="block text-sm text-muted">{body}</span>
            </span>
            <ArrowRight className="ms-auto h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
    );
}

export default function Account({ profile, orders = [], notifications = [] }) {
    const url = useRoute();
    const { activeTab, setActiveTab, prefs, save, saving, inbox, unread, markAllRead } = useAccountPage({ profile, notifications });
    const TAB_TEXT = { profile: t('Profile'), inbox: t('Inbox'), billing: t('Billing'), settings: t('Settings') };

    return (
        <>
            <Head title={t('Account')} />
            <Container className="py-8 sm:py-12">
                <div className="flex flex-wrap items-center gap-5">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-key border-edge bg-tint-2 font-display text-2xl font-extrabold text-on-tint-2" aria-hidden="true">
                        {profileInitial(profile)}
                    </span>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate font-display text-[34px] font-extrabold leading-tight tracking-[-0.03em] text-ink">{profile.name ?? profile.username ?? t('Guest')}</h1>
                        <p className="truncate text-[15px] text-muted">{profile.email}</p>
                    </div>
                    {profile.hasPlus ? (
                        <Tag tone="warn" icon={BadgeCheck}>{profile.expiresAt ? t('Plus until :date', { date: formatDate(profile.expiresAt) }) : t('Plus')}</Tag>
                    ) : (
                        <Button variant="cta" href={url('/plus')} icon={BadgeCheck}>{t('Get Plus')}</Button>
                    )}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Shortcut href={url('/tickets')} icon={Ticket} title={t('My tickets')} body={t('Upcoming and past, with your QR codes.')} />
                    <Shortcut href={url('/account/notifications')} icon={BellRing} title={t('Notification settings')} body={t('Categories, quiet hours and muted organizers.')} />
                    <Shortcut href={url('/account/networking')} icon={Handshake} title={t('Networking')} body={t('Meet people at conferences. Off unless you opt in.')} />
                    <Shortcut href={url('/plus')} icon={BadgeCheck} title={t('Plus')} body={t('No fees on most tickets, presales, waitlist priority.')} />
                </div>

                <div className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <nav aria-label={t('Account sections')} className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col">
                        {TABS.map(({ id, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveTab(id)}
                                aria-current={activeTab === id ? 'page' : undefined}
                                className={cn('flex h-11 shrink-0 items-center gap-2 rounded-chip px-4 text-[15px] font-semibold', activeTab === id ? 'bg-ink text-bg' : 'text-ink hover:bg-raised')}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {TAB_TEXT[id]}
                                {id === 'inbox' && unread > 0 && <span className="ms-auto rounded-chip bg-cta px-2 text-xs text-on-cta">{unread}</span>}
                            </button>
                        ))}
                        <Link href={url('/sign-out')} method="post" as="button" className="flex h-11 shrink-0 items-center gap-2 rounded-chip px-4 text-[15px] font-semibold text-muted hover:bg-raised hover:text-ink">
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                            {t('Sign out')}
                        </Link>
                    </nav>

                    <div className="min-w-0">
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                <section aria-labelledby="profile">
                                    <h2 id="profile" className="mb-4 font-display text-2xl font-bold text-ink">{t('Profile')}</h2>
                                    <Card className="p-5">
                                        <dl className="grid gap-4 sm:grid-cols-2">
                                            <div><dt className="text-sm text-muted">{t('Name')}</dt><dd className="font-semibold text-ink">{profile.name ?? '—'}</dd></div>
                                            <div className="min-w-0"><dt className="text-sm text-muted">{t('Email')}</dt><dd className="break-words font-semibold text-ink">{profile.email ?? '—'}</dd></div>
                                        </dl>
                                    </Card>
                                </section>
                                <AccountSecurity />
                            </div>
                        )}

                        {activeTab === 'inbox' && (
                            <section aria-labelledby="inbox">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h2 id="inbox" className="font-display text-2xl font-bold text-ink">{t('Inbox')}</h2>
                                    {unread > 0 && <Button variant="link" onClick={markAllRead}>{t('Mark all read')}</Button>}
                                </div>
                                {inbox.length === 0 ? (
                                    <EmptyState icon={Bell} title={t('Nothing here yet')} body={t('Order confirmations, reminders and announcements land here.')} />
                                ) : (
                                    <Card as="ul" className="divide-y divide-line">
                                        {inbox.map((item) => (
                                            <li key={item.id} className="flex gap-3 p-4">
                                                <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', item.read ? 'bg-transparent' : 'bg-cta')} aria-hidden="true" />
                                                <div className="min-w-0">
                                                    <p className={cn('text-ink', !item.read && 'font-semibold')}>{item.title}{!item.read && <span className="sr-only"> ({t('unread')})</span>}</p>
                                                    {item.body && <p className="text-sm text-body">{item.body}</p>}
                                                    <p className="mt-0.5 font-mono text-xs text-muted">{formatDate(item.createdAt)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </Card>
                                )}
                            </section>
                        )}

                        {activeTab === 'billing' && (
                            <section aria-labelledby="billing">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h2 id="billing" className="font-display text-2xl font-bold text-ink">{t('Purchase history')}</h2>
                                    <Button variant="link" href={url('/account/subscription')}>{t('Subscription & billing')}</Button>
                                </div>
                                {orders.length === 0 ? (
                                    <EmptyState icon={CreditCard} title={t('No purchases yet')} body={t('Tickets and Plus you buy show up here with their receipts.')} />
                                ) : (
                                    <Card as="ul" className="divide-y divide-line">
                                        {orders.map((order) => (
                                            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-ink">{order.title}</p>
                                                    <p className="font-mono text-xs text-muted">{order.orderNumber} · {formatDate(order.createdAt)}</p>
                                                </div>
                                                <div className="text-end">
                                                    <p className="font-mono font-medium text-ink">{order.amountFormatted}</p>
                                                    <p className="text-xs text-muted">{order.paymentStatus}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </Card>
                                )}
                            </section>
                        )}

                        {activeTab === 'settings' && (
                            <section aria-labelledby="settings" className="space-y-4">
                                <h2 id="settings" className="font-display text-2xl font-bold text-ink">{t('Settings')}</h2>
                                <Card className="px-5">
                                    <Toggle
                                        checked={prefs.notifyNewEvents}
                                        disabled={saving}
                                        onChange={(value) => save({ notifyNewEvents: value })}
                                        label={t('New events from organizers I follow')}
                                        description={t('Tell me when they announce something.')}
                                    />
                                </Card>
                                <Button variant="secondary" href={url('/account/notifications')} icon={BellRing}>{t('All notification settings')}</Button>
                            </section>
                        )}
                    </div>
                </div>
            </Container>
        </>
    );
}

Account.layout = layout;
