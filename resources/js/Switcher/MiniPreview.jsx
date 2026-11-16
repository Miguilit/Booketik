/**
 * A theme's home page, drawn in CSS at miniature scale.
 *
 * No screenshots: each theme has a small composition of divs that carries its
 * signature (Civic's sticker bento, Marquee's black band and lineup bill,
 * Almanac's masthead and margin datelines), coloured from the registry swatches through
 * `--p-*` variables. It can never go stale against the real theme, and it
 * costs nothing to load — the theme's own stylesheet is not on this page.
 *
 * Everything is sized in `em`, so one markup serves the shelf thumbnail and
 * the stage: the container sets `font-size` and the drawing scales with it.
 */

const covers = (n, className = 'tp-cover') =>
    Array.from({ length: n }, (_, i) => <span key={i} className={className} style={{ '--i': i }} />);

const LAYOUTS = {
    // Daylight Civic: a big city name, a bento of sticker cards, a ranked list.
    civic: () => (
        <>
            <div className="tp-nav">
                <span className="tp-logo" />
                <span className="tp-cv-search" />
                <span className="tp-grow" />
                <span className="tp-pill" />
            </div>
            <span className="tp-cv-city" />
            <div className="tp-cv-bento">
                <span className="tp-cover tp-cv-lead"><i className="tp-cv-stamp" /></span>
                {covers(4)}
            </div>
            <div className="tp-cv-rows">
                {[0, 1, 2].map((i) => <span key={i} />)}
            </div>
        </>
    ),

    // Marquee: a black band, a stacked lineup in condensed caps, a ticker.
    marquee: () => (
        <>
            <div className="tp-mq-band">
                <span className="tp-mq-logo" />
                <span className="tp-grow" />
                <span className="tp-mq-cta" />
            </div>
            <div className="tp-mq-bill">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="tp-mq-line">
                        <span className="tp-mq-date" />
                        <span className="tp-mq-act" style={{ '--w': `${90 - i * 14}%` }} />
                    </div>
                ))}
            </div>
            <div className="tp-mq-ticker"><span /><span /><span /></div>
        </>
    ),

    // Almanac: a masthead between rules, an italic dateline in the margin, columns.
    almanac: () => (
        <>
            <div className="tp-al-mast">
                <span className="tp-al-title" />
                <span className="tp-al-rule" />
            </div>
            <div className="tp-al-cols">
                {[0, 1, 2].map((c) => (
                    <div key={c} className="tp-al-col">
                        <span className="tp-al-dateline" />
                        <span className="tp-cover" />
                        <span className="tp-al-text" />
                        <span className="tp-al-text tp-short" />
                    </div>
                ))}
            </div>
        </>
    ),
};

export default function MiniPreview({ theme, mode = 'light', className = '' }) {
    const palette = theme?.swatches?.[mode] ?? theme?.swatches?.light ?? {};
    const Layout = LAYOUTS[theme?.key] ?? LAYOUTS.civic;

    const style = {
        '--p-bg': palette.bg,
        '--p-surface': palette.surface,
        '--p-ink': palette.ink,
        '--p-muted': palette.muted,
        '--p-line': palette.line,
        '--p-accent': palette.accent,
        '--p-accent2': palette.accent2,
        '--p-radius': palette.radius,
    };

    return (
        <div className={`tp-root tp--${theme?.key ?? 'civic'} ${className}`} style={style} aria-hidden="true">
            <Layout />
        </div>
    );
}
