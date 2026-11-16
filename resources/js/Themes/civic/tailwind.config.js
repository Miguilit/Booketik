import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/*
 | Daylight Civic. Colours are the semantic layer (`--s-*`, tokens.css), not
 | Civic's own `--cv-*`, so Civic pages shown under another theme take that
 | theme's colours. `accent` is the event's guarded tint (`--ev-accent`, set
 | on the event page), falling back to the brand.
 */
const s = (name) => `rgb(var(--s-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './resources/js/Themes/civic/**/*.{js,jsx}',
        './resources/js/Core/**/*.{js,jsx}',
        './resources/views/app.blade.php',
    ],
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            white: '#ffffff',
            black: '#000000',
            bg: s('bg'),
            surface: s('surface'),
            raised: s('raised'),
            ink: s('ink'),
            body: s('body'),
            muted: s('muted'),
            line: s('line'),
            edge: s('edge'),
            brand: s('brand'),
            'on-brand': s('on-brand'),
            link: s('link'),
            cta: { DEFAULT: s('cta'), hover: s('cta-hover') },
            'on-cta': s('on-cta'),
            tint: s('tint'),
            'on-tint': s('on-tint'),
            'tint-2': s('tint-2'),
            'on-tint-2': s('on-tint-2'),
            success: s('success'),
            danger: s('danger'),
            warning: s('warning'),
            focus: s('focus'),
            shadow: s('shadow'),
            scrim: s('scrim'),
            'on-scrim': s('on-scrim'),
            accent: 'rgb(var(--ev-accent, var(--s-brand)) / <alpha-value>)',
            'on-accent': 'rgb(var(--ev-on-accent, var(--s-on-brand)) / <alpha-value>)',
        },
        fontFamily: {
            display: 'var(--s-font-display)',
            sans: 'var(--s-font-body)',
            mono: 'var(--s-font-mono)',
        },
        extend: {
            borderRadius: {
                card: 'var(--s-radius-card)',
                chip: 'var(--s-radius-chip)',
                btn: 'var(--s-radius-btn)',
                sm: 'var(--s-radius-sm)',
            },
            borderWidth: { key: 'var(--s-border-key)' },
            boxShadow: {
                key: 'var(--s-shadow-key)',
                'key-hover': 'var(--s-shadow-key-hover)',
                soft: 'var(--s-shadow-soft)',
            },
            maxWidth: { page: '1240px' },
            transitionTimingFunction: { snap: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
            screens: { xs: '400px' },
        },
    },
    plugins: [forms({ strategy: 'class' }), typography],
};
