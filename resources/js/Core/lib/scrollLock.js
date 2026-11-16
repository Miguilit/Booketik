/**
 * Page scroll lock for overlays, counted so nested dialogs compose: the page
 * unlocks only when the last overlay that locked it lets go. The scrollbar's
 * width is padded back so the page does not shift sideways as it disappears.
 *
 * Returns the unlock function — call it exactly once.
 */
let locks = 0;
let saved = null;

export function lockScroll() {
    if (typeof document === 'undefined') return () => {};

    if (locks === 0) {
        const body = document.body;
        const gap = window.innerWidth - document.documentElement.clientWidth;
        saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
        body.style.overflow = 'hidden';
        if (gap > 0) body.style.paddingRight = `${gap}px`;
    }
    locks += 1;

    let released = false;
    return () => {
        if (released) return;
        released = true;
        locks = Math.max(0, locks - 1);

        if (locks === 0 && saved) {
            document.body.style.overflow = saved.overflow;
            document.body.style.paddingRight = saved.paddingRight;
            saved = null;
        }
    };
}
