import { Head, Link } from '@inertiajs/react';
import { Newspaper } from 'lucide-react';
import { layout } from '@/Themes/civic/Layout';
import { Chip, cn, Container, EmptyState, SectionHead, Tag } from '@/Themes/civic/components/ui';
import { useRoute } from '@/Core/lib/useSite';
import { t } from '@/Core/i18n';

/**
 * The blog index.
 *
 * ## Featured posts are not a separate band
 *
 * They sort first inside the same grid. A blog with four posts, two of them
 * featured, looks broken when half of it sits in a "featured" hero above a list
 * containing the other half — and that is the state every new install is in.
 *
 * ## Categories are chips, not a dropdown
 *
 * There are rarely more than half a dozen, they are the only navigation this
 * section has, and a dropdown hides the fact that filtering is possible at all.
 */

function PostCard({ post, url, lead = false }) {
    return (
        <article className={cn('group relative flex flex-col overflow-hidden rounded-card bg-surface', lead ? 'border-key border-edge shadow-key md:col-span-2 md:flex-row' : 'border border-line')}>
            <div className={cn('w-full shrink-0 overflow-hidden bg-raised', lead ? 'aspect-[16/9] md:aspect-auto md:w-[55%]' : 'aspect-[16/9]')}>
                {post.image ? (
                    <img src={post.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                ) : (
                    /* Same height as its neighbours, or the grid tears. */
                    <div className="h-full w-full" aria-hidden="true" />
                )}
            </div>

            <div className={cn('flex flex-1 flex-col', lead ? 'p-6 sm:p-8' : 'p-5')}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {post.category ? <Tag tone="info">{post.category.name}</Tag> : null}
                    {post.featured ? <Tag tone="warn">{t('Featured')}</Tag> : null}
                </div>

                <h2 className={cn('font-display font-bold leading-tight tracking-[-0.02em] text-ink', lead ? 'text-[30px] sm:text-[36px]' : 'text-xl')}>
                    <Link href={url(`/blog/${post.slug}`)} className="after:absolute after:inset-0 after:content-[''] group-hover:underline">
                        {post.title}
                    </Link>
                </h2>

                {post.excerpt ? <p className={cn('mt-2 text-body', lead ? 'text-[17px]' : 'line-clamp-3 text-[15px]')}>{post.excerpt}</p> : null}

                <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 font-mono text-xs text-muted">
                    {post.author ? <span>{post.author}</span> : null}
                    {post.publishedLabel ? <span>{post.publishedLabel}</span> : null}
                    {post.readTime ? <span>{post.readTime}</span> : null}
                </p>
            </div>
        </article>
    );
}

export default function Blog({ posts, categories, activeCategory, meta }) {
    const url = useRoute();

    /*
     * No `meta` prop on Layout: app.blade.php reads `props.meta` server-side
     * and renders the canonical, hreflang and OpenGraph tags from it, which is
     * how every other page on this site does its previews.
     */
    return (
        <>
            <Head title={meta?.title ?? t('Blog')} />
            <Container className="pb-8 pt-10">
                <SectionHead as="h1" eyebrow={t('Journal')} title={meta?.title ?? t('Blog')} subtitle={meta?.description} className="mb-6" />

                {categories.length > 0 ? (
                    <nav aria-label={t('Categories')} className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1">
                        <Chip href={url('/blog')} active={!activeCategory}>{t('All')}</Chip>
                        {categories.map((category) => (
                            <Chip key={category.slug} href={url(`/blog/category/${category.slug}`)} active={activeCategory === category.slug}>
                                {category.name}
                            </Chip>
                        ))}
                    </nav>
                ) : null}

                {posts.data.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.data.map((post, index) => (
                            <PostCard key={post.slug} post={post} url={url} lead={index === 0 && posts.current_page !== undefined ? posts.current_page === 1 : index === 0} />
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={Newspaper} title={t('Nothing published here yet.')} />
                )}

                {posts.links.length > 3 ? (
                    <nav aria-label={t('Pages')} className="mt-12 flex flex-wrap justify-center gap-1.5">
                        {posts.links.map((link) => (
                            <Link
                                key={link.label}
                                href={link.url ?? '#'}
                                aria-current={link.active ? 'page' : undefined}
                                // A disabled link stays in the DOM so the row does not reflow between pages.
                                className={cn(
                                    'inline-flex h-10 min-w-10 items-center justify-center rounded-chip border-key px-3 font-mono text-sm',
                                    link.active ? 'border-edge bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-edge',
                                    !link.url && 'pointer-events-none opacity-40',
                                )}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </nav>
                ) : null}
            </Container>
        </>
    );
}

Blog.layout = layout;
