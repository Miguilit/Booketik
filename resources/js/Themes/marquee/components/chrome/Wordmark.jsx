import { Link } from '@inertiajs/react';
import { useRoute, useSiteBrand } from '@/Core/site';
import { t } from '@/Core/i18n';
import { cn } from '@/Core/lib/format';

/**
 * The header's brand: the operator's logo when uploaded, else the ticket-stub
 * mark (public/brand/mark.svg); then the name, set in the display face.
 */
export default function Wordmark({ size = 'md', className, onNavigate, showText = true, onBand = false }) {
    const url = useRoute();
    const { name, logoUrl, showMark, showName } = useSiteBrand();
    const px = { sm: 28, md: 34, lg: 42 }[size] ?? 34;

    return (
        <Link href={url('')} onClick={onNavigate} className={cn('group flex shrink-0 items-center gap-2', className)} aria-label={t(':site home', { site: name })}>
            {logoUrl ? (
                <img src={logoUrl} alt="" style={{ height: px }} className="w-auto max-w-[180px] object-contain" />
            ) : (
                showMark !== false && <img src="/brand/mark.svg" alt="" width={px} height={px} className="rounded-[2px]" />
            )}
            {showText && (showName || !logoUrl) && (
                <span className={cn('font-display text-[28px] leading-none', onBand ? 'text-[#F3F0E8]' : 'text-ink')}>{name}</span>
            )}
        </Link>
    );
}
