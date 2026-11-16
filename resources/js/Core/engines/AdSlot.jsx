import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { cn } from '@/Core/lib/format';

/**
 * Engine: one AdSense unit. Theme-neutral (layout utilities only, no colour
 * tokens); pass `className` to change its spacing.
 *
 * Renders nothing at all unless the operator has switched AdSense on, filled in
 * a publisher id, and configured *this* slot — so a site running only a header
 * ad has no markup for the others, rather than an empty reserved box.
 *
 * Plus members never reach here: `ads` is null in the shared props for anyone
 * with an active subscription, which means the script tag is absent from their
 * page rather than loaded and then ignored. Paying to remove ads should remove
 * the request, not just the rectangle.
 */
export default function AdSlot({ slot, className }) {
    const { ads } = usePage().props;
    const pushed = useRef(false);

    const slotId = ads?.slots?.[slot];

    useEffect(() => {
        if (!slotId || pushed.current) {
            return;
        }

        // AdSense fills a unit by being told one more exists. Guarded with a
        // ref because React re-runs effects on navigation and a second push
        // for an already-filled unit is what makes AdSense log "already have
        // ads in it" and refuse the whole page.
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushed.current = true;
        } catch {
            /* blocked, offline, or the script never loaded — nothing to do */
        }
    }, [slotId]);

    if (!slotId) {
        return null;
    }

    return (
        <div className={cn('my-6 flex justify-center overflow-hidden', className)} aria-hidden>
            <ins
                className="adsbygoogle block w-full"
                style={{ display: 'block' }}
                data-ad-client={ads.client}
                data-ad-slot={slotId}
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </div>
    );
}
