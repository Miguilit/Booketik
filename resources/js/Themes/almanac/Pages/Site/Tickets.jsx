import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Compass, History, Ticket } from 'lucide-react';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/almanac/Layout';
import { Button, Container, EmptyState, Tabs } from '@/Themes/almanac/components/ui';
import TicketGroup, { groupByEvent } from '@/Themes/almanac/components/tickets/TicketGroup';

/** My tickets: upcoming and past, grouped by event, each code opening its QR. */
export default function Tickets({ upcoming = [], past = [] }) {
    const url = useRoute();
    const [tab, setTab] = useState('upcoming');
    const groups = useMemo(() => groupByEvent(tab === 'upcoming' ? upcoming : past), [tab, upcoming, past]);

    return (
        <>
            <Head title={t('My tickets')} />
            <Container className="py-8 sm:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{t('Your wallet')}</p>
                        <h1 className="font-display text-[40px] leading-tight text-ink sm:text-[52px]">{t('My tickets')}</h1>
                    </div>
                    <p className="max-w-sm text-sm text-muted">{t('Open a ticket once while online and its QR keeps working at the door without signal.')}</p>
                </div>

                <Tabs
                    className="mt-6"
                    label={t('Tickets')}
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { value: 'upcoming', label: t('Upcoming'), count: upcoming.length || null },
                        { value: 'past', label: t('Past'), count: past.length || null },
                    ]}
                />

                <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
                    {groups.length === 0 ? (
                        tab === 'upcoming' ? (
                            <EmptyState icon={Ticket} title={t('No upcoming tickets')} body={t('When you RSVP or buy a ticket, it shows up here.')} action={<Button variant="cta" icon={Compass} href={url('/discover')}>{t('Discover events')}</Button>} />
                        ) : (
                            <EmptyState icon={History} title={t('Nothing in the past yet')} body={t('Events you went to will be kept here.')} />
                        )
                    ) : (
                        <ul className="grid gap-6 lg:grid-cols-2">
                            {groups.map((g) => <li key={g.event?.id ?? g.tickets[0].code}><TicketGroup event={g.event} tickets={g.tickets} past={tab === 'past'} /></li>)}
                        </ul>
                    )}
                </div>
            </Container>
        </>
    );
}

Tickets.layout = layout;
