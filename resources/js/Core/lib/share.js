import { useState } from 'react';
import toast from 'react-hot-toast';
import { t } from '@/Core/i18n';

/**
 * Copy Link for a share row.
 *
 * `url` is what the server sent, already carrying `utm_medium=share` and the
 * campaign for this page type (`App\Support\ShareLink`) — never build it from
 * `window.location.href`. Copy Link copies the same tracked URL: it is usually
 * the most-used share control, so stripping the parameters would make the
 * largest share channel invisible to analytics.
 */
export function useShare(url) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            // `navigator.clipboard` is undefined on plain http, which is every
            // developer's laptop and any operator who has not got a
            // certificate yet. The textarea path is what makes Copy Link work
            // there rather than throw into the console.
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const field = document.createElement('textarea');
                field.value = url;
                field.setAttribute('readonly', '');
                field.style.position = 'fixed';
                field.style.opacity = '0';
                document.body.appendChild(field);
                field.select();
                document.execCommand('copy');
                document.body.removeChild(field);
            }

            setCopied(true);
            toast.success(t('Link copied'));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(t('Could not copy the link'));
        }
    };

    return { copied, copy };
}
