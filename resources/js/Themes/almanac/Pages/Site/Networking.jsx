import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { eventPath } from '@/Core/events';
import { useRoute } from '@/Core/site';
import { t } from '@/Core/i18n';
import { layout } from '@/Themes/almanac/Layout';
import { Container } from '@/Themes/almanac/components/ui';
import { NetworkingForm } from '@/Themes/almanac/components/conference';

/*
 | Account ▸ Networking (`/account/networking`): the opt-in profile
 | conference matchmaking reads — the app's networking screen, on the web.
 */
export default function Networking({ profile, from }) {
    const url = useRoute();

    return (
        <>
            <Head title={t('Networking profile')} />
            <Container>
                <div className="mx-auto max-w-2xl py-8 sm:py-12">
                    <Link href={url(from ? `${eventPath(from)}/people` : '/account')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        {from ? t('People to meet') : t('Account')}
                    </Link>
                    <h1 className="mt-3 font-display text-[44px] leading-tight text-ink">{t('Networking')}</h1>
                    <p className="mt-2 text-[15px] text-body">{t('At conferences with networking on, guests who opt in are matched on interests and what they are looking for. Off by default.')}</p>
                    <div className="mt-8"><NetworkingForm profile={profile} /></div>
                </div>
            </Container>
        </>
    );
}

Networking.layout = layout;
