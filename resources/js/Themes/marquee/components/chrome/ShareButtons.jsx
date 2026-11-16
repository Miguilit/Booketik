import { Check, Link2, Share2 } from 'lucide-react';
import {
    FacebookIcon,
    FacebookShareButton,
    TelegramIcon,
    TelegramShareButton,
    WhatsappIcon,
    WhatsappShareButton,
    XIcon,
    XShareButton,
} from 'react-share';
import { cn } from '@/Core/lib/format';
import { useShare } from '@/Core/lib/share';
import { t } from '@/Core/i18n';

/**
 * Share a page to the networks readers actually use, plus Copy Link.
 *
 * ## WhatsApp is first, deliberately
 *
 * Not alphabetical and not "the biggest network worldwide". Indonesia is the
 * market this was built for first, and there a link is passed in WhatsApp or
 * Telegram — usually into a group — far more often than it is posted publicly.
 * The order is a claim about where a share is actually going, and first
 * position is worth more than the other three combined.
 *
 * ## The URL is never built here
 *
 * `url` is what the server sent, already carrying `utm_medium=share` and the
 * campaign for this page type (`App\Support\ShareLink`). Assembling it from
 * `window.location.href` instead — the obvious shortcut — would ship whatever
 * tracking the *visitor* arrived with back out into the next share, so one
 * campaign would spend the rest of its life re-attributing every share made
 * from a page it touched. It would also carry pagination, filters, and search
 * queries into the link.
 *
 * ## Copy Link copies the same tracked URL
 *
 * Copy Link is usually the most-used control of the five — it is where the
 * shares into apps this component does not list come from — so stripping the
 * parameters to make it "clean" would make the single largest share channel
 * the one channel invisible to analytics.
 */
export default function ShareButtons({
    url,
    title,
    className,
    label = t('Share'),
    size = 36,
}) {
    const { copied, copy } = useShare(url);

    // A page whose props predate this — or a post whose link could not be
    // resolved — renders nothing rather than a row of buttons that share the
    // admin panel's own URL.
    if (!url) return null;

    const round = { round: true, size };

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {label ? (
                <span className="me-1 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted">
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    {label}
                </span>
            ) : null}

            <WhatsappShareButton url={url} title={title} separator=" — " aria-label={t('Share on :network', { network: 'WhatsApp' })}>
                <WhatsappIcon {...round} />
            </WhatsappShareButton>

            <TelegramShareButton url={url} title={title} aria-label={t('Share on :network', { network: 'Telegram' })}>
                <TelegramIcon {...round} />
            </TelegramShareButton>

            <XShareButton url={url} title={title} aria-label={t('Share on :network', { network: 'X' })}>
                <XIcon {...round} />
            </XShareButton>

            {/*
              | Facebook takes no title: it has ignored anything a sharer types
              | since 2017 and renders the page's own Open Graph tags instead.
              | Which is why those tags live in `app.blade.php` — this
              | button is only as good as the card the crawler builds.
              */}
            <FacebookShareButton url={url} aria-label={t('Share on :network', { network: 'Facebook' })}>
                <FacebookIcon {...round} />
            </FacebookShareButton>

            <button
                type="button"
                onClick={copy}
                aria-label={t('Copy link')}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-chip border-key px-4 text-sm font-semibold transition-colors',
                    copied
                        ? 'border-success/40 bg-success/10 text-success'
                        : 'border-edge bg-surface text-ink hover:bg-raised',
                )}
                style={{ height: size }}
            >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                {copied ? t('Copied') : t('Copy link')}
            </button>
        </div>
    );
}
