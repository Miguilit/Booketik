import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/Core/lib/format';
import { t } from '@/Core/i18n';

/**
 * The sheet every payment dialog sits in: a bottom sheet on a phone, a
 * sticker card from `sm` up, over a plain ink scrim. Headless UI's Dialog
 * traps focus and closes on Esc; a dialog with no `onClose` (mid-payment)
 * cannot be dismissed.
 */
export default function PaymentModal({ title, subtitle = null, onClose, children, size = 'md', labelId = 'payment-modal-title' }) {
    return (
        <Dialog open onClose={onClose ?? (() => {})} className="relative z-[80]">
            <div className="fixed inset-0 bg-scrim/55" aria-hidden="true" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel
                    className={cn(
                        'max-h-[92vh] w-full overflow-y-auto rounded-t-card border-key border-edge bg-surface p-6 font-sans text-body shadow-key sm:rounded-card',
                        size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-md',
                    )}
                >
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <DialogTitle id={labelId} className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink">
                                {title}
                            </DialogTitle>
                            {subtitle && <Description className="mt-1 text-sm text-muted">{subtitle}</Description>}
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={t('Close')}
                                className="-me-1.5 -mt-1 shrink-0 rounded-chip p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                    {children}
                </DialogPanel>
            </div>
        </Dialog>
    );
}
