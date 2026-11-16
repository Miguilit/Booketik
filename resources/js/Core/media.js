/*
 | Responsive images from the API's Image shape
 | `{ url, width, height, blurhash, color, variants }`.
 |
 | Uploads carry their own variants (App\Support\Media\ImageVariants:
 | 480/960/1440/1920 wide, AVIF and WebP with a JPEG fallback), offered as
 | `<picture>` sources — the server preloads the LCP cover from the same
 | AVIF srcset (App\Support\ImagePreload), so it is fetched once. `color`
 | is the dominant colour, painted behind the image while it loads.
 |
 | Images without variants: known resizers are rewritten per width:
 |   - Cloudflare Images / Image Resizing: `/cdn-cgi/image/width=W,…/<path>`
 |   - the demo's placeholder host: `/seed/<seed>/<w>/<h>`
 |   - any URL already carrying `?w=` / `?width=`
 | Anything else is served as is, with its intrinsic size so the box is
 | reserved (no layout shift) and `loading="lazy"` unless it is the LCP image.
 */

const WIDTHS = [320, 480, 640, 800, 1080, 1440, 1920];

function sized(url, width, ratio) {
    try {
        const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

        const seed = u.pathname.match(/^(\/seed\/[^/]+)\/(\d+)\/(\d+)$/);
        if (seed) {
            u.pathname = `${seed[1]}/${width}/${Math.round(width * ratio)}`;
            return u.toString();
        }

        if (u.pathname.includes('/cdn-cgi/image/')) {
            u.pathname = u.pathname.replace(/\/cdn-cgi\/image\/[^/]*\//, `/cdn-cgi/image/width=${width},fit=scale-down,format=auto/`);
            return u.toString();
        }

        for (const key of ['w', 'width']) {
            if (u.searchParams.has(key)) {
                u.searchParams.set(key, String(width));
                return u.toString();
            }
        }
    } catch {
        // Not a URL we can reason about.
    }
    return null;
}

/**
 * Props for an `<img>`: `{ src, srcSet, sizes, width, height, loading, decoding, fetchpriority, alt }`.
 *
 * @param image  the API Image (or null)
 * @param opts   `{ sizes, priority, alt, max }` — `priority` for the hero/LCP image
 */
export function imageProps(image, { sizes = '100vw', priority = false, alt = '', max = 1920, ratio } = {}) {
    if (!image?.url) return null;
    const base = {
        width: image.width || undefined,
        height: image.height || undefined,
        loading: priority ? 'eager' : 'lazy',
        decoding: priority ? 'sync' : 'async',
        fetchPriority: priority ? 'high' : undefined,
        alt,
        style: image.color ? { backgroundColor: image.color } : undefined,
    };

    const v = image.variants;
    if (v?.jpeg) {
        const widths = (v.widths ?? []).filter((w) => w <= Math.max(max, 480));
        const pick = (set) => (set ? set.split(', ').filter((entry) => widths.includes(Number(entry.split(' ').pop().replace('w', '')))).join(', ') || set : null);
        const jpeg = pick(v.jpeg);
        const fallback = jpeg.split(', ').map((e) => e.split(' ')[0]);
        return {
            ...base,
            src: fallback[Math.min(1, fallback.length - 1)] ?? image.url,
            srcSet: jpeg,
            sizes,
            sources: [
                v.avif && { type: 'image/avif', srcSet: pick(v.avif), sizes },
                v.webp && { type: 'image/webp', srcSet: pick(v.webp), sizes },
            ].filter(Boolean),
        };
    }

    const r = ratio ?? (image.height && image.width ? image.height / image.width : 2 / 3);
    const widths = WIDTHS.filter((w) => w <= Math.max(max, 320));
    const set = widths.map((w) => {
        const src = sized(image.url, w, r);
        return src ? `${src} ${w}w` : null;
    }).filter(Boolean);

    return {
        ...base,
        src: (set.length && sized(image.url, Math.min(1080, max), r)) || image.url,
        srcSet: set.length ? set.join(', ') : undefined,
        sizes: set.length ? sizes : undefined,
        sources: [],
    };
}

/**
 * The URL for a small square (avatars, logos): the smallest variant at least
 * twice `size` wide, else the original.
 */
export function thumbSrc(image, size = 64) {
    if (!image?.url) return null;
    const set = image.variants?.webp ?? image.variants?.jpeg;
    if (!set) return image.url;
    const entries = set.split(', ').map((e) => { const [url, w] = e.split(' '); return { url, w: Number(w.replace('w', '')) }; });
    return (entries.find((e) => e.w >= size * 2) ?? entries[entries.length - 1])?.url ?? image.url;
}

/** Initials for an avatar without a photo. */
export function initials(name) {
    return String(name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}
