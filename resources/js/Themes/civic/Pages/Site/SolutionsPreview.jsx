import React from 'react';
import { Head } from '@inertiajs/react';
import { Eye, LockKeyhole, ArrowLeft } from 'lucide-react';
import { useMode } from '@/Core/lib/mode';
import { layout } from '@/Themes/civic/Layout';
import SolutionsLanding from '@/Themes/civic/components/solutions/SolutionsLanding';

/*
 * Private R1H visual preview, available ONLY through admin middleware.
 * The backend passes the last saved editorial revision, with NO price or
 * checkout entitlements. It never consumes unsaved editor state.
 */
const UI = {
    fr: { eyebrow: 'APERÇU PRIVÉ · SUPERADMIN', saved: 'Révision enregistrée',
          warning: 'Aperçu non public. Les prix et les achats restent désactivés.',
          back: 'Retour à l’éditeur', light: 'Clair', dark: 'Sombre', system: 'Auto',
          title: 'BOOKETIK Solutions — Aperçu' },
    nl: { eyebrow: 'PRIVÉVOORBEELD · SUPERADMIN', saved: 'Opgeslagen revisie',
          warning: 'Niet openbaar. Prijzen en aankopen blijven uitgeschakeld.',
          back: 'Terug naar de editor', light: 'Licht', dark: 'Donker', system: 'Auto',
          title: 'BOOKETIK Solutions — Voorbeeld' },
    en: { eyebrow: 'PRIVATE PREVIEW · SUPERADMIN', saved: 'Saved revision',
          warning: 'Not public. Prices and purchases remain disabled.',
          back: 'Back to editor', light: 'Light', dark: 'Dark', system: 'Auto',
          title: 'BOOKETIK Solutions — Preview' },
};

export default function SolutionsPreview({ solutionsPreview }) {
    const payload = solutionsPreview || {};
    const page = payload.page || null;
    const lang = ['fr', 'nl', 'en'].includes(page?.locale) ? page.locale : 'en';
    const t = UI[lang];
    const { mode, setMode } = useMode();
    return <>
        <Head title={t.title} />
        <div role="status" className="sticky top-16 z-40 border-b border-line bg-bg px-4 py-3 text-ink shadow-sm md:px-8">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                    <LockKeyhole aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-wider">
                            <Eye size={15} aria-hidden="true" />{t.eyebrow}
                            <span className="rounded-full border border-line px-2 py-0.5">{t.saved} #{payload.revision ?? '—'}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{t.warning}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-xl border border-line p-1" aria-label="Display mode">
                        {['light', 'dark', 'system'].map(value => <button
                            key={value} type="button" onClick={() => setMode(value)}
                            aria-pressed={mode === value} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${mode === value ? 'bg-ink text-bg' : 'text-muted hover:bg-raised'}`}>
                            {t[value]}
                        </button>)}
                    </div>
                    <a href={payload.editUrl || '#'} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-bold hover:bg-raised">
                        <ArrowLeft size={15} aria-hidden="true" />{t.back}
                    </a>
                </div>
            </div>
        </div>
        <SolutionsLanding page={page} previewMode />
    </>;
}

SolutionsPreview.layout = layout;
