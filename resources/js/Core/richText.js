/*
 | The rich-text editor for the dashboard (event descriptions), headless.
 |
 | The TipTap editor from Core/editor/createEditor.js (one extension list,
 | one paste whitelist matched to App\Support\RichText, which compiles the
 | HTML to the event's blocks on save). This hook owns the
 | editor's life and state; the theme draws the toolbar from `commands` and
 | `isActive`, so no toolbar markup comes from here.
 */
import { useEffect, useRef, useState } from 'react';
import { createRichTextEditor } from './editor/createEditor';

export function useRichTextEditor({ value, onChange, placeholder }) {
    const surface = useRef(null);
    const editorRef = useRef(null);
    const changed = useRef(onChange);
    const [, setTick] = useState(0);
    changed.current = onChange;

    useEffect(() => {
        if (!surface.current) return undefined;
        const editor = createRichTextEditor({
            surface: surface.current,
            content: value || '',
            placeholder,
            onUpdate: (instance) => changed.current?.(instance.isEmpty ? '' : instance.getHTML()),
        });
        const refresh = () => setTick((n) => n + 1);
        editor.on('selectionUpdate', refresh);
        editor.on('transaction', refresh);
        editorRef.current = editor;
        return () => {
            editor.destroy();
            editorRef.current = null;
        };
        // Mounted once; later `value` changes come from the editor itself.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const chain = () => editorRef.current?.chain().focus();
    const commands = {
        heading: () => chain()?.toggleHeading({ level: 2 }).run(),
        subheading: () => chain()?.toggleHeading({ level: 3 }).run(),
        bold: () => chain()?.toggleBold().run(),
        italic: () => chain()?.toggleItalic().run(),
        bullets: () => chain()?.toggleBulletList().run(),
        numbers: () => chain()?.toggleOrderedList().run(),
        quote: () => chain()?.toggleBlockquote().run(),
        link: (href) => (href ? chain()?.extendMarkRange('link').setLink({ href }).run() : chain()?.extendMarkRange('link').unsetLink().run()),
        undo: () => chain()?.undo().run(),
        redo: () => chain()?.redo().run(),
        /** Replace the whole document (an AI rewrite the organizer accepted). */
        setContent: (html) => {
            editorRef.current?.commands.setContent(html || '');
            changed.current?.(html || '');
        },
    };

    const isActive = (name, attrs) => Boolean(editorRef.current?.isActive(name, attrs));
    const linkHref = () => editorRef.current?.getAttributes('link').href ?? '';

    return { surface, commands, isActive, linkHref, editor: editorRef };
}
