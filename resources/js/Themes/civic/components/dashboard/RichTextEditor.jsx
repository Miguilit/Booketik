import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import { useRichTextEditor } from '@/Core/richText';
import { t } from '@/Core/i18n';
import { cn } from '../ui';

/** The event description editor: TipTap (the admin's own editor core) with a Civic toolbar. */
export default function RichTextEditor({ value, onChange, placeholder, id, label }) {
    const { surface, commands, isActive, linkHref } = useRichTextEditor({ value, onChange, placeholder });

    const tools = [
        { key: 'h2', icon: Heading2, label: t('Heading'), run: commands.heading, active: isActive('heading', { level: 2 }) },
        { key: 'h3', icon: Heading3, label: t('Subheading'), run: commands.subheading, active: isActive('heading', { level: 3 }) },
        { key: 'b', icon: Bold, label: t('Bold'), run: commands.bold, active: isActive('bold') },
        { key: 'i', icon: Italic, label: t('Italic'), run: commands.italic, active: isActive('italic') },
        { key: 'ul', icon: List, label: t('Bullet list'), run: commands.bullets, active: isActive('bulletList') },
        { key: 'ol', icon: ListOrdered, label: t('Numbered list'), run: commands.numbers, active: isActive('orderedList') },
        { key: 'q', icon: Quote, label: t('Quote'), run: commands.quote, active: isActive('blockquote') },
        {
            key: 'a', icon: Link2, label: t('Link'), active: isActive('link'),
            run: () => {
                const href = window.prompt(t('Link address (https://…) — leave empty to remove'), linkHref());
                if (href === null) return;
                if (href && !/^https?:\/\//i.test(href)) return window.alert(t('Links must start with http:// or https://.'));
                commands.link(href.trim());
            },
        },
        { key: 'u', icon: Undo2, label: t('Undo'), run: commands.undo },
        { key: 'r', icon: Redo2, label: t('Redo'), run: commands.redo },
    ];

    return (
        <div className="rounded-sm border-key border-line bg-surface focus-within:border-edge">
            <div role="toolbar" aria-label={t('Formatting')} className="flex flex-wrap gap-0.5 border-b border-line p-1.5">
                {tools.map((tool) => (
                    <button
                        key={tool.key}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={tool.run}
                        aria-label={tool.label}
                        title={tool.label}
                        aria-pressed={tool.active === undefined ? undefined : tool.active}
                        className={cn('flex h-9 w-9 items-center justify-center rounded-[8px] text-ink hover:bg-raised', tool.active && 'bg-ink text-bg hover:bg-ink')}
                    >
                        <tool.icon className="h-4 w-4" aria-hidden="true" />
                    </button>
                ))}
            </div>
            <div
                id={id}
                ref={surface}
                aria-label={label}
                className="prose prose-sm max-w-none px-4 py-3 text-body sm:prose-base [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0 [&_.ProseMirror_p.is-editor-empty:first-child]:before:text-muted [&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] prose-headings:font-display prose-headings:text-ink prose-a:text-link prose-strong:text-ink prose-blockquote:text-body"
            />
        </div>
    );
}
