/** Opening the sign-in / register / verify-email dialogs, and gating actions on an account. */
export * from './lib/auth/authDialog';
export { default as useCaptchaWidget } from './lib/auth/useCaptchaWidget';

/** The global auth dialog (sign in / register / forgot / reset — the site has no auth pages) and the verify-email code dialog. */
export {
    AUTH_ALT_MODE,
    AUTH_ENDPOINTS,
    AUTH_FIELDS,
    VERIFY_CODE_LENGTH,
    useAuthModal,
    useVerifyEmail,
} from './lib/auth';

/** Social sign-in (Google / Facebook) availability and links. */
export { SOCIAL_PROVIDERS, useSocialProviders } from './lib/auth';

/** Account ▸ Sign-in & security: email confirmation, password, connected providers. */
export {
    announceFlash,
    useAccountSecurity,
    useConnectedAccounts,
    usePasswordChange,
} from './lib/auth';
