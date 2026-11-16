import { contentBlocks } from '@/Core/events';
import { cn } from './ui';

/*
 | Renders the API's rich-text blocks (App\Support\RichText): paragraph,
 | heading, subheading, quote, list, image, separator. Spans carry `t` and
 | flags `b i u s c sub sup` and a sanitised link `h`. React escapes the text;
 | links are already scheme-checked by the server.
 */

function Span({ span }) {
    let node = span.t;
    if (span.c) node = <code className="rounded bg-raised px-1 font-mono text-[0.9em]">{node}</code>;
    if (span.b) node = <strong>{node}</strong>;
    if (span.i) node = <em>{node}</em>;
    if (span.u) node = <u>{node}</u>;
    if (span.s) node = <s>{node}</s>;
    if (span.sub) node = <sub>{node}</sub>;
    if (span.sup) node = <sup>{node}</sup>;
    if (span.h) {
        const external = /^https?:/i.test(span.h);
        node = <a href={span.h} {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}>{node}</a>;
    }
    return node;
}

export function Spans({ spans }) {
    return (spans ?? []).map((span, i) => <Span key={i} span={span} />);
}

export default function Blocks({ blocks, className }) {
    const list = contentBlocks(blocks);
    if (!list.length) return null;

    return (
        <div className={cn('al-prose', className)}>
            {list.map((block, i) => {
                switch (block.kind) {
                    case 'heading':
                        return <h2 key={i}><Spans spans={block.spans} /></h2>;
                    case 'subheading':
                        return <h3 key={i}><Spans spans={block.spans} /></h3>;
                    case 'quote':
                        return <blockquote key={i}><Spans spans={block.spans} /></blockquote>;
                    case 'list': {
                        const Tag = block.ordered ? 'ol' : 'ul';
                        return <Tag key={i}>{(block.items ?? []).map((item, j) => <li key={j}><Spans spans={item} /></li>)}</Tag>;
                    }
                    case 'image':
                        return (
                            <figure key={i}>
                                <img src={block.url} alt={block.alt ?? ''} width={block.width} height={block.height} loading="lazy" className="w-full" />
                                {block.caption && <figcaption className="mt-1.5 text-sm text-muted">{block.caption}</figcaption>}
                            </figure>
                        );
                    case 'separator':
                        return <hr key={i} className="border-line" />;
                    default:
                        return <p key={i} className="whitespace-pre-line"><Spans spans={block.spans} /></p>;
                }
            })}
        </div>
    );
}
