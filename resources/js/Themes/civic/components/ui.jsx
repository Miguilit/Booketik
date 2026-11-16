/*
 | Daylight Civic — the kit. Every page builds from these; no page invents
 | its own button. Shapes and weights follow DESIGN.md: chunky radii, a 1.5px
 | ink edge and a hard 2px offset shadow on the things you press or keep
 | (the "sticker"), hairlines everywhere else.
 */
import { forwardRef, useId } from 'react';
import { Link } from '@inertiajs/react';
import { Dialog as HDialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Loader2, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { imageProps, initials, thumbSrc } from '@/Core/media';
import { t } from '@/Core/i18n';

export { cn };

export const GUTTER = 'mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8';

export function Container({ className, children, as: As = 'div', ...rest }) {
    return (
        <As className={cn(GUTTER, className)} {...rest}>
            {children}
        </As>
    );
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */

const BTN = {
    base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[transform,box-shadow,background-color,color] duration-150 ease-snap disabled:cursor-not-allowed disabled:opacity-55 select-none',
    size: {
        sm: 'h-9 px-3.5 text-sm rounded-btn',
        md: 'h-11 px-5 text-[15px] rounded-btn',
        lg: 'h-14 px-6 text-base rounded-btn',
        icon: 'h-10 w-10 rounded-chip',
    },
    variant: {
        // The one call to action on a screen: tangerine sticker.
        cta: 'bg-cta text-on-cta border-key border-edge shadow-key hover:-translate-x-px hover:-translate-y-px hover:shadow-key-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        accent: 'bg-accent text-on-accent border-key border-edge shadow-key hover:-translate-x-px hover:-translate-y-px hover:shadow-key-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        primary: 'bg-brand text-on-brand hover:bg-brand/90',
        secondary: 'bg-surface text-ink border-key border-edge hover:bg-raised',
        quiet: 'bg-raised text-ink hover:bg-line/70',
        ghost: 'text-ink hover:bg-raised',
        link: 'h-auto px-0 text-link underline-offset-4 hover:underline',
        signal: 'bg-success text-bg hover:bg-success/90',
        danger: 'bg-surface text-danger border-key border-danger/60 hover:bg-danger/5',
    },
};

export function buttonClass({ variant = 'primary', size = 'md', block = false, className } = {}) {
    return cn(BTN.base, BTN.size[size], BTN.variant[variant], block && 'w-full', className);
}

/** `href` → an Inertia Link (or `<a>` when `external`); otherwise a `<button>`. */
export const Button = forwardRef(function Button(
    { variant = 'primary', size = 'md', block, className, href, external, loading, icon: Icon, trailing: Trailing, children, ...rest },
    ref,
) {
    const cls = buttonClass({ variant, size, block, className });
    const inner = (
        <>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-[18px] w-[18px]" aria-hidden="true" /> : null}
            {children}
            {Trailing ? <Trailing className="h-[18px] w-[18px]" aria-hidden="true" /> : null}
        </>
    );
    if (href && external) return <a ref={ref} href={href} className={cls} target="_blank" rel="noreferrer" {...rest}>{inner}</a>;
    if (href) return <Link ref={ref} href={href} className={cls} {...rest}>{inner}</Link>;
    return <button ref={ref} type="button" className={cls} disabled={loading || rest.disabled} {...rest}>{inner}</button>;
});

export function IconButton({ label, icon: Icon, className, variant = 'ghost', ...rest }) {
    return (
        <Button variant={variant} size="icon" aria-label={label} title={label} className={className} {...rest}>
            <Icon className="h-5 w-5" aria-hidden="true" />
        </Button>
    );
}

/* ── Chips, tags, stamps ─────────────────────────────────────────────────── */

export function Chip({ active, onClick, children, icon: Icon, className, href, count, ...rest }) {
    const cls = cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-chip border-key px-4 text-sm font-semibold transition-colors',
        active ? 'border-edge bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-edge',
        className,
    );
    const inner = (
        <>
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {children}
            {count ? <span className={cn('ms-0.5 rounded-chip px-1.5 text-xs', active ? 'bg-bg/20' : 'bg-raised')}>{count}</span> : null}
        </>
    );
    if (href) return <Link href={href} className={cls} aria-current={active ? 'page' : undefined} {...rest}>{inner}</Link>;
    return <button type="button" onClick={onClick} aria-pressed={Boolean(active)} className={cls} {...rest}>{inner}</button>;
}

const TONES = {
    neutral: 'bg-raised text-ink',
    info: 'bg-tint text-on-tint',
    warn: 'bg-tint-2 text-on-tint-2',
    danger: 'bg-danger text-bg',
    success: 'bg-success/15 text-success',
    muted: 'bg-raised text-muted',
    ink: 'bg-ink text-bg',
    accent: 'bg-accent text-on-accent',
};

export function Tag({ tone = 'neutral', className, children, icon: Icon }) {
    return (
        <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-chip px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em]', TONES[tone], className)}>
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {children}
        </span>
    );
}

/** The butter date sticker: weekday, big day, month — in the event's zone. */
export function DateStamp({ when, className, size = 'md' }) {
    if (!when) return null;
    const big = size === 'lg';
    return (
        <span
            className={cn(
                'inline-flex shrink-0 flex-col items-center justify-center rounded-sm border-key border-edge bg-tint-2 text-on-tint-2 shadow-key',
                big ? 'h-[84px] w-[76px]' : 'h-[62px] w-[56px]',
                className,
            )}
            aria-hidden="true"
        >
            <span className="font-mono text-[10px] font-medium uppercase leading-none tracking-widest">{when.dateline.weekday}</span>
            <span className={cn('font-display font-extrabold leading-none', big ? 'text-[34px]' : 'text-[24px]')}>{when.dateline.day}</span>
            <span className="font-mono text-[10px] font-medium uppercase leading-none tracking-widest">{when.dateline.month}</span>
        </span>
    );
}

/* ── Surfaces ────────────────────────────────────────────────────────────── */

export function Card({ sticker = false, as: As = 'div', className, children, ...rest }) {
    return (
        <As
            className={cn(
                'rounded-card bg-surface',
                sticker ? 'border-key border-edge shadow-key' : 'border border-line',
                className,
            )}
            {...rest}
        >
            {children}
        </As>
    );
}

export function SectionHead({ title, eyebrow, subtitle, action, href, className, as: As = 'h2', id, rail = false }) {
    return (
        <div className={cn('mb-5 flex items-end justify-between gap-4', rail && 'sm:pe-24', className)}>
            <div className="min-w-0">
                {eyebrow && <p className="mb-1 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">{eyebrow}</p>}
                <As id={id} className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">{title}</As>
                {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
            </div>
            {href && (
                <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-link">
                    {action ?? t('See all')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}

/** Kept for ported pages that imported Classic's heading. */
export default function SectionHeading(props) {
    return <SectionHead {...props} />;
}

export function EmptyState({ icon: Icon, title, body, action, className }) {
    return (
        <div className={cn('flex flex-col items-center rounded-card border border-dashed border-line px-6 py-12 text-center', className)}>
            {Icon && (
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-chip bg-tint text-on-tint">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
            )}
            <p className="font-display text-xl font-bold text-ink">{title}</p>
            {body && <p className="mt-1.5 max-w-sm text-[15px] text-muted">{body}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function Skeleton({ className }) {
    return <div className={cn('animate-pulse rounded-sm bg-raised', className)} aria-hidden="true" />;
}

/* ── Media ───────────────────────────────────────────────────────────────── */

/** A responsive image from the API Image shape; a quiet panel when there is none. */
export function Img({ image, alt = '', sizes, priority, className, ratio, fallback, ...rest }) {
    const props = imageProps(image, { sizes, priority, alt, ratio });
    if (!props) {
        return fallback ?? <div className={cn('bg-raised', className)} aria-hidden={alt ? undefined : 'true'} role={alt ? 'img' : undefined} aria-label={alt || undefined} />;
    }
    const { sources, ...img } = props;
    const tag = <img {...img} className={cn('object-cover', className)} {...rest} />;
    if (!sources.length) return tag;
    // Variants: AVIF, then WebP, then the JPEG <img>. `contents` keeps the
    // <picture> out of the layout, so the classes on <img> behave as before.
    return (
        <picture className="contents">
            {sources.map((s) => <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={s.sizes} />)}
            {tag}
        </picture>
    );
}

export function Avatar({ image, name, size = 40, className, ring }) {
    const style = { width: size, height: size };
    if (image?.url) {
        return <img src={thumbSrc(image, size)} alt="" width={size} height={size} loading="lazy" decoding="async" style={{ ...style, backgroundColor: image.color || undefined }} className={cn('shrink-0 rounded-full object-cover', ring && 'ring-2 ring-bg', className)} />;
    }
    return (
        <span style={style} className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-tint font-semibold text-on-tint', ring && 'ring-2 ring-bg', className)} aria-hidden="true">
            <span style={{ fontSize: Math.max(10, size * 0.38) }}>{initials(name)}</span>
        </span>
    );
}

/** Faces, a count, and "N friends going" (social proof). */
export function FacePile({ people = [], total, friends = [], size = 30, className }) {
    const faces = (friends.length ? friends : people).slice(0, 5);
    if (!faces.length && !total) return null;
    return (
        <div className={cn('flex items-center gap-3', className)}>
            {faces.length > 0 && (
                <div className="flex -space-x-2 rtl:space-x-reverse">
                    {faces.map((p) => <Avatar key={p.id} image={p.avatar} name={p.name} size={size} ring />)}
                </div>
            )}
            <p className="text-sm text-muted">
                {friends.length > 0
                    ? (friends.length === 1 ? t(':name is going', { name: friends[0].name }) : t(':name and :count friends going', { name: friends[0].name, count: friends.length - 1 }))
                    : total ? t(':count going', { count: total }) : null}
            </p>
        </div>
    );
}

/* ── Rails ───────────────────────────────────────────────────────────────── */

/** A horizontal scroller with prev/next buttons on wide screens; swipe on phones. */
export function Rail({ children, className, label, itemClass = 'w-[78%] xs:w-[62%] sm:w-[44%] lg:w-[31%]' }) {
    const id = useId();
    const scroll = (dir) => {
        const el = document.getElementById(id);
        if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    return (
        <div className={cn('relative', className)}>
            <div className="pointer-events-none absolute -top-14 end-0 hidden gap-2 sm:flex">
                <IconButton label={t('Previous')} icon={ChevronLeft} variant="secondary" className="pointer-events-auto h-9 w-9 rtl:rotate-180" onClick={() => scroll(document.dir === 'rtl' ? 1 : -1)} />
                <IconButton label={t('Next')} icon={ChevronRight} variant="secondary" className="pointer-events-auto h-9 w-9 rtl:rotate-180" onClick={() => scroll(document.dir === 'rtl' ? -1 : 1)} />
            </div>
            <ul id={id} aria-label={label} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                {(Array.isArray(children) ? children : [children]).filter(Boolean).map((child, i) => (
                    <li key={child?.key ?? i} className={cn('shrink-0 snap-start', itemClass)}>{child}</li>
                ))}
            </ul>
        </div>
    );
}

/* ── Forms ───────────────────────────────────────────────────────────────── */

export const FIELD =
    'form-input block w-full rounded-sm border-key border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted focus:border-edge focus:ring-0';

export function Field({ label, error, hint, children, htmlFor, required, className }) {
    return (
        <div className={className}>
            {label && (
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
                        {label}
                        {required && <span className="text-danger" aria-hidden="true"> *</span>}
                    </label>
                    {hint}
                </div>
            )}
            {children}
            {error && <p className="mt-1.5 text-sm font-medium text-danger" role="alert">{error}</p>}
        </div>
    );
}

export function Input({ className, invalid, ...rest }) {
    return <input className={cn(FIELD, invalid && 'border-danger', className)} aria-invalid={invalid || undefined} {...rest} />;
}

export function Textarea({ className, invalid, ...rest }) {
    return <textarea className={cn(FIELD, 'form-textarea min-h-[96px]', invalid && 'border-danger', className)} aria-invalid={invalid || undefined} {...rest} />;
}

export function Select({ className, invalid, children, ...rest }) {
    return <select className={cn(FIELD, 'form-select pe-9', invalid && 'border-danger', className)} aria-invalid={invalid || undefined} {...rest}>{children}</select>;
}

export function Checkbox({ label, className, ...rest }) {
    return (
        <label className={cn('flex cursor-pointer items-start gap-2.5 text-[15px] text-body', className)}>
            <input type="checkbox" className="form-checkbox mt-0.5 h-5 w-5 rounded-[6px] border-key border-edge text-brand focus:ring-0" {...rest} />
            <span>{label}</span>
        </label>
    );
}

/** An on/off switch with a real checkbox underneath (keyboard + screen readers). */
export function Toggle({ checked, onChange, label, description, disabled, id }) {
    const auto = useId();
    const fid = id ?? auto;
    return (
        <div className="flex items-start justify-between gap-4 py-3">
            <label htmlFor={fid} className="min-w-0 cursor-pointer">
                <span className="block font-semibold text-ink">{label}</span>
                {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
            </label>
            <span className="relative inline-flex shrink-0">
                <input id={fid} type="checkbox" role="switch" className="peer sr-only" checked={Boolean(checked)} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
                <span className="h-7 w-12 rounded-chip border-key border-edge bg-raised transition-colors peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:opacity-50" aria-hidden="true" />
                <span className="pointer-events-none absolute start-1 top-1 h-5 w-5 rounded-full border-key border-edge bg-surface transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" aria-hidden="true" />
            </span>
        </div>
    );
}

/** − 2 + — a quantity stepper. */
export function Stepper({ value, onChange, min = 0, max = 10, label, disabled }) {
    return (
        <div className="inline-flex items-center rounded-chip border-key border-edge bg-surface" role="group" aria-label={label}>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-chip text-ink hover:bg-raised disabled:opacity-35" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label={t('Fewer')}>
                <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <output className="w-8 text-center font-mono text-[15px] font-medium tabular-nums text-ink" aria-live="polite">{value}</output>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-chip text-ink hover:bg-raised disabled:opacity-35" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label={t('More')}>
                <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}

export function Notice({ tone = 'info', children, className, icon: Icon }) {
    const map = {
        info: 'border-line bg-tint text-on-tint',
        warn: 'border-line bg-tint-2 text-on-tint-2',
        danger: 'border-danger/40 bg-danger/10 text-danger',
        success: 'border-success/40 bg-success/10 text-success',
    };
    return (
        <div className={cn('flex items-start gap-2.5 rounded-sm border px-4 py-3 text-sm font-medium', map[tone], className)} role={tone === 'danger' ? 'alert' : 'status'}>
            {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
            <div className="min-w-0">{children}</div>
        </div>
    );
}

/* ── Dialog / tabs ───────────────────────────────────────────────────────── */

export function Modal({ open, onClose, title, children, size = 'md', footer }) {
    if (!open) return null;
    return (
        <HDialog open onClose={onClose} className="relative z-[80]">
            <div className="fixed inset-0 bg-scrim/55" aria-hidden="true" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel className={cn('relative max-h-[92vh] w-full overflow-y-auto rounded-t-card border-key border-edge bg-surface p-6 text-body shadow-key sm:rounded-card', size === 'lg' ? 'max-w-xl' : 'max-w-md')}>
                    <button type="button" onClick={onClose} aria-label={t('Close')} className="absolute end-4 top-4 rounded-chip p-1.5 text-muted hover:bg-raised hover:text-ink">
                        <X className="h-5 w-5" />
                    </button>
                    {title && <DialogTitle className="pe-8 font-display text-2xl font-bold text-ink">{title}</DialogTitle>}
                    <div className={title ? 'mt-4' : ''}>{children}</div>
                    {footer && <div className="mt-6">{footer}</div>}
                </DialogPanel>
            </div>
        </HDialog>
    );
}

export function Tabs({ tabs, value, onChange, label, className }) {
    return (
        <div role="tablist" aria-label={label} className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    role="tab"
                    type="button"
                    id={`tab-${tab.value}`}
                    aria-selected={value === tab.value}
                    aria-controls={`panel-${tab.value}`}
                    onClick={() => onChange(tab.value)}
                    className={cn(
                        '-mb-px shrink-0 border-b-[3px] px-3.5 pb-3 pt-2 text-[15px] font-semibold transition-colors',
                        value === tab.value ? 'border-cta text-ink' : 'border-transparent text-muted hover:text-ink',
                    )}
                >
                    {tab.label}
                    {tab.count ? <span className="ms-1.5 font-mono text-xs text-muted">{tab.count}</span> : null}
                </button>
            ))}
        </div>
    );
}

export function CheckLine({ children }) {
    return (
        <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span>
            <span>{children}</span>
        </li>
    );
}
