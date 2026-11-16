import { Node, mergeAttributes } from '@tiptap/core';

/**
 * A video, stored as a **descriptor rather than as a player**.
 *
 * The document never contains an `<iframe>`. It contains
 * `<figure data-embed="youtube" data-id="…">`, and the renderer builds the
 * player from a fixed provider table at draw time. That is what keeps organizer
 * input from becoming markup on a page, and it is why `App\Support\RichText` refuses a provider it does not know and
 * an id that is not an id.
 *
 * It also means the app can show a thumbnail instead of putting a WebView in
 * the middle of an event description, which is the difference between a page
 * that scrolls and one that stutters.
 */
export const PROVIDERS = {
    youtube: {
        label: 'YouTube',
        // youtu.be/ID · /watch?v=ID · /embed/ID · /shorts/ID
        patterns: [
            /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,64})/,
        ],
        thumb: (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    },
    vimeo: {
        label: 'Vimeo',
        patterns: [/vimeo\.com\/(?:video\/)?(\d{6,20})/],
        thumb: () => null,
    },
};

/**
 * Pulls `{provider, id}` out of a pasted URL.
 *
 * Returns null rather than guessing. A URL this does not recognise would become
 * an embed the server refuses on save, and an editor that accepts something the
 * server then silently drops is worse than one that says "that link is not a
 * video I can embed".
 */
export function parseEmbedUrl(url) {
    const trimmed = String(url ?? '').trim();

    if (trimmed === '') {
        return null;
    }

    for (const [provider, config] of Object.entries(PROVIDERS)) {
        for (const pattern of config.patterns) {
            const match = trimmed.match(pattern);

            if (match) {
                return { provider, id: match[1] };
            }
        }
    }

    return null;
}

export const EmbedFigure = Node.create({
    name: 'embedFigure',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            provider: { default: null },
            embedId: { default: null },
            caption: { default: null },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'figure[data-embed]',
                getAttrs: (element) => ({
                    provider: element.getAttribute('data-embed'),
                    embedId: element.getAttribute('data-id'),
                    caption: element.querySelector('figcaption')?.textContent?.trim() || null,
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes, node }) {
        const caption = node.attrs.caption
            ? ['figcaption', {}, node.attrs.caption]
            : null;

        return [
            'figure',
            mergeAttributes({
                'data-embed': node.attrs.provider,
                'data-id': node.attrs.embedId,
            }, HTMLAttributes),
            ...(caption ? [caption] : []),
        ];
    },

    /**
     * What the editor shows: a poster and a label, not a live player.
     *
     * Rendering the real embed inside the editor would put a third-party script
     * inside the dashboard, on a page that is authenticated as the
     * organizer. A thumbnail says the same thing at none of the cost.
     */
    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement('figure');
            dom.className = 'rich-text__embed';
            dom.setAttribute('data-embed', node.attrs.provider ?? '');
            dom.setAttribute('data-id', node.attrs.embedId ?? '');
            dom.contentEditable = 'false';

            const config = PROVIDERS[node.attrs.provider];
            const thumb = config?.thumb?.(node.attrs.embedId);

            if (thumb) {
                const img = document.createElement('img');
                img.src = thumb;
                img.alt = '';
                img.loading = 'lazy';
                dom.appendChild(img);
            }

            const label = document.createElement('span');
            label.className = 'rich-text__embed-label';
            label.textContent = `▶ ${config?.label ?? node.attrs.provider} · ${node.attrs.embedId}`;
            dom.appendChild(label);

            if (node.attrs.caption) {
                const caption = document.createElement('figcaption');
                caption.textContent = node.attrs.caption;
                dom.appendChild(caption);
            }

            return { dom };
        };
    },

    addCommands() {
        return {
            setEmbed:
                (attributes) =>
                    ({ commands }) =>
                        commands.insertContent({ type: this.name, attrs: attributes }),
        };
    },
});
