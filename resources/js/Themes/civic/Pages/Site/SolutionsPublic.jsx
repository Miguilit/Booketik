import React from 'react';
import { Head } from '@inertiajs/react';
import { layout } from '@/Themes/civic/Layout';
import SolutionsLanding from '@/Themes/civic/components/solutions/SolutionsLanding';

/** Public: strictly the published CMS projection; commercial actions remain disabled. */
export default function SolutionsPublic({ solutionsPublic }) {
    const page = solutionsPublic?.page ?? null;
    const seo = page?.seo ?? {};
    const title = typeof seo.title === 'string' && seo.title.trim() ? seo.title : 'BOOKETIK Solutions';
    const description = typeof seo.description === 'string' ? seo.description : '';
    return <>
        <Head title={title}>
            {description ? <meta name="description" content={description} /> : null}
        </Head>
        {page ? <SolutionsLanding page={page} /> : null}
    </>;
}

SolutionsPublic.layout = layout;
