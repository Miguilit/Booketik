/** The account page: tabs, notification prefs, inbox. */
export { ACCOUNT_TABS, useAccountPage } from './lib/account';

/** Account display helpers: dates, avatar initial, order rows. */
export { formatAccountDate, profileInitial } from './lib/account';

/** The Security card's hooks live with the rest of auth (Core/auth), re-exported here for convenience. */
export { useAccountSecurity, useConnectedAccounts, usePasswordChange } from './lib/auth';
