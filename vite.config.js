import { defineConfig } from 'vite';
import laravel, { refreshPaths } from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { existsSync, readdirSync } from 'node:fs';

/*
 | One stylesheet entry per storefront theme, discovered rather than listed:
 | a theme folder with a `theme.css` is buildable the moment it exists, and
 | nobody has to remember a second file. The root view links exactly one of
 | them (ThemeRegistry::cssEntry).
 */
const THEMES_DIR = 'resources/js/Themes';
const themeStyles = existsSync(THEMES_DIR)
    ? readdirSync(THEMES_DIR, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && existsSync(`${THEMES_DIR}/${entry.name}/theme.css`))
          .map((entry) => `${THEMES_DIR}/${entry.name}/theme.css`)
    : [];

export default defineConfig({
    plugins: [
        laravel({
            /*
             * `app.jsx` is the Inertia site. It imports no CSS: the root view
             * links one theme's `theme.css` beside it.
             */
            input: [
                'resources/js/app.jsx',
                ...themeStyles,
            ],
            // Inertia SSR: `vite build --ssr` → bootstrap/ssr/ssr.js, run by
            // `php artisan inertia:start-ssr` (README: Server-side rendering).
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
    ],
});
