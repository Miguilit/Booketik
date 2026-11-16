import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import DOMPurify from 'dompurify';

import { EmbedFigure } from './embedFigure';

/**
 * The rich-text editor behind event descriptions: one extension list and one
 * paste whitelist, matched to what the server can store.
 *
 * **Nothing here decides what is safe.** `App\Support\RichText` parses whatever
 * arrives into a closed block vocabulary on save, and that is the gate. The
 * client-side sanitising below is about *not surprising the organizer*: a Word
 * paste that arrives full of `<span style>` would otherwise look fine in the
 * editor and come back stripped after save, which reads as the dashboard
 * losing their formatting.
 *
 * Headless: the theme draws the toolbar (see Core/richText.js).
 */

/**
 * Paragraph line spacing. Must match `RichText::SPACINGS` — the server drops
 * any other value.
 */
export const SPACINGS = [
    { value: '', label: 'Default spacing' },
    { value: 'single', label: 'Single' },
    { value: 'onehalf', label: '1.5 lines' },
    { value: 'double', label: 'Double' },
];

const SPACING_VALUES = SPACINGS.map((s) => s.value).filter(Boolean);

/** Exactly what the server's block vocabulary can express. Anything else is noise. */
export const PASTE_ALLOWED = {
    ALLOWED_TAGS: [
        'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 's', 'del', 'code', 'sup', 'sub',
        'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'img', 'figure', 'figcaption',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'width', 'height', 'data-embed', 'data-id', 'data-spacing'],
};

/**
 * `spacing` on paragraphs, stored as `<p data-spacing="double">`.
 *
 * `keepOnSplit` (TipTap's default) means pressing Enter in a double-spaced
 * paragraph gives another double-spaced one, which is what a word processor
 * does and what a writer expects.
 */
const LineSpacing = Extension.create({
    name: 'lineSpacing',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph'],
                attributes: {
                    spacing: {
                        default: null,
                        parseHTML: (element) => {
                            const value = element.getAttribute('data-spacing');

                            return SPACING_VALUES.includes(value) ? value : null;
                        },
                        renderHTML: (attributes) =>
                            attributes.spacing ? { 'data-spacing': attributes.spacing } : {},
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setLineSpacing:
                (value) =>
                ({ commands }) =>
                    SPACING_VALUES.includes(value)
                        ? commands.updateAttributes('paragraph', { spacing: value })
                        : commands.resetAttributes('paragraph', 'spacing'),
        };
    },
});

/** Builds an editor on `surface`. */
export function createRichTextEditor({ surface, content = '', onUpdate, placeholder }) {
    return new Editor({
        element: surface,
        extensions: [
            StarterKit.configure({
                // The server maps h1/h2 to `heading` and h3-h6 to `subheading`,
                // so offering six levels would offer a distinction that does
                // not survive the save.
                heading: { levels: [2, 3] },
                // A description has no code blocks, and one that contains one
                // is almost always a paste accident.
                codeBlock: false,
                // StarterKit v3 bundles these; ours are configured below.
                link: false,
                underline: false,
            }),
            Underline,
            Superscript,
            Subscript,
            LineSpacing,
            Link.configure({
                openOnClick: false,
                autolink: true,
                // Matches the server's scheme check. A link the editor accepts
                // and the server strips is a link the organizer thinks they made.
                protocols: ['http', 'https'],
            }),
            Image.configure({ inline: false, allowBase64: false }),
            EmbedFigure,
            Placeholder.configure({
                placeholder:
                    placeholder ??
                    'Describe the event. Enter starts a new paragraph, Shift+Enter a new line. Paste from anywhere — formatting is cleaned up on the way in.',
            }),
        ],
        content,
        editorProps: {
            transformPastedHTML: (html) => DOMPurify.sanitize(html, PASTE_ALLOWED),
        },
        onUpdate: ({ editor: instance }) => onUpdate?.(instance),
    });
}
