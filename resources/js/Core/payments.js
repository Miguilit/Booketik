/** Payment flows: upgrade/success dialogs, hosted checkout, celebration, settlement. */
export * from './lib/payments/dialogs';
export * from './lib/payments/checkout';
export { LANDED_COPY, paymentLanded, confetti } from './lib/payments/celebrate';
export { HttpError, get, post } from './lib/payments/http';
/**
 * Headless dialog hooks: card checkout (`useCardCheckoutState` — render its `stripe`
 * props with `@/Core/engines/StripePayment`), `useUpgradeDialog`, `useSuccessDialog`,
 * `useCheckoutReturn`, `usePaymentsRoot`, `useEscapeKey`; gating with
 * `requireSignIn` / `requireVerifiedEmail`; `upgradeIntervalLabel`.
 */
export * from './lib/payments';
