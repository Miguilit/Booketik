import { useState } from 'react';
import { Check, Lock, Palette } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { Button, cn, Field, Input, Notice } from '../../ui';
import { Panel } from '../kit';
import { RELOAD, useEventSave } from './shared';

/* WCAG 2.x relative luminance and contrast — a preview only; the server guards the saved accent. */
function luminance(hex) {
    const n = hex.replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(n)) return null;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
    const [la, lb] = [luminance(a), luminance(b)];
    if (la === null || lb === null) return null;
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
}

function ThemeCard({ theme, selected, disabled, onPick, mode = 'light' }) {
    const s = theme.swatches?.[mode] ?? {};
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onPick}
            aria-pressed={selected}
            className={cn('group relative w-full overflow-hidden rounded-card border text-start transition-colors disabled:cursor-not-allowed disabled:opacity-60', selected ? 'border-key border-edge shadow-key' : 'border-line hover:border-edge')}
        >
            <div className="h-28 p-3" style={{ background: s.bg }}>
                <div className="h-full p-3" style={{ background: s.surface, borderRadius: s.radius, border: `1px solid ${s.line}` }}>
                    <div className="h-2.5 w-2/3 rounded-full" style={{ background: s.ink }} />
                    <div className="mt-2 h-2 w-1/2 rounded-full" style={{ background: s.muted }} />
                    <div className="mt-4 flex gap-2">
                        <span className="h-5 w-14" style={{ background: s.accent2, borderRadius: s.radius }} />
                        <span className="h-5 w-10" style={{ background: s.accent, borderRadius: s.radius }} />
                    </div>
                </div>
            </div>
            <div className="border-t border-line bg-surface p-3">
                <p className="flex items-center gap-2 font-display text-[17px] font-bold text-ink">
                    {theme.name}
                    {selected && <Check className="h-4 w-4 text-brand" aria-label={t('Selected')} />}
                    {disabled && <Lock className="h-4 w-4 text-muted" aria-hidden="true" />}
                </p>
                <p className="mt-0.5 text-sm text-muted">{theme.tagline}</p>
            </div>
        </button>
    );
}

function AccentPicker({ value, saved, savedDark, onSave, busy }) {
    const [hex, setHex] = useState(value || '#0c5a52');
    const valid = /^#[0-9a-f]{6}$/i.test(hex);
    const onWhite = valid ? contrast(hex, '#ffffff') : null;
    const onPaper = valid ? contrast(hex, '#faf8f4') : null;
    const inkOn = valid ? contrast('#13201f', hex) : null;
    const ok = (r) => r !== null && r >= 4.5;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <Field label={t('Pick')} htmlFor="accent-color"><Input id="accent-color" type="color" value={valid ? hex : '#000000'} onChange={(e) => setHex(e.target.value)} className="h-[46px] p-1" /></Field>
                <Field label={t('Hex')} htmlFor="accent-hex"><Input id="accent-hex" value={hex} onChange={(e) => setHex(e.target.value.trim())} className="font-mono" maxLength={7} invalid={!valid} /></Field>
            </div>
            {valid && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-sm border border-line bg-[#faf8f4] p-4">
                        <p className="font-mono text-xs uppercase tracking-wider text-[#59625f]">{t('Light page')}</p>
                        <span className="mt-2 inline-block rounded-btn px-4 py-2 font-semibold text-white" style={{ background: hex }}>{t('Get tickets')}</span>
                        <p className="mt-2 text-sm font-semibold" style={{ color: hex }}>{t('A link in your colour')}</p>
                    </div>
                    <div className="rounded-sm border border-line bg-[#171412] p-4">
                        <p className="font-mono text-xs uppercase tracking-wider text-[#b3aa9c]">{t('Dark page')}</p>
                        <span className="mt-2 inline-block rounded-btn px-4 py-2 font-semibold text-[#13201f]" style={{ background: savedDark && hex === saved ? savedDark : hex }}>{t('Get tickets')}</span>
                    </div>
                </div>
            )}
            {valid && (
                <ul className="space-y-1 font-mono text-sm">
                    <li className={ok(onWhite) ? 'text-success' : 'text-danger'}>{t('White text on it')}: {onWhite?.toFixed(2)}:1 {ok(onWhite) ? t('passes AA') : t('below AA')}</li>
                    <li className={ok(onPaper) ? 'text-success' : 'text-danger'}>{t('As text on the page')}: {onPaper?.toFixed(2)}:1</li>
                    <li className="text-muted">{t('Ink text on it')}: {inkOn?.toFixed(2)}:1</li>
                </ul>
            )}
            <Notice tone="info">{t('Saving darkens a colour that would not read, until it passes on every theme. You will see the saved value here.')}</Notice>
            <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" icon={Palette} loading={busy} disabled={!valid} onClick={() => onSave(hex)}>{t('Save colour')}</Button>
                {saved && <span className="inline-flex items-center gap-2 text-sm text-muted"><span className="h-5 w-5 rounded-full border border-line" style={{ background: saved }} aria-hidden="true" /><span className="font-mono">{t('Saved')}: {saved}</span></span>}
                {saved && <Button variant="ghost" size="sm" onClick={() => onSave(null)}>{t('Use the theme colour')}</Button>}
            </div>
        </div>
    );
}

export default function Look({ event, data }) {
    const { api, path } = useDashboard();
    const { save, busy } = useEventSave(event);
    const orgAction = useAction();
    const look = data?.look ?? { themes: [], custom_theme_allowed: false };
    const allowed = Boolean(look.custom_theme_allowed);

    return (
        <div className="space-y-6">
            {!allowed && (
                <Notice tone="warn" icon={Lock}>
                    {t('Choosing a page look is on the Pro and Business plans. Your pages use Daylight Civic until then.')}{' '}
                    <a href={path('/billing')} className="font-semibold underline">{t('See plans')}</a>
                </Notice>
            )}

            <Panel title={t('This event’s look')}>
                <p className="mb-4 text-sm text-muted">{t('Overrides your organizer default for this event page, its checkout and agenda.')}</p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ThemeCard theme={{ name: t('Organizer default'), tagline: look.theme_key ? t('Currently :name', { name: look.themes.find((x) => x.key === look.theme_key)?.name ?? look.theme_key }) : t('Daylight Civic'), swatches: look.themes.find((x) => x.key === (look.theme_key ?? 'civic'))?.swatches }}
                        selected={!event.theme_key} disabled={false} onPick={() => save({ theme_key: null }, { success: t('Uses the organizer default'), key: 'theme' })} />
                    {look.themes.map((theme) => (
                        <ThemeCard key={theme.key} theme={theme} selected={event.theme_key === theme.key} disabled={!allowed}
                            onPick={() => save({ theme_key: theme.key }, { success: t(':name for this event', { name: theme.name }), key: 'theme' })} />
                    ))}
                </div>
            </Panel>

            <Panel title={t('Organizer default look')}>
                <p className="mb-4 text-sm text-muted">{t('Your hub page and every event without its own look.')}</p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {look.themes.map((theme) => (
                        <ThemeCard key={theme.key} theme={theme} selected={(look.theme_key ?? 'civic') === theme.key} disabled={!allowed || orgAction.busy === 'look'}
                            onPick={() => orgAction.run(() => api.org.patch('/look', { theme_key: theme.key }), { key: 'look', success: t('Default look saved'), reload: RELOAD })} />
                    ))}
                </div>
            </Panel>

            <Panel title={t('Accent colour')}>
                <p className="mb-4 text-sm text-muted">{t('The event’s own tint: its main button and links. Leave it to use the theme’s.')}</p>
                <AccentPicker key={event.theme_accent ?? 'none'} value={event.theme_accent} saved={event.theme_accent} savedDark={event.theme_accent_dark}
                    busy={busy === 'accent'} onSave={(hex) => save({ theme_accent: hex }, { success: t('Colour saved'), key: 'accent' })} />
            </Panel>
        </div>
    );
}
