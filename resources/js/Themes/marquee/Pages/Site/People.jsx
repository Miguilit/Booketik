import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { accentStyle, eventPath, eventWhen } from '@/Core/events';
import { useMode } from '@/Core/mode';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/marquee/Layout';
import { Container } from '@/Themes/marquee/components/ui';
import { PeopleBoard } from '@/Themes/marquee/components/conference';

/*
 | People to meet at a conference (`/e/{slug}/people`): requests to answer,
 | the guests matchmaking suggests, and your meetings. The page the
 | `meeting_request` push opens.
 */
export default function People({ event, accent, profile, isGuest, meetings = [] }) {
    const url = useRoute();
    const { dark } = useMode();
    const when = eventWhen(event);

    return (
        <div style={accentStyle(accent, dark)}>
            <Head title={t('People to meet: :title', { title: event.title })} />
            <Container className="py-8 sm:py-12">
                <div className="mx-auto max-w-4xl">
                    <Link href={url(eventPath(event.slug))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-link">
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{t('Back to the event')}
                    </Link>
                    <h1 className="mt-3 font-display text-[64px] leading-[0.9] text-ink sm:text-[104px]">{t('People to meet')}</h1>
                    <p className="mt-2 font-mono text-sm uppercase tracking-[0.12em] text-body">{event.title}</p>
                    {when && <p className="mt-1 font-mono text-sm text-muted">{when.date} · {when.zone}</p>}
                    <div className="mt-8">
                        <PeopleBoard event={event} profile={profile} isGuest={isGuest} meetings={meetings} />
                    </div>
                </div>
            </Container>
        </div>
    );
}

People.layout = layout;
