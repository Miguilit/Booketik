import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { layout } from '@/Themes/civic/Layout';

const WORDS = {
    fr: {
        title: 'Demandes BOOKETIK', discovery: 'Demander BOOKETIK Découverte', quote: 'Demander un devis',
        subtitle: 'Présentez votre projet. Notre équipe étudiera votre demande.',
        organizer: 'Votre organisation', event: 'Événement', eventOptional: 'Événement concerné (facultatif)',
        chooseEvent: 'Choisir un événement', anyEvent: 'Demande générale (sans événement)',
        noEvents: 'Aucun événement disponible pour cette organisation.',
        note: 'Votre message (facultatif)', select: 'Choisir une organisation',
        submit: 'Envoyer la demande', sending: 'Envoi…',
        none: 'Aucune organisation disponible avec les droits requis.',
        done: 'Merci, votre demande a été reçue.', back: 'Retour',
        privacy: 'Vos informations sont utilisées uniquement pour traiter votre demande.',
    },
    nl: {
        title: 'BOOKETIK-aanvragen', discovery: 'BOOKETIK Ontdekking aanvragen', quote: 'Een offerte aanvragen',
        subtitle: 'Vertel ons over uw project. Ons team bekijkt uw aanvraag.',
        organizer: 'Uw organisatie', event: 'Evenement', eventOptional: 'Evenement (optioneel)',
        chooseEvent: 'Kies een evenement', anyEvent: 'Algemene aanvraag (zonder evenement)',
        noEvents: 'Geen evenementen beschikbaar voor deze organisatie.',
        note: 'Uw bericht (optioneel)', select: 'Kies een organisatie',
        submit: 'Aanvraag verzenden', sending: 'Verzenden…',
        none: 'Geen organisatie beschikbaar met de vereiste rechten.',
        done: 'Bedankt, uw aanvraag is ontvangen.', back: 'Terug',
        privacy: 'Uw gegevens worden uitsluitend gebruikt om uw aanvraag te behandelen.',
    },
    en: {
        title: 'BOOKETIK requests', discovery: 'Request BOOKETIK Discovery', quote: 'Request a quote',
        subtitle: 'Tell us about your project. Our team will review your request.',
        organizer: 'Your organization', event: 'Event', eventOptional: 'Related event (optional)',
        chooseEvent: 'Choose an event', anyEvent: 'General inquiry (no event)',
        noEvents: 'No events available for this organization.',
        note: 'Your message (optional)', select: 'Choose an organization',
        submit: 'Submit request', sending: 'Sending…',
        none: 'No organization available with the required permissions.',
        done: 'Thank you, your request has been received.', back: 'Back',
        privacy: 'Your information is only used to process your request.',
    },
};

export default function SolutionsInquiry({ inquiryForm = {} }) {
    const locale = ['fr', 'nl', 'en'].includes(inquiryForm.locale) ? inquiryForm.locale : 'en';
    const t = WORDS[locale];
    const kind = inquiryForm.kind === 'discovery_review' ? 'discovery_review' : 'quote';
    const orgs = Array.isArray(inquiryForm.organizers) ? inquiryForm.organizers : [];
    const events = Array.isArray(inquiryForm.events) ? inquiryForm.events : [];
    const initialOrg = orgs[0]?.id || '';
    const initialEvent = events.some(e => e.organizerId === initialOrg && e.id === inquiryForm.eventId)
        ? inquiryForm.eventId : '';
    const [submitted, setSubmitted] = useState(false);
    const form = useForm({
        organizer_id: initialOrg,
        kind,
        request_key: inquiryForm.requestKey || '',
        event_id: initialEvent,
        offer_code: kind === 'discovery_review' ? 'decouverte' : (inquiryForm.offerCode || ''),
        message: '',
    });
    const matchingEvents = events.filter(e => e.organizerId === form.data.organizer_id);
    const selectedEventValid = matchingEvents.some(e => e.id === form.data.event_id);
    const preview = inquiryForm.previewMode === true;
    const canSend = !preview && inquiryForm.submissionEnabled === true && orgs.length > 0
        && form.data.organizer_id !== '' &&
        (kind !== 'discovery_review' || selectedEventValid) &&
        (!form.data.event_id || selectedEventValid);
    const send = (e) => {
        e.preventDefault();
        if (!canSend || form.processing || submitted) return;
        form.post(inquiryForm.submissionUrl, { preserveScroll: true, onSuccess: () => setSubmitted(true) });
    };
    const changeOrganizer = (value) => {
        form.setData(current => ({ ...current, organizer_id: value, event_id: '' }));
    };
    const field = 'mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-line bg-raised px-3 py-2 text-ink';
    const eventRequired = kind === 'discovery_review';
    return <main className="mx-auto max-w-2xl px-4 py-10 text-ink md:py-14">
        <Head title={kind === 'quote' ? t.quote : t.discovery} />
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
            <div className="mb-5 text-sm font-semibold text-muted">{t.title}</div>
            <h1 className="font-display text-3xl font-extrabold leading-tight">{kind === 'quote' ? t.quote : t.discovery}</h1>
            <p className="mt-3 text-body">{t.subtitle}</p>
            {submitted ? <div role="status" className="mt-8 flex items-start gap-3 rounded-xl border border-line bg-raised p-4"><CheckCircle2 size={23}/>{t.done}</div>
            : <form onSubmit={send} className="mt-7 space-y-5">
                <label className="block text-sm font-semibold">{t.organizer}
                    <select className={field} value={form.data.organizer_id} required onChange={e => changeOrganizer(e.target.value)}>
                        <option value="">{t.select}</option>
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </label>
                {orgs.length === 0 && <p role="status" className="text-sm text-muted">{t.none}</p>}
                {(eventRequired || matchingEvents.length > 0) && form.data.organizer_id !== '' &&
                    <div>
                        <label className="block text-sm font-semibold" htmlFor="booketik-inquiry-event">
                            {eventRequired ? t.event : t.eventOptional}
                        </label>
                        <select id="booketik-inquiry-event" className={field} value={form.data.event_id}
                            required={eventRequired} onChange={e => form.setData('event_id', e.target.value)}>
                            <option value="">{eventRequired ? t.chooseEvent : t.anyEvent}</option>
                            {matchingEvents.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
                        </select>
                        {eventRequired && matchingEvents.length === 0 &&
                            <p role="status" className="mt-2 text-sm text-muted">{t.noEvents}</p>}
                    </div>}
                <label className="block text-sm font-semibold">{t.note}
                    <textarea rows={4} maxLength={2000} className={field} value={form.data.message}
                        onChange={e => form.setData('message', e.target.value)} />
                </label>
                {Object.keys(form.errors).length > 0 && <div role="alert" className="rounded-xl border border-line p-3 text-sm text-danger">{Object.values(form.errors).join(' · ')}</div>}
                <button type="submit" disabled={!canSend || form.processing || submitted}
                    className="min-h-11 w-full rounded-xl bg-ink px-5 py-3 font-bold text-bg disabled:opacity-50">
                    {form.processing ? t.sending : t.submit}
                </button>
            </form>}
            <p className="mt-5 text-xs text-muted">{t.privacy}</p>
            <a className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline"
                href={inquiryForm.backUrl || `/${locale}/organizer/dashboard`}><ArrowLeft size={15}/>{t.back}</a>
        </div>
    </main>;
}
SolutionsInquiry.layout = layout;
