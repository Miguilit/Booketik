import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import toast from 'react-hot-toast';
import { BadgeCheck, CalendarPlus, CalendarX, ChevronDown, ExternalLink, Link2, MapPin, Share2, UserCheck, Users } from 'lucide-react';
import { accentStyle, useCursorList, useFollowOrganizer } from '@/Core/events';
import { useMode } from '@/Core/mode';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/marquee/Layout';
import { Avatar, Button, cn, Container, EmptyState, Img, Tabs } from '@/Themes/marquee/components/ui';
import { EventGrid } from '@/Themes/marquee/components/events';

/*
 | The organizer hub (`/o/{slug}`): banner, avatar, counts, bio and links,
 | follow / join, a subscribable calendar, and the upcoming and past events.
 */

function webcal(url) {
    return url ? url.replace(/^https?:\/\//i, 'webcal://') : null;
}

async function copy(text) {
    try {
        await navigator.clipboard?.writeText(text);
        toast.success(t('Link copied'));
    } catch {
        toast.error(t('Could not copy the link'));
    }
}

function Stat({ value, label }) {
    return (
        <div>
            <dd className="font-display text-[57px] leading-none text-ink">{value}</dd>
            <dt className="mt-1 text-sm text-muted">{label}</dt>
        </div>
    );
}

function EventList({ slug, when, initial }) {
    const list = useCursorList(initial.items, initial.nextCursor, `/organizers/${slug}/events?when=${when}`);
    if (!list.items.length) {
        return (
            <EmptyState
                icon={CalendarX}
                title={when === 'upcoming' ? t('No upcoming events') : t('No past events yet')}
                body={when === 'upcoming' ? t('Follow to hear about the next one first.') : null}
            />
        );
    }
    return (
        <>
            <EventGrid events={list.items} />
            {list.hasMore && (
                <div className="mt-10 flex justify-center">
                    <Button variant="secondary" onClick={list.more} loading={list.loading}>{t('Load more')}</Button>
                </div>
            )}
        </>
    );
}

export default function Organizer({ organizer, upcoming = { items: [] }, past = { items: [] }, accent }) {
    const { dark } = useMode();
    const follow = useFollowOrganizer(organizer);
    const [tab, setTab] = useState(upcoming.items?.length || !past.items?.length ? 'upcoming' : 'past');
    const feed = webcal(organizer.calendar_feed_url);

    const share = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: organizer.name, url: organizer.share_url });
                return;
            } catch {
                // Cancelled: copy instead.
            }
        }
        copy(organizer.share_url);
    };

    return (
        <div style={accentStyle(accent, dark)}>
            <Head title={organizer.name} />
            <Container className="pt-6 lg:pt-10">
                <div className="overflow-hidden rounded-card border-key border-edge bg-raised shadow-key">
                    <Img image={organizer.banner} alt="" priority sizes="(min-width: 1240px) 1200px, 100vw" className="aspect-[3/1] w-full grayscale sm:aspect-[4/1]" ratio={0.375} fallback={<div className="aspect-[3/1] w-full bg-accent sm:aspect-[4/1]" aria-hidden="true" />} />
                </div>

                <div className="grid gap-8 px-1 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="min-w-0">
                        <Avatar image={organizer.avatar} name={organizer.name} size={112} className="-mt-14 border border-edge bg-surface grayscale sm:-mt-16" />
                        <h1 className="mt-4 flex flex-wrap items-center gap-3 break-words font-display text-[clamp(56px,10vw,128px)] text-ink">
                            {organizer.name}
                            {organizer.is_verified && <BadgeCheck className="h-7 w-7 text-link" aria-label={t('Verified organizer')} />}
                        </h1>
                        {organizer.city && (
                            <p className="mt-2 flex items-center gap-1.5 text-[15px] text-muted"><MapPin className="h-4 w-4" aria-hidden="true" />{organizer.city}</p>
                        )}
                        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                            <Stat value={organizer.follower_count ?? 0} label={t('Followers')} />
                            <Stat value={organizer.upcoming_count ?? 0} label={t('Upcoming')} />
                            <Stat value={organizer.past_count ?? 0} label={t('Past events')} />
                            {organizer.member_count != null && <Stat value={organizer.member_count} label={t('Members')} />}
                        </dl>
                        {organizer.bio && <p className="mt-5 max-w-2xl whitespace-pre-line text-[17px] leading-relaxed text-body">{organizer.bio}</p>}
                        {organizer.links?.length > 0 && (
                            <ul className="mt-4 flex flex-wrap gap-2">
                                {organizer.links.map((l) => (
                                    <li key={l.url}>
                                        <a href={l.url} target="_blank" rel="noreferrer noopener" className="inline-flex h-9 items-center gap-1.5 rounded-chip border-key border-line bg-surface px-3.5 text-sm font-semibold text-ink hover:border-edge">
                                            {l.label}<ExternalLink className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:mt-6 lg:max-w-[360px] lg:justify-end">
                        <Button variant={follow.following ? 'quiet' : 'accent'} onClick={follow.toggle} loading={follow.busy} aria-pressed={follow.following} icon={follow.following ? UserCheck : undefined}>
                            {follow.following ? t('Following') : t('Follow')}
                        </Button>
                        {follow.member ? (
                            <Button variant="quiet" disabled icon={Users}>{t('Member')}</Button>
                        ) : (
                            <Button variant="secondary" onClick={follow.join} disabled={follow.busy} icon={Users}>{t('Join the community')}</Button>
                        )}
                        {feed && (
                            <Menu as="div" className="relative">
                                <MenuButton className="inline-flex h-11 items-center gap-1.5 rounded-btn border-key border-edge bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-raised">
                                    <CalendarPlus className="h-[18px] w-[18px]" aria-hidden="true" />
                                    {t('Subscribe to calendar')}
                                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                </MenuButton>
                                <MenuItems anchor="bottom end" className="z-50 mt-2 w-60 rounded-card border-key border-edge bg-surface p-1.5 shadow-key focus:outline-none">
                                    <MenuItem>
                                        <a href={feed} className="block rounded-sm px-3 py-2 text-[15px] text-ink data-[focus]:bg-raised">{t('Apple / iCal')}</a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feed)}`} target="_blank" rel="noreferrer" className="block rounded-sm px-3 py-2 text-[15px] text-ink data-[focus]:bg-raised">Google Calendar</a>
                                    </MenuItem>
                                    <MenuItem>
                                        <button type="button" onClick={() => copy(organizer.calendar_feed_url)} className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-start text-[15px] text-ink data-[focus]:bg-raised">
                                            <Link2 className="h-4 w-4" aria-hidden="true" />{t('Copy feed link')}
                                        </button>
                                    </MenuItem>
                                </MenuItems>
                            </Menu>
                        )}
                        <Button variant="ghost" onClick={share} icon={Share2}>{t('Share')}</Button>
                    </div>
                </div>

                <section aria-label={t('Events')} className="mt-12">
                    <Tabs
                        label={t('Events')}
                        value={tab}
                        onChange={setTab}
                        tabs={[
                            { value: 'upcoming', label: t('Upcoming'), count: organizer.upcoming_count || null },
                            { value: 'past', label: t('Past'), count: organizer.past_count || null },
                        ]}
                    />
                    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className={cn('mt-8')}>
                        {tab === 'upcoming'
                            ? <EventList key="upcoming" slug={organizer.slug} when="upcoming" initial={upcoming} />
                            : <EventList key="past" slug={organizer.slug} when="past" initial={past} />}
                    </div>
                </section>
            </Container>
        </div>
    );
}

Organizer.layout = layout;
