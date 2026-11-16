import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowUp, Check, LoaderCircle, X } from 'lucide-react';
import { errorMessage, useAction, useDashboard } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { ConfirmDialog } from './kit';
import { AiUnavailableNotice, useAiAvailable } from './AiCards';
import { Button, Chip, cn, Input, Notice } from '../ui';

/*
 | The sales assistant: a floating agent button (only on pages that have the
 | Sales insights card), a right-hand chat panel, and the card's question
 | box — all three share one conversation through <InsightsAgentProvider>.
 |
 | The question runs as a queued task (Upstash QStash in production, a
 | database worker locally). The panel polls it and shows each read-only
 | tool as the agent actually runs it, then the answer.
 */

const STEPS = {
    list_events: () => t('Looking at your events'),
    funnel: () => t('Checking views, checkouts and sales'),
    velocity: () => t('Measuring how fast tickets sell'),
    past_events: () => t('Comparing with your past events'),
    attribution: () => t('Finding where guests come from'),
    tier_sell_through: () => t('Reading ticket tiers'),
};

const ACTION_COPY = {
    release_next_tier: () => t('The next tier that is not on sale yet goes on sale now.'),
    create_promo_code: () => t('A 15%-off code is created for this event, valid for the next 24 hours. You can share or switch it off in Promote.'),
    boost_referral: () => t('Every referral link’s reward goes up by 5 points (at most 50%), or a first link is created.'),
    announce_waitlist: () => t('Opens the Announce composer with the waitlist selected. Nothing is sent until you press Send.'),
};

export const suggestions = () => [
    t('Why are sales slower than my last event?'),
    t('What should I do this week to sell more?'),
    t('Which channel brings the most guests?'),
];

const AgentContext = createContext(null);

export function useInsightsAgent() {
    return useContext(AgentContext);
}

/** Wrap a page that shows Sales insights. `event` scopes questions and actions. */
export function InsightsAgentProvider({ event, children }) {
    const { api, path, can } = useDashboard();
    const { run, busy } = useAction();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [working, setWorking] = useState(false);
    const [pending, setPending] = useState(null);

    const [live, setLive] = useState([]);

    // The question runs in the queue; follow it until it is done or failed.
    const follow = async (id) => {
        const started = Date.now();
        for (let n = 0; ; n++) {
            await new Promise((r) => setTimeout(r, n < 5 ? 1000 : 2000));
            const task = await api.org.get(`/ai/tasks/${id}`);
            setLive(task.steps ?? []);
            if (task.status === 'done') return task.result;
            if (task.status === 'failed') throw { code: task.error?.code, message: task.error?.message };
            // Still waiting for a worker after 30 s: the queue isn't running.
            if (task.status === 'queued' && Date.now() - started > 30000) throw { code: 'AI_FAILED', message: t('The assistant is busy right now. Try again in a minute.') };
            if (Date.now() - started > 180000) throw { code: 'AI_FAILED', message: t('That took too long. Try again in a moment.') };
        }
    };

    const ask = async (question) => {
        const text = (question ?? '').trim();
        if (text.length < 3 || working) return;
        setOpen(true);
        setMessages((m) => [...m, { role: 'user', text }]);
        setLive([]);
        setWorking(true);
        try {
            const task = await api.org.post('/ai/insights/tasks', { question: text, ...(event?.id ? { event_id: event.id } : {}) });
            const answer = task.status === 'done' ? task.result : await follow(task.id);
            setMessages((m) => [...m, { role: 'assistant', answer }]);
        } catch (error) {
            setMessages((m) => [...m, { role: 'error', text: errorMessage(error) }]);
        } finally {
            setWorking(false);
        }
    };

    const confirm = async () => {
        const action = pending;
        if (action.type === 'announce_waitlist') {
            setPending(null);
            router.visit(path(`/events/${event.id}/announce?compose=waitlist`));
            return;
        }
        const done = await run(() => api.org.post('/ai/insights/actions', { type: action.type, event_id: event.id }), {
            key: 'act', success: (d) => d.message, reload: ['event', 'data', 'tiles', 'frame'],
        });
        if (done) {
            setPending(null);
            setMessages((m) => [...m, { role: 'done', text: done.message ?? t('Done.') }]);
        }
    };

    const allowed = (type) => (['create_promo_code', 'boost_referral'].includes(type) ? can.sales : can.edit);

    const value = { open, setOpen, messages, working, live, ask, event, allowed, setPending, busy };

    return (
        <AgentContext.Provider value={value}>
            {children}
            {can.edit && (
                <>
                    <AgentFab />
                    <AgentPanel />
                    <ConfirmDialog
                        open={Boolean(pending)}
                        onClose={() => setPending(null)}
                        title={pending?.label || t('Run this?')}
                        confirmLabel={pending?.type === 'announce_waitlist' ? t('Open the composer') : t('Do it')}
                        onConfirm={confirm}
                        busy={busy === 'act'}
                        tone="primary"
                    >
                        {pending?.reason && <Notice tone="info">{pending.reason}</Notice>}
                        <p>{ACTION_COPY[pending?.type]?.()}</p>
                    </ConfirmDialog>
                </>
            )}
        </AgentContext.Provider>
    );
}

/** The Eventgoo "oo" as a living mark: two rings that breathe, and orbit while working. */
function AgentMark({ working, className }) {
    return (
        <svg viewBox="0 0 40 24" className={cn('eg-agent-mark', working && 'is-working', className)} aria-hidden="true">
            <circle className="eg-agent-ring eg-agent-ring-a" cx="12" cy="12" r="7.5" fill="none" strokeWidth="3.5" />
            <circle className="eg-agent-ring eg-agent-ring-b" cx="28" cy="12" r="7.5" fill="none" strokeWidth="3.5" />
            <circle className="eg-agent-dot" cx="12" cy="4.5" r="2" />
        </svg>
    );
}

function AgentFab() {
    const agent = useInsightsAgent();
    return (
        <button
            type="button"
            onClick={() => agent.setOpen(true)}
            tabIndex={agent.open ? -1 : 0}
            aria-hidden={agent.open || undefined}
            className={cn(
                'eg-agent-fab fixed bottom-5 end-5 z-40 flex h-14 items-center gap-2 rounded-full border-key border-edge bg-ink ps-4 pe-5 text-bg shadow-key transition-[transform,opacity] duration-300 ease-out hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none',
                agent.open && 'pointer-events-none translate-y-2 scale-90 opacity-0',
            )}
            aria-label={t('Open the sales assistant')}
        >
            <AgentMark working={agent.working} className="h-6 w-10 text-bg" />
            <span className="text-sm font-semibold">{t('Sales assistant')}</span>
            {agent.messages.length > 0 && <span className="h-2 w-2 rounded-full bg-cta" aria-hidden="true" />}
        </button>
    );
}

function AgentPanel() {
    const agent = useInsightsAgent();
    const aiAvailable = useAiAvailable();
    const [draft, setDraft] = useState('');
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [agent.messages.length, agent.working]);

    const send = (q) => {
        agent.ask(q ?? draft);
        setDraft('');
    };

    return (
        <Dialog open={agent.open} onClose={() => agent.setOpen(false)} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-scrim/30 transition-opacity duration-300 ease-out data-[closed]:opacity-0 data-[leave]:duration-200 data-[leave]:ease-in motion-reduce:transition-none"
            />
            <DialogPanel
                transition
                className="fixed inset-y-0 end-0 flex w-full max-w-[440px] flex-col border-s-key border-edge bg-bg shadow-key transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[closed]:translate-x-full rtl:data-[closed]:-translate-x-full data-[leave]:duration-200 data-[leave]:ease-in motion-reduce:transition-none"
            >
                <header className="flex items-center gap-3 border-b border-line px-5 py-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-bg">
                        <AgentMark working={agent.working} className="h-5 w-8" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <DialogTitle className="font-display text-lg font-bold text-ink">{t('Sales assistant')}</DialogTitle>
                        <p className="truncate text-xs text-muted">{agent.event?.title ? t('About :title', { title: agent.event.title }) : t('About all your events')}</p>
                    </div>
                    <button type="button" onClick={() => agent.setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-chip text-ink hover:bg-raised" aria-label={t('Close')}>
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
                    {!aiAvailable ? (
                        <AiUnavailableNotice />
                    ) : agent.messages.length === 0 && !agent.working ? (
                        <div>
                            <p className="text-[15px] text-body">{t('Ask anything about your sales. Answers come from your own numbers, and suggested actions only run when you confirm them.')}</p>
                            <div className="mt-4 flex flex-col items-start gap-2">
                                {suggestions().map((s) => <Chip key={s} onClick={() => send(s)} className="h-auto py-2 text-start text-[13px]">{s}</Chip>)}
                            </div>
                        </div>
                    ) : (
                        <ol className="space-y-4">
                            {agent.messages.map((m, i) => <Message key={i} message={m} />)}
                            {agent.working && <Progress />}
                        </ol>
                    )}
                    <div ref={endRef} />
                </div>

                {aiAvailable && (
                    <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t border-line px-4 py-3">
                        <label htmlFor="agent-q" className="sr-only">{t('Your question')}</label>
                        <Input id="agent-q" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('Ask about your sales')} maxLength={500} className="flex-1" />
                        <Button type="submit" variant="cta" icon={ArrowUp} disabled={draft.trim().length < 3 || agent.working} aria-label={t('Send')} />
                    </form>
                )}
            </DialogPanel>
        </Dialog>
    );
}

function Message({ message }) {
    const agent = useInsightsAgent();
    if (message.role === 'user') {
        return (
            <li className="flex justify-end">
                <p className="max-w-[85%] rounded-card rounded-ee-sm bg-ink px-4 py-2.5 text-[15px] text-bg">{message.text}</p>
            </li>
        );
    }
    if (message.role === 'error' || message.role === 'done') {
        return <li><Notice tone={message.role === 'error' ? 'danger' : 'success'}>{message.text}</Notice></li>;
    }
    const a = message.answer;
    return (
        <li className="space-y-3">
            {a.steps?.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label={t('What the assistant checked')}>
                    {a.steps.map((s) => (
                        <li key={s} className="inline-flex items-center gap-1 rounded-chip bg-raised px-2.5 py-1 text-[12px] text-muted">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            {STEPS[s]?.() ?? s}
                        </li>
                    ))}
                </ul>
            )}
            <div className="rounded-card rounded-es-sm border-key border-edge bg-surface p-4">
                <p className="text-[15px] leading-relaxed text-ink">{a.diagnosis || t('No clear answer from the numbers yet.')}</p>
                {a.findings?.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm">
                        {a.findings.map((f) => <li key={f.label}><span className="font-semibold text-ink">{f.label}.</span> <span className="text-body">{f.detail}</span></li>)}
                    </ul>
                )}
            </div>
            {a.actions?.length > 0 && (
                <div>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{t('Suggested — you decide')}</p>
                    <div className="flex flex-col gap-2">
                        {a.actions.map((x) => (
                            <button
                                key={x.type}
                                type="button"
                                disabled={!agent.event?.id || !agent.allowed(x.type)}
                                onClick={() => agent.setPending(x)}
                                className="rounded-card border-key border-edge bg-surface px-4 py-3 text-start transition-colors hover:bg-raised disabled:opacity-50"
                            >
                                <span className="block text-sm font-semibold text-ink">{x.label || x.type}</span>
                                {x.reason && <span className="mt-0.5 block text-xs text-muted">{x.reason}</span>}
                            </button>
                        ))}
                    </div>
                    {!agent.event?.id && <p className="mt-2 text-xs text-muted">{t('Open an event’s Insights tab to run these on it.')}</p>}
                </div>
            )}
            {a.credits && <p className="font-mono text-xs text-muted">{t(':n AI credits left this month', { n: a.credits.remaining })}</p>}
        </li>
    );
}

/** Live progress: the tools the agent has actually run so far, then what it is doing now. */
function Progress() {
    const { live } = useInsightsAgent();
    return (
        <li className="rounded-card border border-line bg-surface p-4" role="status">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                <AgentMark working className="h-4 w-7 text-ink" />
                {t('Working on it…')}
            </p>
            <ul className="space-y-1.5 text-sm">
                {live.map((key) => (
                    <li key={key} className="flex items-center gap-2 text-muted">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        {STEPS[key]?.() ?? key}
                    </li>
                ))}
                <li className="flex items-center gap-2 text-ink">
                    <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    {live.length === 0 ? t('Reading your question') : t('Writing the answer')}
                </li>
            </ul>
        </li>
    );
}

/** The card's question box: asking opens the panel and answers there. */
export function AskInsightsCard() {
    const agent = useInsightsAgent();
    const aiAvailable = useAiAvailable();
    const [q, setQ] = useState('');
    if (!aiAvailable) return <AiUnavailableNotice />;
    return (
        <div>
            <form onSubmit={(e) => { e.preventDefault(); agent.ask(q); setQ(''); }} className="flex items-end gap-2">
                <label htmlFor="copilot-q" className="sr-only">{t('Ask about your sales')}</label>
                <Input id="copilot-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={suggestions()[0]} maxLength={500} className="flex-1" />
                <Button type="submit" variant="primary" icon={ArrowUp} disabled={q.trim().length < 3} aria-label={t('Ask')}>{t('Ask')}</Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
                {suggestions().map((s) => <Chip key={s} onClick={() => agent.ask(s)} className="h-9 text-[13px]">{s}</Chip>)}
            </div>
        </div>
    );
}
