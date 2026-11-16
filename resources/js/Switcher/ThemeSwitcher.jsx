import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import { lockScroll } from '@/Core/scrollLock';
import { isDark } from '@/Core/mode';
import { useSiteBrand } from '@/Core/site';
import { t } from '@/Core/i18n';
import { withNodes } from '@/Core/format';
import MiniPreview from './MiniPreview';
import { closeThemeSwitcher, openThemeSwitcher, useSwitcherOpen } from './store';
import './switcher.css';

/**
 * The storefront theme switcher.
 *
 * Demo mode and local development only: the server sends `siteTheme.switcher`
 * and the lineup only then (ThemeResolver::props), so in production nothing
 * here renders but the staff preview chip.
 *
 * The themes stand as spines on a shelf. Choosing one slides it
 * forward and turns the page of the open book on the stage, which shows a
 * live CSS miniature of that theme's home page beside its name and story.
 * "Open" posts the choice and the server answers with a full page load —
 * every theme is its own stylesheet, so a soft visit would mix two of them.
 *
 * Styled by switcher.css alone (`.ts-*`, `.tp-*`), never by a theme's
 * Tailwind: whichever theme is on the page, the switcher looks the same and
 * no theme can restyle it. Imports only `@/Core` and its own folder
 * (enforced by scripts/check-theme-boundaries.mjs).
 *
 * Triggers: auto-open once per browser session on the landing page; the
 * bookmark ribbon hanging under the header; each theme's header "Themes"
 * item (via `useThemeSwitcher()` from `@/Core/switcher`).
 */

const SEEN_KEY = 'eventgoo_ts_seen';
const SITE_PAGE = /^(Site|Auth|Contents)\/|^Error$/;
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const numeral = (n) => NUMERALS[n - 1] ?? String(n);

export default function ThemeSwitcher() {
    const { component, props } = usePage();
    const siteTheme = props.siteTheme ?? {};
    const open = useSwitcherOpen();
    const [mounted, setMounted] = useState(false);

    const enabled = Boolean(siteTheme.switcher) && SITE_PAGE.test(component);

    useEffect(() => setMounted(true), []);

    // First landing-page visit of the browser session opens the room once.
    // Fails closed: blocked storage means "already seen", never a nag loop.
    useEffect(() => {
        if (!enabled || component !== 'Site/Home') return;

        let seen = true;
        try {
            seen = sessionStorage.getItem(SEEN_KEY) === '1';
            sessionStorage.setItem(SEEN_KEY, '1');
        } catch {
            seen = true;
        }

        if (!seen) openThemeSwitcher();
    }, [enabled, component]);

    if (!mounted) return null;

    return createPortal(
        <div className="ts-root">
            {siteTheme.preview && <PreviewChip name={siteTheme.name} />}
            {enabled && component !== 'Site/Read' && <Ribbon current={siteTheme} />}
            {enabled && open && <Room siteTheme={siteTheme} />}
        </div>,
        document.body,
    );
}

/* ── Bookmark ribbon ──────────────────────────────────────────────────────── */

function Ribbon({ current }) {
    const swatch = current.themes?.find((t) => t.key === current.key)?.swatches?.light;

    return (
        <button
            type="button"
            className="ts-ribbon"
            onClick={openThemeSwitcher}
            style={{ '--ts-tip': swatch?.accent ?? '#3D5AFE' }}
            aria-label={t('Themes — currently :name', { name: current.name })}
        >
            <span className="ts-ribbon-glyph" aria-hidden="true">
                <PaletteIcon />
            </span>
            <span className="ts-ribbon-label">
                {t('Themes')}<span className="ts-ribbon-current"> · {current.name}</span>
            </span>
        </button>
    );
}

/* ── Staff preview chip ───────────────────────────────────────────────────── */

function PreviewChip({ name }) {
    return (
        <div className="ts-preview" role="status">
            <span className="ts-preview-dot" aria-hidden="true" />
            {withNodes(t('Previewing :name — only you can see it.'), { name: <strong>{name}</strong> })}
            <a href="?preview_theme=off">{t('Exit preview')}</a>
        </div>
    );
}

/* ── The room ─────────────────────────────────────────────────────────────── */

function Room({ siteTheme }) {
    const { name: siteName } = useSiteBrand();
    const themes = siteTheme.themes ?? [];
    const currentKey = siteTheme.key;

    const [selected, setSelected] = useState(currentKey);
    const [peek, setPeek] = useState(() => (isDark() ? 'dark' : 'light'));
    const [applying, setApplying] = useState(null);
    const [error, setError] = useState(null);
    const [turn, setTurn] = useState(0);

    const panelRef = useRef(null);
    const optionRefs = useRef({});

    const theme = useMemo(() => themes.find((t) => t.key === selected) ?? themes[0], [themes, selected]);
    const current = themes.find((t) => t.key === currentKey);
    const available = themes.filter((t) => t.available);

    // Scroll lock + initial focus on the current spine.
    useEffect(() => {
        const unlock = lockScroll();
        const previous = document.activeElement;
        requestAnimationFrame(() => optionRefs.current[currentKey]?.focus());

        return () => {
            unlock();
            if (previous instanceof HTMLElement) previous.focus();
        };
    }, [currentKey]);

    const choose = useCallback((key) => {
        setSelected((was) => {
            if (was !== key) setTurn((n) => n + 1);
            return key;
        });
        setError(null);
    }, []);

    const apply = useCallback(
        (key = selected) => {
            const target = themes.find((t) => t.key === key);
            if (!target?.available || applying) return;

            if (key === currentKey) {
                closeThemeSwitcher();
                return;
            }

            setApplying(target);
            setError(null);

            const fail = (message) => {
                setApplying(null);
                setError(message);
            };

            router.post(
                '/site-theme',
                { theme: key, back: window.location.pathname + window.location.search },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onError: (errors) => fail(errors.theme ?? t('That theme cannot be opened right now.')),
                    onHttpException: () => {
                        fail(t('The theme switcher is not available here.'));
                        return false;
                    },
                    onNetworkError: () => {
                        fail(t('Could not reach the server. Check your connection and try again.'));
                        return false;
                    },
                },
            );
        },
        [applying, currentKey, selected, themes],
    );

    // Keyboard: Esc closes, Tab is trapped, arrows walk the shelf.
    const onKeyDown = (event) => {
        if (applying) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeThemeSwitcher();
            return;
        }

        if (event.key === 'Tab') {
            const focusable = panelRef.current?.querySelectorAll(
                'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
            );
            if (!focusable?.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    };

    const onShelfKey = (event) => {
        const rtl = document.documentElement.dir === 'rtl';
        const index = themes.findIndex((t) => t.key === selected);
        let next = null;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index + (rtl && event.key === 'ArrowRight' ? -1 : 1);
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index + (rtl && event.key === 'ArrowLeft' ? 1 : -1);
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = themes.length - 1;

        if (next !== null) {
            event.preventDefault();
            const key = themes[(next + themes.length) % themes.length].key;
            choose(key);
            optionRefs.current[key]?.focus();
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            apply();
        }
    };

    const ctaLabel = !theme?.available
        ? t('Coming soon')
        : theme.key === currentKey
          ? t('Switch to :name', { name: theme.name })
          : t('Open :name', { name: theme.name });

    return (
        <>
            <div className="ts-overlay" onMouseDown={() => !applying && closeThemeSwitcher()} />

            <div className="ts-frame" onKeyDown={onKeyDown}>
                <section
                    ref={panelRef}
                    className="ts-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ts-title"
                    aria-describedby="ts-sub"
                >
                    <header className="ts-head">
                        <div>
                            <p className="ts-eyebrow">{t('Site looks')}</p>
                            <h2 id="ts-title" className="ts-title">
                                {t('Choose how :site looks', { site: siteName })}
                            </h2>
                            <p id="ts-sub" className="ts-sub">
                                {t(':count looks, each in light and dark. Your pick is remembered on this device.', { count: themes.length })}
                            </p>
                        </div>

                        <div className="ts-head-tools">
                            <div className="ts-peek" role="radiogroup" aria-label={t('Preview in')}>
                                {['light', 'dark'].map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        role="radio"
                                        aria-checked={peek === m}
                                        className={peek === m ? 'is-on' : ''}
                                        onClick={() => setPeek(m)}
                                    >
                                        {m === 'light' ? <SunIcon /> : <MoonIcon />}
                                        {m === 'light' ? t('Light') : t('Dark')}
                                    </button>
                                ))}
                            </div>
                            <button type="button" className="ts-close" onClick={closeThemeSwitcher} aria-label={t('Close')}>
                                <CloseIcon />
                            </button>
                        </div>
                    </header>

                    <div className="ts-body">
                        {/* The open book: miniature on the left page, the story on the right. */}
                        {theme && (
                            <div className="ts-stage" style={{ '--ts-glow': theme.swatches?.[peek]?.accent }}>
                                <div className="ts-book">
                                    <div className="ts-page ts-page--left" key={`l-${turn}`}>
                                        <MiniPreview theme={theme} mode={peek} className="ts-mini-stage" />
                                    </div>
                                    <div className="ts-spinefold" aria-hidden="true" />
                                    <div className="ts-page ts-page--right" key={`r-${turn}`}>
                                        <p className="ts-numeral">
                                            {numeral(theme.number)}
                                            {theme.key === currentKey && <span className="ts-badge">{t('Current')}</span>}
                                            {!theme.available && <span className="ts-badge ts-badge--soon">{t('Soon')}</span>}
                                        </p>
                                        <h3 className="ts-name">{theme.name}</h3>
                                        <p className="ts-tagline">{theme.tagline}</p>
                                        <p className="ts-desc">{theme.description}</p>
                                        <ul className="ts-tags">
                                            {theme.tags?.map((tag) => (
                                                <li key={tag}>{tag}</li>
                                            ))}
                                        </ul>
                                        <Swatches swatches={theme.swatches?.[peek]} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* The shelf. */}
                        <div className="ts-shelf-wrap">
                            <div
                                className="ts-shelf"
                                role="listbox"
                                aria-label={t('Themes')}
                                onKeyDown={onShelfKey}
                            >
                                {themes.map((t, i) => (
                                    <Spine
                                        key={t.key}
                                        theme={t}
                                        index={i}
                                        mode={peek}
                                        selected={t.key === selected}
                                        current={t.key === currentKey}
                                        refCallback={(el) => (optionRefs.current[t.key] = el)}
                                        onSelect={() => choose(t.key)}
                                        onApply={() => apply(t.key)}
                                    />
                                ))}
                            </div>
                            <div className="ts-plank" aria-hidden="true" />
                        </div>
                    </div>

                    <footer className="ts-foot">
                        <p className={error ? 'ts-hint ts-hint--error' : 'ts-hint'} role={error ? 'alert' : undefined}>
                            {error ??
                                t(':ready of :total ready · arrows to browse, Enter to open, Esc to close', { ready: available.length, total: themes.length })}
                        </p>
                        <div className="ts-actions">
                            <button type="button" className="ts-btn ts-btn--ghost" onClick={closeThemeSwitcher}>
                                {current?.name ? t('Keep :name', { name: current.name }) : t('Keep current')}
                            </button>
                            <button
                                type="button"
                                className="ts-btn ts-btn--primary"
                                disabled={!theme?.available || Boolean(applying)}
                                onClick={() => apply()}
                                style={{ '--ts-cta': theme?.swatches?.light?.accent }}
                            >
                                {ctaLabel}
                            </button>
                        </div>
                    </footer>
                </section>
            </div>

            {applying && <Veil theme={applying} mode={peek} />}
        </>
    );
}

function Spine({ theme, index, mode, selected, current, refCallback, onSelect, onApply }) {
    const s = theme.swatches?.[mode] ?? theme.swatches?.light ?? {};
    // Uneven heights, like a real shelf; deterministic per position.
    const height = [92, 84, 96, 80, 90, 86, 98, 82, 94][index % 9];

    return (
        <button
            ref={refCallback}
            id={`ts-opt-${theme.key}`}
            type="button"
            role="option"
            aria-selected={selected}
            aria-disabled={!theme.available}
            aria-label={`${theme.name}${current ? t(', current theme') : ''}${theme.available ? '' : t(', coming soon')}. ${theme.tagline}`}
            tabIndex={selected ? 0 : -1}
            className={[
                'ts-spine',
                selected && 'is-selected',
                current && 'is-current',
                !theme.available && 'is-wrapped',
            ]
                .filter(Boolean)
                .join(' ')}
            style={{
                '--sp-a': s.accent,
                '--sp-b': s.accent2,
                '--sp-bg': s.bg,
                '--sp-ink': s.ink,
                '--sp-h': `${height}%`,
                '--ts-delay': `${index * 45}ms`,
            }}
            onClick={onSelect}
            onDoubleClick={onApply}
        >
            <span className="ts-spine-band" aria-hidden="true" />
            <span className="ts-spine-title">{theme.name}</span>
            <span className="ts-spine-num" aria-hidden="true">
                {numeral(theme.number)}
            </span>
            {current && <span className="ts-spine-ribbon" aria-hidden="true" />}
            {!theme.available && (
                <span className="ts-spine-wrap" aria-hidden="true">
                    <LockIcon />
                </span>
            )}
        </button>
    );
}

function Swatches({ swatches }) {
    if (!swatches) return null;

    return (
        <div className="ts-swatches" aria-hidden="true">
            {['bg', 'surface', 'ink', 'accent', 'accent2'].map((k) => (
                <span key={k} style={{ background: swatches[k] }} />
            ))}
        </div>
    );
}

function Veil({ theme, mode }) {
    return (
        <div className="ts-veil" role="status" aria-live="polite">
            <div className="ts-veil-book">
                <MiniPreview theme={theme} mode={mode} className="ts-mini-veil" />
            </div>
            <p className="ts-veil-text">
                <span className="ts-spinner" aria-hidden="true" />
                {t('Opening :name…', { name: theme.name })}
            </p>
        </div>
    );
}

/* ── Icons (inline, so the switcher depends on no icon package) ─────────── */

const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

function PaletteIcon() {
    return (
        <svg {...svg}>
            <path d="M12 22a10 10 0 1 1 10-10c0 2.2-1.8 3-3.5 3H16a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22z" />
            <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
            <circle cx="12" cy="7.5" r="1" fill="currentColor" />
            <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg {...svg} width={14} height={14}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg {...svg} width={14} height={14}>
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg {...svg}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg {...svg} width={12} height={12}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
    );
}
