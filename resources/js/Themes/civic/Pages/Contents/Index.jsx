import { Mail, MapPin, Phone } from 'lucide-react';
import { Head } from '@inertiajs/react';
import { layout } from '@/Themes/civic/Layout';
import { buttonClass, Container, FIELD } from '@/Themes/civic/components/ui';
import { CONTACT_FIELDS, useContactForm, useContentPage } from '@/Core/lib/contents';
import { t } from '@/Core/i18n';

/**
 * A static page — privacy, terms, help, contact. The body is operator HTML,
 * sanitised by `useContentPage()` and set in `.cv-prose` at a reading measure.
 * The contact slug adds the details and the form (`useContactForm()`).
 */

const FIELDS = CONTACT_FIELDS;

export default function Index() {
    const { contactSettings, translations, html, isContact, title } = useContentPage();
    const { formData, errors, sending, handleChange, submit } = useContactForm({ translations });

    const FIELD_LABELS = { name: t('Your name'), email: t('Email') };

    const field = FIELD;

    return (
        <>
            <Head title={title} />
            <Container className="pb-10 pt-10">
                <h1 className="mb-8 max-w-3xl font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[56px]">{title}</h1>

                {!isContact && (
                    <article
                        className="cv-prose max-w-[72ch]"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                )}

                {isContact && (
                    <div className="grid gap-10 lg:grid-cols-2">
                        <div>
                            {html ? (
                                <article
                                    className="cv-prose"
                                    dangerouslySetInnerHTML={{ __html: html }}
                                />
                            ) : null}

                            <div className="mt-8 space-y-5">
                                {contactSettings?.address_status ? (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactSettings.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-3 rounded-sm text-body hover:text-ink hover:underline"
                                    >
                                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-link" aria-hidden="true" />
                                        <span>{contactSettings.address}</span>
                                    </a>
                                ) : null}

                                {contactSettings?.email_status ? (
                                    <a
                                        href={`mailto:${contactSettings.email}`}
                                        className="flex items-start gap-3 rounded-sm text-body hover:text-ink hover:underline"
                                    >
                                        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-link" aria-hidden="true" />
                                        <span>{contactSettings.email}</span>
                                    </a>
                                ) : null}

                                {contactSettings?.phone_status ? (
                                    <a
                                        href={`tel:${contactSettings.phone}`}
                                        className="flex items-start gap-3 rounded-sm text-body hover:text-ink hover:underline"
                                    >
                                        <Phone className="mt-0.5 h-5 w-5 shrink-0 text-link" aria-hidden="true" />
                                        <span>{contactSettings.phone}</span>
                                    </a>
                                ) : null}
                            </div>
                        </div>

                        <div className="rounded-card border-key border-edge bg-surface p-6 shadow-key sm:p-8">
                            <h2 className="mb-5 font-display text-2xl font-bold text-ink">
                                {translations.contact_form_title ?? t('Send us a message')}
                            </h2>

                            <form onSubmit={submit} className="space-y-5" noValidate>
                                {FIELDS.map((input) => (
                                    <div key={input.name}>
                                        <label
                                            htmlFor={input.name}
                                            className="mb-1.5 block text-sm font-semibold text-ink"
                                        >
                                            {translations[input.label] ?? FIELD_LABELS[input.name] ?? input.fallback}
                                        </label>
                                        <input
                                            id={input.name}
                                            // The attribute whose absence broke this form.
                                            name={input.name}
                                            type={input.type}
                                            value={formData[input.name]}
                                            onChange={handleChange}
                                            placeholder={input.placeholder}
                                            className={field}
                                        />
                                        {errors[input.name] ? (
                                            <p className="mt-1 text-sm font-medium text-danger" role="alert">{errors[input.name]}</p>
                                        ) : null}
                                    </div>
                                ))}

                                <div>
                                    <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-ink">
                                        {translations.message ?? t('Message')}
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={6}
                                        value={formData.message}
                                        onChange={handleChange}
                                        className={`${field} form-textarea`}
                                    />
                                    {errors.message ? (
                                        <p className="mt-1 text-sm font-medium text-danger" role="alert">{errors.message}</p>
                                    ) : null}
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className={buttonClass({ variant: 'cta', size: 'lg', block: true })}
                                >
                                    {sending
                                        ? t('Sending…')
                                        : (translations.contact_form_button_text ?? t('Send message'))}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </Container>
        </>
    );
}

Index.layout = layout;
