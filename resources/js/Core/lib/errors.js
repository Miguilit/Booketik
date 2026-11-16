import { usePage } from '@inertiajs/react';
import { t } from '@/Core/i18n';

/*
 | Headless error page (Pages/Error): 404, 403, 500, 503.
 |
 | Reads only `locale` — never page props. The page is shown exactly when
 | something may have failed, and a 500 whose error page throws its own 500 is
 | a blank screen.
 */

/** Default heading per status. */
export const ERROR_TITLES = {
    503: 'Down for maintenance',
    500: 'Something went wrong',
    404: 'We cannot find that page',
    403: 'You cannot open that',
};

/** Default explanation per status. */
export const ERROR_DESCRIPTIONS = {
    503: 'We are working on it. Try again in a few minutes.',
    500: 'The problem is on our side. It has been logged.',
    404: 'The link may be old, or the event may have moved.',
    403: 'That page belongs to someone else, or needs an account with more access.',
};

/** `{ title, description }` for a status, with the generic fallbacks. */
export function errorPageCopy(status) {
    // Literal keys (not ERROR_TITLES[status]) so the extractor sees every string.
    const titles = {
        503: t('Down for maintenance'),
        500: t('Something went wrong'),
        404: t('We cannot find that page'),
        403: t('You cannot open that'),
    };
    const descriptions = {
        503: t('We are working on it. Try again in a few minutes.'),
        500: t('The problem is on our side. It has been logged.'),
        404: t('The link may be old, or the event may have moved.'),
        403: t('That page belongs to someone else, or needs an account with more access.'),
    };
    return {
        title: titles[status] ?? t('Something went wrong'),
        description: descriptions[status] ?? t('Please try again.'),
    };
}

/**
 * Everything the error page needs.
 *
 * @param {number} status  the HTTP status the page was rendered for
 */
export function useErrorPage(status) {
    const { locale } = usePage().props;
    const home = `/${locale ?? 'en'}`;

    return {
        status,
        ...errorPageCopy(status),
        home,
    };
}
