/*
 | Each storefront theme builds from its own config (`@config` at the top of
 | its theme.css). This root one only exists so the stylesheets with no
 | Tailwind in them — the theme switcher's plain CSS — pass through PostCSS
 | without a "missing content" warning.
 */
/** @type {import('tailwindcss').Config} */
export default {
    content: ['./resources/js/Switcher/**/*.jsx'],
};
