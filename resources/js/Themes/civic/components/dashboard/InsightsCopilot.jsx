import { useState } from 'react';
import { router } from '@inertiajs/react';
import { MessageCircleQuestion, Quote } from 'lucide-react';
import { useAction, useDashboard } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { ConfirmDialog } from './kit';
import { AiUnavailableNotice } from './AiCards';
import { Button, Chip, Field, Input, Notice } from '../ui';

const ACTION_COPY = {
    release_next_tier: () => t('The next tier that is not on sale yet goes on sale now.'),
    create_promo_code: () => t('A 15%-off code is created for this event, valid for the next 24 hours. You can share or switch it off in Promote.'),
    boost_referral: () => t('Every referral link’s reward goes up by 5 points (at most 50%), or a first link is created.'),
    announce_waitlist: () => t('Opens the Announce composer with the waitlist selected. Nothing is sent until you press Send.'),
};

/**
 * The sales insights copilot: ask a question, read a short diagnosis built
 * from your own numbers, and run a suggested action — each one only after
 * you confirm it. `eventId` scopes the question (and is where actions apply).
 */
export default function InsightsCopilot({ eventId, compact = false }) {
    const { api, path, can, frame } = useDashboard();
    const { run, busy } = useAction();
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState(null);
    const [pending, setPending] = useState(null);

    const suggestions = [t('Why are sales slower than my last event?'), t('What should I do this week to sell more?'), t('Which channel brings the most guests?')];

    const ask = (q) => {
        const text = (q ?? question).trim();
        if (text.length < 3) return;
        setQuestion(text);
        run(() => api.org.post('/ai/insights', { question: text, ...(eventId ? { event_id: eventId } : {}) }), { key: 'ask' }).then((data) => data && setAnswer(data));
    };

    const confirm = () => {
        const action = pending;
        if (action.type === 'announce_waitlist') {
            setPending(null);
            router.visit(path(`/events/${eventId}/announce?compose=waitlist`));
            return;
        }
        run(() => api.org.post('/ai/insights/actions', { type: action.type, event_id: eventId }), {
            key: 'act', success: (d) => d.message, reload: ['event', 'data', 'tiles', 'frame'],
        }).then(() => setPending(null));
    };

    if (frame?.ai?.available === false) return <AiUnavailableNotice />;

    const allowed = (type) => (['create_promo_code', 'boost_referral'].includes(type) ? can.sales : can.edit);

    return (
        <div>
            <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Field label={t('Ask about your sales')} htmlFor="copilot-q" className="flex-1">
                    <Input id="copilot-q" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={suggestions[0]} maxLength={500} />
                </Field>
                <Button type="submit" variant="primary" icon={MessageCircleQuestion} loading={busy === 'ask'} disabled={question.trim().length < 3}>{t('Ask')}</Button>
            </form>
            {!answer && !compact && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((s) => <Chip key={s} onClick={() => ask(s)} className="h-9 text-[13px]">{s}</Chip>)}
                </div>
            )}

            {answer && (
                <div className="mt-4 space-y-3" aria-live="polite">
                    <p className="flex items-start gap-2 text-[15px] text-ink"><Quote className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />{answer.diagnosis || t('No clear answer from the numbers yet.')}</p>
                    {answer.findings?.length > 0 && (
                        <ul className="space-y-1.5 text-sm">
                            {answer.findings.map((f) => <li key={f.label}><span className="font-semibold text-ink">{f.label}.</span> <span className="text-body">{f.detail}</span></li>)}
                        </ul>
                    )}
                    {answer.actions?.length > 0 && (
                        <div>
                            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{t('Suggested — you decide')}</p>
                            <div className="flex flex-wrap gap-2">
                                {answer.actions.map((a) => (
                                    <Button key={a.type} size="sm" variant="secondary" disabled={!eventId || !allowed(a.type)} title={a.reason} onClick={() => setPending(a)}>{a.label || a.type}</Button>
                                ))}
                            </div>
                            {!eventId && <p className="mt-2 text-xs text-muted">{t('Open an event’s Insights tab to run these on it.')}</p>}
                        </div>
                    )}
                    {answer.credits && <p className="font-mono text-xs text-muted">{t(':n AI credits left this month', { n: answer.credits.remaining })}</p>}
                </div>
            )}

            <ConfirmDialog open={Boolean(pending)} onClose={() => setPending(null)} title={pending?.label || t('Run this?')} confirmLabel={pending?.type === 'announce_waitlist' ? t('Open the composer') : t('Do it')} onConfirm={confirm} busy={busy === 'act'} tone="primary">
                {pending?.reason && <Notice tone="info">{pending.reason}</Notice>}
                <p>{ACTION_COPY[pending?.type]?.()}</p>
            </ConfirmDialog>
        </div>
    );
}
