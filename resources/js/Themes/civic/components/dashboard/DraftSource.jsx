import { useRef, useState } from 'react';
import { ClipboardPaste, ImageUp, Link2, PenLine } from 'lucide-react';
import { t } from '@/Core/i18n';
import { Button, Card, cn, Field, Input, Notice, Textarea } from '../ui';

const MODES = [
    { key: 'text', icon: ClipboardPaste, label: () => t('Paste text') },
    { key: 'image', icon: ImageUp, label: () => t('Upload a flyer') },
    { key: 'url', icon: Link2, label: () => t('From a link') },
];

/**
 * The wizard's first step: give the AI something to read — a WhatsApp
 * message, a flyer photo or a page link — or skip it and start blank.
 */
export default function DraftSource({ onDraft, onBlank, busy, credits }) {
    const [mode, setMode] = useState('text');
    const [text, setText] = useState('');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const input = useRef(null);

    const pick = (f) => {
        if (!f) return;
        if (f.size > 8 * 1024 * 1024) {
            window.alert(t('That image is over 8 MB. Try a smaller photo or a screenshot.'));
            return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const ready = (mode === 'text' && text.trim().length >= 20) || (mode === 'image' && file) || (mode === 'url' && /^https?:\/\/.+\..+/.test(url.trim()));

    const submit = (e) => {
        e.preventDefault();
        if (!ready) return;
        onDraft(mode === 'image' ? { file, text: text.trim() || undefined } : mode === 'url' ? { url: url.trim() } : { text: text.trim() });
    };

    return (
        <Card sticker className="p-5 sm:p-7">
            <h2 className="font-display text-[24px] font-bold text-ink">{t('Start from what you already have')}</h2>
            <p className="mt-1 text-[15px] text-muted">{t('Paste the announcement, drop the flyer or link the page. The draft opens filled in; anything the reader was unsure of is marked for you to check. Nothing is published.')}</p>

            <div role="tablist" aria-label={t('Source')} className="mt-5 flex flex-wrap gap-2">
                {MODES.map((m) => (
                    <button key={m.key} type="button" role="tab" aria-selected={mode === m.key} onClick={() => setMode(m.key)}
                        className={cn('inline-flex h-11 items-center gap-2 rounded-chip border-key px-4 text-[15px] font-semibold', mode === m.key ? 'border-edge bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-edge')}>
                        <m.icon className="h-4 w-4" aria-hidden="true" />{m.label()}
                    </button>
                ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
                {mode === 'text' && (
                    <Field label={t('The event, as you would post it')} htmlFor="draft-text" hint={<span className="font-mono text-xs text-muted">{text.length}/8000</span>}>
                        <Textarea id="draft-text" rows={8} maxLength={8000} value={text} onChange={(e) => setText(e.target.value)}
                            placeholder={t('e.g. Saturday 21 Nov, 19:00 till late at Klunkerkranich, Karl-Marx-Str. 66. Early bird €12 (80), door €18. 18+.')} />
                    </Field>
                )}
                {mode === 'image' && (
                    <div>
                        <div
                            className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-line bg-raised/40 p-5 text-center hover:border-edge"
                            onClick={() => input.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
                        >
                            {preview ? <img src={preview} alt={t('The flyer')} className="max-h-64 rounded-sm" /> : <ImageUp className="h-8 w-8 text-muted" aria-hidden="true" />}
                            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); input.current?.click(); }}>{file ? t('Choose another') : t('Choose an image')}</Button>
                            <p className="text-xs text-muted">{t('JPG, PNG, WebP or HEIC, up to 8 MB. A screenshot of a post works too.')}</p>
                        </div>
                        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" aria-label={t('Flyer image')} onChange={(e) => pick(e.target.files?.[0])} />
                        <Field label={t('Anything the flyer does not say (optional)')} htmlFor="draft-notes" className="mt-4">
                            <Input id="draft-notes" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('e.g. 120 places, free for members')} />
                        </Field>
                    </div>
                )}
                {mode === 'url' && (
                    <Field label={t('Link to the event page')} htmlFor="draft-url">
                        <Input id="draft-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
                    </Field>
                )}

                {credits && credits.remaining < 5 && <Notice tone="warn">{t(':n AI credits left this month.', { n: credits.remaining })}</Notice>}

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" variant="cta" icon={PenLine} loading={busy} disabled={!ready}>{t('Draft it')}</Button>
                    <Button variant="ghost" onClick={onBlank}>{t('Start blank instead')}</Button>
                </div>
            </form>
        </Card>
    );
}
