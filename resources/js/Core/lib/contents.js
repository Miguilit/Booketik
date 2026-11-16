import { useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { t } from '@/Core/i18n';

/*
 | Headless static page (Pages/Contents/Index) — privacy, terms, help, contact —
 | and the contact form some of those pages carry.
 */

/** Which admin-managed page slugs get the contact panel instead of prose. */
export const CONTACT_SLUGS = ['contact', 'contact-us'];

/** The contact form's single-line inputs (`label` is a translation key, `fallback` its default). */
export const CONTACT_FIELDS = [
    { name: 'name', label: 'full_name', get fallback() { return t('Your name'); }, type: 'text', placeholder: 'Jane Okonkwo' },
    { name: 'email', label: 'email', get fallback() { return t('Email'); }, type: 'email', placeholder: 'jane@example.com' },
];

/*
 * By slug, with the name as a fallback.
 *
 * This used to test `content.name.toLowerCase().includes('contact')` only —
 * so an operator who renamed the page to "Get in touch" lost the form, and
 * a page called "Contact tracing policy" grew one.
 */
export function isContactPage(content) {
    return CONTACT_SLUGS.includes(content.slug) || (content.name ?? '').toLowerCase().includes('contact');
}

/**
 * The page: sanitised body HTML, its title, and whether it shows the contact
 * panel (`isContact`) instead of plain prose.
 */
export function useContentPage() {
    const { content, contactSettings, translations = {} } = usePage().props;

    /*
     * Operator HTML, so it is sanitised — the same treatment the blog body
     * gets. This column is filled through a rich editor in the admin panel and
     * rendering it raw would make that editor a stored-XSS form on a page
     * carrying a member's session.
     */
    const html = useMemo(() => DOMPurify.sanitize(content.html_content ?? ''), [content.html_content]);

    const isContact = isContactPage(content);

    const title = translations[content.slug?.replace(/-/g, '_')] || content.name;

    return { content, contactSettings, translations, html, isContact, title };
}

/**
 * The contact form: client-side validation, POST /contact, server field errors.
 * Inputs must carry `name` = the field key (`name`, `email`, `message`) —
 * `handleChange` reads `event.target.name`.
 */
export function useContactForm({ translations = {} } = {}) {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: null }));
    };

    const validate = () => {
        const found = {};

        if (!formData.name.trim()) found.name = t('Please tell us your name.');
        if (!formData.email.trim()) found.email = t('Please give us an email address.');
        else if (!/\S+@\S+\.\S+/.test(formData.email)) found.email = t('That email does not look right.');
        if (!formData.message.trim()) found.message = t('Please write a message.');

        setErrors(found);

        return Object.keys(found).length === 0;
    };

    const submit = async (event) => {
        event.preventDefault();

        if (!validate() || sending) return;

        setSending(true);

        try {
            await axios.post('/contact', formData);
            setFormData({ name: '', email: '', message: '' });
            toast.success(translations.contact_form_success ?? t('Thanks — we will be in touch.'));
        } catch (error) {
            const fields = error.response?.data?.errors;

            if (fields) {
                setErrors(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v[0]])));
            } else {
                toast.error(t('Could not send that. Please try again.'));
            }
        } finally {
            setSending(false);
        }
    };

    return { formData, errors, sending, handleChange, submit, fields: CONTACT_FIELDS };
}
