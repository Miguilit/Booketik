import { Head, Link } from '@inertiajs/react';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { layout } from '@/Themes/civic/Layout';
import ShareButtons from '@/Themes/civic/components/chrome/ShareButtons';
import { cn, GUTTER } from '@/Themes/civic/components/ui';
import { useRoute } from '@/Core/lib/useSite';
import { t } from '@/Core/i18n';

/**
 * One blog post.
 *
 * ## The body is operator HTML, so it is sanitised
 *
 * `blogs.content` is a longtext an operator fills through a rich editor in the
 * admin panel. Unlike an event description — which goes through
 * `App\Support\RichText` and is stored as a fixed set of blocks — this is markup, kept as markup, and
 * rendering it raw would make the blog editor a stored-XSS form on a page that
 * carries a visitor's session.
 *
 * DOMPurify, exactly as `Pages/Contents/Index.jsx` does for static pages. Same
 * input shape, same treatment.
 *
 * ## JSON-LD is here rather than in the layout
 *
 * `BlogPosting` needs the post, and the layout does not have one. It is the
 * difference between a search result with a byline and date and a bare blue
 * link, which for a marketing surface is most of the point of having a blog.
 */
export default function BlogPost({ post, related, newer, older, meta }) {
    const url = useRoute();

    const html = useMemo(
        () => DOMPurify.sanitize(post.content ?? ''),
        [post.content],
    );

    const jsonLd = useMemo(
        () =>
            JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: post.title,
                description: post.excerpt ?? meta?.description ?? '',
                image: post.image ? [post.image] : undefined,
                datePublished: post.publishedAt ?? undefined,
                author: post.author ? { '@type': 'Person', name: post.author } : undefined,
                mainEntityOfPage: post.shareUrl,
            }),
        [post, meta],
    );

    return (
        <>
            <Head title={post.title} />
            <Head>
                <script type="application/ld+json">{jsonLd}</script>
            </Head>

            <article className={cn(GUTTER, 'pb-8 pt-8')}>
                <div className="mx-auto max-w-[760px]">
                    {/* Each on its own line.

                        Both were inline elements with only a bottom margin, so
                        they laid out side by side and ran together — "All
                        postsReading" — with the margins doing nothing, because
                        vertical margins are ignored on an inline box. Wrapping
                        each in a block is what actually separates them. */}
                    <div className="mb-5">
                        <Link
                            href={url('/blog')}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
                        >
                            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {t('All posts')}
                        </Link>
                    </div>

                    {post.category ? (
                        <div className="mb-3">
                            <Link
                                href={url(`/blog/category/${post.category.slug}`)}
                                className="inline-flex items-center rounded-chip bg-tint px-3 py-1 text-xs font-bold uppercase tracking-[0.04em] text-on-tint hover:underline"
                            >
                                {post.category.name}
                            </Link>
                        </div>
                    ) : null}

                    <h1 className="mb-4 font-display text-[38px] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[54px]">
                        {post.title}
                    </h1>

                    <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-muted">
                        {post.author ? <span>{post.author}</span> : null}
                        {post.publishedLabel ? <span>{post.publishedLabel}</span> : null}
                        {post.readTime ? <span>{post.readTime}</span> : null}
                    </div>

                    {post.image ? (
                        <img
                            src={post.image}
                            alt=""
                            className="mb-10 aspect-[16/9] w-full rounded-card border-key border-edge object-cover shadow-key"
                        />
                    ) : null}

                    {post.excerpt ? (
                        <p className="mb-8 border-s-4 border-cta ps-4 font-display text-[22px] leading-snug text-ink">
                            {post.excerpt}
                        </p>
                    ) : null}

                    <div
                        className="cv-prose"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />

                    <div className="mt-10 border-t border-line pt-6">
                        <ShareButtons url={post.shareUrl} title={post.title} />
                    </div>

                    {/* Older and newer, by publication date rather than by id —
                        posts are backdated on import, and "the row before this
                        one" is not a relationship a reader can perceive. */}
                    {(newer || older) && (
                        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
                            {older ? (
                                <Link
                                    href={url(`/blog/${older.slug}`)}
                                    className="rounded-card border-key border-line bg-surface p-4 transition-colors hover:border-edge"
                                >
                                    <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted">
                                        <ChevronLeft className="h-3 w-3 rtl:rotate-180" aria-hidden="true" /> {t('Older')}
                                    </span>
                                    <span className="font-display text-lg font-bold leading-snug text-ink">{older.title}</span>
                                </Link>
                            ) : (
                                <span />
                            )}

                            {newer ? (
                                <Link
                                    href={url(`/blog/${newer.slug}`)}
                                    className="rounded-card border-key border-line bg-surface p-4 text-end transition-colors hover:border-edge"
                                >
                                    <span className="mb-1 flex items-center justify-end gap-1 text-xs font-semibold text-muted">
                                        {t('Newer')} <ChevronRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
                                    </span>
                                    <span className="font-display text-lg font-bold leading-snug text-ink">{newer.title}</span>
                                </Link>
                            ) : null}
                        </nav>
                    )}
                </div>

                {related.length > 0 ? (
                    <div className="mx-auto mt-14 max-w-[1100px]">
                        <h2 className="mb-5 font-display text-[26px] font-bold tracking-[-0.02em] text-ink">{t('More like this')}</h2>

                        <div className="grid gap-5 sm:grid-cols-3">
                            {related.map((item) => (
                                <Link
                                    key={item.slug}
                                    href={url(`/blog/${item.slug}`)}
                                    className="group rounded-card border border-line bg-surface p-5 transition-colors hover:border-edge"
                                >
                                    <h3 className="mb-1 font-display text-lg font-bold leading-snug text-ink group-hover:underline">
                                        {item.title}
                                    </h3>
                                    <p className="font-mono text-xs text-muted">{item.publishedLabel}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : null}
            </article>
        </>
    );
}

BlogPost.layout = layout;
