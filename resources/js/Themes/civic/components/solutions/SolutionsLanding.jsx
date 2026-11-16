import React, { useState } from 'react';
import {
    ArrowRight, CalendarDays, Check, ChevronDown, CircleHelp, CreditCard,
    Globe2, HeartHandshake, MonitorSmartphone, QrCode, Sparkles, Ticket,
    Users, Armchair, ShieldCheck, Building2, ChartNoAxesCombined,
} from 'lucide-react';
import './solutions-landing.css';

/*
 | BOOKETIK Solutions — presentation-only React component.
 |
 | This component never quotes a price, creates an order, or grants an entitlement.
 | It renders only a published SERVER projection. Editing, versioning, pricing,
 | payment, claim verification and action eligibility belong to Laravel.
 | The caller must supply { sections, offers, locale } from the backend.
 |
 | R1A is NOT wired to an existing route; its deployment has no production effect.
 */

const COMPONENTS = new Set(['hero_aurora', 'value_bento', 'feature_story', 'pricing', 'faq', 'final_cta', 'editorial']);
const ICONS = {
    tickets: Ticket, calendar: CalendarDays, payment: CreditCard,
    qr: QrCode, people: Users, globe: Globe2, venue: Building2,
    seating: Armchair, stats: ChartNoAxesCombined, mission: HeartHandshake,
    mobile: MonitorSmartphone, shield: ShieldCheck, sparkle: Sparkles,
};

const WORDS = {
    fr: { unavailable: 'Cette action sera bientôt disponible', pricingUnavailable: 'Tarifs momentanément indisponibles',
        paymentSeparate: 'Frais du prestataire de paiement distincts, lorsqu’ils s’appliquent.',
        noSubscription: 'Les frais de billetterie varient selon la formule et le modèle choisis',
        offerFrom: 'Par événement', close: 'Fermer', faq: 'Questions fréquentes' },
    nl: { unavailable: 'Deze actie is binnenkort beschikbaar', pricingUnavailable: 'Tarieven momenteel niet beschikbaar',
        paymentSeparate: 'Eventuele kosten van de betalingsprovider worden afzonderlijk berekend.',
        noSubscription: 'Ticketkosten verschillen naargelang het gekozen abonnement of tariefmodel',
        offerFrom: 'Per evenement', close: 'Sluiten', faq: 'Veelgestelde vragen' },
    en: { unavailable: 'This action will be available soon', pricingUnavailable: 'Pricing temporarily unavailable',
        paymentSeparate: 'Payment-provider fees are separate where applicable.',
        noSubscription: 'Ticketing fees depend on the selected plan and pricing model',
        offerFrom: 'Per event', close: 'Close', faq: 'Frequently asked questions' },
};

const localeKey = (value) => (typeof value === 'string' ? value.toLowerCase().split(/[-_]/)[0] : 'en');
function phrase(value, locale) {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    const current = value[localeKey(locale)];
    return typeof current === 'string' && current.trim() !== ''
        ? current : (typeof value.en === 'string' ? value.en : '');
}
function wordsFor(locale) { return WORDS[localeKey(locale)] || WORDS.en; }
function safeHref(href) {
    if (typeof href !== 'string') return null;
    const trimmed = href.trim();
    if (/^\/(?!\/)[a-zA-Z0-9/_?=%&.#-]*$/.test(trimmed) || /^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmed)) return trimmed;
    if (/^https:\/\/[\w.-]+(?::443)?(?:\/[\w\-./?&=%#]*)?$/.test(trimmed)) return trimmed;
    return null;
}
function IconFor({ name, size = 21 }) {
    const Item = ICONS[name] ?? Sparkles;
    return <Item size={size} strokeWidth={1.9} aria-hidden="true" />;
}
function Cta({ cta, locale, primary = false, className = '' }) {
    if (!cta || typeof cta !== 'object') return null;
    const label = phrase(cta.label, locale);
    if (!label) return null;
    const href = cta.enabled === true ? safeHref(cta.href) : null;
    const style = `${primary ? 'bks-btn bks-btn-primary' : 'bks-btn bks-btn-secondary'} ${className}`;
    if (!href) return <span className={`${style} bks-btn-disabled`} title={wordsFor(locale).unavailable} aria-disabled="true">{label}</span>;
    return <a href={href} className={style} rel={href.startsWith('https://') ? 'noopener noreferrer' : undefined}>
        {label} <ArrowRight size={16} aria-hidden="true" />
    </a>;
}
function RevealHeading({ text, as: Tag = 'h2', className = '', id }) {
    return <Tag id={id} className={`bks-heading bks-reveal ${className}`}>{text}</Tag>;
}
function Hero({ section, locale }) {
    const c = section.content || {};
    const title = phrase(c.title, locale);
    return <section className="bks-hero" aria-label={title}>
        <div className="bks-aurora" aria-hidden="true"><i /><i /><i /></div>
        <div className="bks-hero-inner">
            {phrase(c.eyebrow, locale) && <p className="bks-eyebrow"><Sparkles size={14} aria-hidden="true" /> {phrase(c.eyebrow, locale)}</p>}
            <RevealHeading as="h1" text={title} className="bks-hero-title" />
            {phrase(c.description, locale) && <p className="bks-hero-subtitle">{phrase(c.description, locale)}</p>}
            <div className="bks-cta-row">{(c.ctas || []).slice(0, 2).map((cta, i) => <Cta key={i} cta={cta} locale={locale} primary={i === 0} />)}</div>
            {phrase(c.caption, locale) && <p className="bks-muted bks-small">{phrase(c.caption, locale)}</p>}
        </div>
    </section>;
}
function Bento({ section, locale }) {
    const c = section.content || {};
    return <section className="bks-section" aria-labelledby={`bks-title-${section.key}`}>
        <div className="bks-section-heading">
            {phrase(c.eyebrow, locale) && <p className="bks-eyebrow">{phrase(c.eyebrow, locale)}</p>}
            <RevealHeading id={`bks-title-${section.key}`} text={phrase(c.title, locale)} className="bks-section-title" />
            {phrase(c.description, locale) && <p className="bks-muted">{phrase(c.description, locale)}</p>}
        </div>
        <div className="bks-bento">{(c.items || []).slice(0, 8).map((item, i) =>
            <article key={item.key ?? i} className={`bks-panel bks-bento-card ${i === 0 ? 'bks-bento-lead' : ''}`}>
                <span className="bks-icon"><IconFor name={item.icon} /></span>
                <h3>{phrase(item.title, locale)}</h3>
                <p className="bks-muted">{phrase(item.description, locale)}</p>
            </article>)}</div>
    </section>;
}
function FeatureStory({ section, locale }) {
    const c = section.content || {};
    const items = (c.items || []).slice(0, 8);
    const [active, setActive] = useState(0);
    if (items.length === 0) return null;
    const selected = items[Math.min(active, items.length - 1)];
    return <section className="bks-section" aria-label={phrase(c.title, locale)}>
        <div className="bks-section-heading"><RevealHeading text={phrase(c.title, locale)} className="bks-section-title" /></div>
        <div className="bks-story-grid">
            <div className="bks-story-options" aria-label={phrase(c.title, locale)}>
                {items.map((item, i) => <button key={item.key ?? i} type="button"
                    aria-pressed={i === active}
                    onClick={() => setActive(i)} className={`bks-story-option ${active === i ? 'is-active' : ''}`}>
                    <span className="bks-icon"><IconFor name={item.icon} size={18} /></span>
                    <span><strong>{phrase(item.title, locale)}</strong><small>{phrase(item.description, locale)}</small></span>
                </button>)}
            </div>
            <div className="bks-story-sticky bks-panel" role="region" aria-live="polite" aria-label={phrase(selected.title, locale)}>
                <span className="bks-story-stage-icon"><IconFor name={selected.icon} size={42} /></span>
                <div><p className="bks-eyebrow">BOOKETIK</p><h3>{phrase(selected.title, locale)}</h3>
                    <p className="bks-muted">{phrase(selected.description, locale)}</p></div>
                {safeHref(selected.image) && <img className="bks-feature-media" src={selected.image} loading="lazy" alt={phrase(selected.imageAlt, locale) || ''} />}
            </div>
        </div>
    </section>;
}
function Pricing({ section, locale, offers }) {
    const c = section.content || {};
    const words = wordsFor(locale);
    const active = (Array.isArray(offers) ? offers : []).filter(o => o && o.visible === true && o.status === 'published')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 8);
    return <section className="bks-section" id="bks-pricing" aria-label={phrase(c.title, locale)}>
        <div className="bks-section-heading">
            <p className="bks-eyebrow">{phrase(c.eyebrow, locale)}</p>
            <RevealHeading id={`bks-title-${section.key}`} text={phrase(c.title, locale)} className="bks-section-title" />
            {phrase(c.description, locale) && <p className="bks-muted">{phrase(c.description, locale)}</p>}
        </div>
        {active.length === 0 ? <p className="bks-muted" role="status">{words.pricingUnavailable}</p> :
            <div className="bks-pricing-grid">{active.map((offer) => <article key={offer.key} className={`bks-panel bks-price-card ${offer.featured ? 'bks-price-featured' : ''}`}>
                <p className="bks-eyebrow">{phrase(offer.category, locale)}</p>
                <h3>{phrase(offer.title, locale)}</h3>
                <p className="bks-price" aria-label={`${phrase(offer.title, locale)} ${offer.price?.formatted ?? ''}`}>{offer.price?.formatted ?? '—'}</p>
                <p className="bks-muted bks-small">{words.offerFrom}</p>
                <p>{phrase(offer.description, locale)}</p>
                {Array.isArray(offer.features) && <ul className="bks-price-features">{offer.features.slice(0, 8).map((f, i) => <li key={i}><Check size={16} aria-hidden="true" />{phrase(f, locale)}</li>)}</ul>}
                <Cta cta={offer.cta} locale={locale} primary={offer.featured} className="bks-price-cta" />
            </article>)}</div>}
        <p className="bks-muted bks-pricing-disclaimer">{words.noSubscription}. {words.paymentSeparate}</p>
    </section>;
}
function FAQ({ section, locale }) {
    const c = section.content || {};
    return <section className="bks-section" aria-label={phrase(c.title, locale) || wordsFor(locale).faq}>
        <div className="bks-section-heading"><RevealHeading text={phrase(c.title, locale) || wordsFor(locale).faq} className="bks-section-title" /></div>
        <div className="bks-faq">{(c.items || []).slice(0, 20).map((item, i) => <details className="bks-faq-item" key={item.key ?? i}>
            <summary><CircleHelp size={18} aria-hidden="true" />{phrase(item.question, locale)}<ChevronDown size={17} className="bks-faq-chevron" aria-hidden="true" /></summary>
            <p className="bks-muted">{phrase(item.answer, locale)}</p>
        </details>)}</div>
    </section>;
}
function Editorial({ section, locale }) {
    const c = section.content || {};
    return <section className="bks-section bks-editorial" aria-label={phrase(c.title, locale)}>
        <p className="bks-eyebrow">{phrase(c.eyebrow, locale)}</p><RevealHeading text={phrase(c.title, locale)} className="bks-section-title" />
        <p className="bks-muted">{phrase(c.description, locale)}</p><Cta cta={c.cta} locale={locale}/>
    </section>;
}
function FinalCTA({ section, locale }) {
    const c = section.content || {};
    return <section className="bks-section bks-final-cta" aria-label={phrase(c.title, locale)}>
        <span className="bks-icon"><HeartHandshake /></span>
        <RevealHeading text={phrase(c.title, locale)} className="bks-section-title" />
        <p>{phrase(c.description, locale)}</p>
        <div className="bks-cta-row"><Cta cta={c.cta} locale={locale} primary /></div>
    </section>;
}
const RENDERERS = {
    hero_aurora: Hero, value_bento: Bento, feature_story: FeatureStory,
    pricing: Pricing, faq: FAQ, final_cta: FinalCTA, editorial: Editorial,
};

/** Stable public contract shared by React now and Flutter native later. */
export default function SolutionsLanding({ page, previewMode = false }) {
    const safe = page && page.schema_version === 1 && (
        page.publication_status === 'published' || (previewMode === true && page.publication_status === 'preview')
    );
    if (!safe) return null; // Never expose drafts or a fabricated default price.
    const locale = localeKey(page.locale);
    const sections = (Array.isArray(page.sections) ? page.sections : [])
        .filter(x => x && x.enabled === true && COMPONENTS.has(x.type))
        .sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 24);
    return <main className="bks-solutions" id="booketik-solutions" lang={locale}>
        {sections.map((section) => {
            const Component = RENDERERS[section.type];
            return <Component key={section.key} section={section} locale={locale} offers={page.offers || []}/>;
        })}
    </main>;
}

export { phrase as localizeSolutionsText, safeHref as safeSolutionsHref };
