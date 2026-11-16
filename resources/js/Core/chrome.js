/** Header: drawer/search/scroll state and active-route matching; the outside-click/Escape helper. */
export { useDismiss, useNavBar, useScrolled } from './lib/chrome';
/** Header menus: notifications bell, language switcher, account menu. */
export { timeAgo, useLanguageSelector, useNotifications, useUserMenu } from './lib/chrome';
/** Footer data and newsletter form; the mobile open-in-app banner. */
export { FOOTER_SOCIAL_KEYS, useAppBanner, useFooter, useNewsletter } from './lib/chrome';
/* The ad slot is an engine, imported directly: `import AdSlot from '@/Core/engines/AdSlot'`. */
