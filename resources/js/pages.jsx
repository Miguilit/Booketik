/*
 | Page resolution shared by the browser entry (app.jsx) and the SSR entry
 | (ssr.jsx), so both render the same component for the same page — a
 | mismatch would throw the server's HTML away on hydration.
 |
 | No window/document here: the theme is passed in (the browser reads it off
 | <html data-site-theme>, the server off the page's `siteTheme` prop).
 */

export const DEFAULT_THEME = 'civic';

const themePages = import.meta.glob('./Themes/*/Pages/**/*.jsx');
const layouts = import.meta.glob('./Themes/*/Layout.jsx');
const roots = import.meta.glob('./Themes/*/roots.jsx');

async function load(path, pages) {
    const loader = pages[path];
    if (!loader) throw new Error(`Page not found: ${path}`);
    return loader();
}

/**
 * The theme's own page when it has one, Civic's otherwise — and a Civic page
 * shown under another theme is wrapped in that theme's Layout, so the header
 * and footer stay the theme's. Must match ThemeRegistry::pageEntry() and
 * ::layoutEntry() so the chunks the server preloaded are the ones that render.
 */
export function pageResolver(theme) {
    return async function resolvePage(name) {
        const themed = `./Themes/${theme}/Pages/${name}.jsx`;

        if (theme !== DEFAULT_THEME && themePages[themed]) {
            return load(themed, themePages);
        }

        const page = await load(`./Themes/${DEFAULT_THEME}/Pages/${name}.jsx`, themePages);
        const ownLayout = layouts[`./Themes/${theme}/Layout.jsx`];

        if (theme !== DEFAULT_THEME && ownLayout && page.default?.layout) {
            const { default: Layout } = await ownLayout();
            const Wrapped = (props) => page.default(props);
            Wrapped.layout = (child) => <Layout>{child}</Layout>;
            return { ...page, default: Wrapped };
        }

        return page;
    };
}

/** `{ AuthRoot, PaymentsRoot }` for the theme, Civic's as fallback. */
export function loadRoots(theme) {
    const themed = roots[`./Themes/${theme}/roots.jsx`];
    return (themed ?? roots[`./Themes/${DEFAULT_THEME}/roots.jsx`])();
}

/** "Page - Site", just "Site" for an untitled page, and never "Site - Site". */
export function pageTitle(siteName) {
    return (title) => {
        const page = (title ?? '').trim();
        if (!page || page === siteName) return siteName || page;
        return siteName ? `${page} - ${siteName}` : page;
    };
}

/**
 * The tree both entries render: the page (in its persistent layout), the
 * auth dialogs and the theme switcher inside the app (they use usePage),
 * and the payments root beside it. Identical on the server and in the
 * browser, or hydration falls back to a client render.
 */
export function appTree({ App, props, AuthRoot, PaymentsRoot, ThemeSwitcher, wrap = (A) => A }) {
    const Root = wrap(App);
    return (
        <>
            <Root {...props}>
                {({ Component, props: pageProps, key }) => (
                    <>
                        {typeof Component.layout === 'function'
                            ? Component.layout(<Component key={key} {...pageProps} />)
                            : <Component key={key} {...pageProps} />}
                        <AuthRoot />
                        <ThemeSwitcher />
                    </>
                )}
            </Root>
            <PaymentsRoot initialPage={props.initialPage} />
        </>
    );
}
