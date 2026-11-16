# Core — what every theme shares

Headless modules: hooks, state and logic, **no markup and no CSS classes**.
Themes (`resources/js/Themes/<key>/`) import `@/Core/*`, packages and their
own folder — nothing else (`npm run themes:check`). Implementation details
live in `Core/lib/*` (the former Classic logic, moved here when the interim
site was retired); prefer the public modules below.

**Engines** (`Core/engines/*.jsx`) are the one exception: functional,
unbranded components — the Stripe Payment Element and the ad slot. They use
only layout utilities and bridge-token arbitrary values, take
`className`/`classNames`, and every theme's Tailwind `content` scans `Core/**`.

## Event modules

### `@/Core/events`
- `eventWhen(event, now?)` → `{ weekday, day, month, date, time, endTime, multiDay, endDate, zone, zoneName, relative, live, past, soon, viewerTime, long, short, dateline }` — always in the event's own zone, labelled; `viewerTime` when the viewer's zone differs.
- `zonedParts`, `zoneAbbr`, `viewerZone`, `relativeDay`, `countdown(untilIso, now)`, `useNow(ms)`.
- `priceLabel(price)` ("Free", "From €19.39"), `priceNote`, `availabilityTag`, `formatLabel`, `kindLabel`, `venueLine`, `addressLines`.
- `ctaFor(event, url, now)` → `{ action, kind: link|external|disabled, href, label, tone: cta|quiet|signal, countdown, note }` — the server's `event.cta` mapped to what the button does.
- `calendarLinks(event)` → `{ ics, google, outlook }`; `contentBlocks`, `lineupFrom(blocks)`; `accentStyle(accent, dark)` → the `--ev-accent` variables.
- `useEventActions(event)`, `useAskEvent(event)`, `useFollowOrganizer(organizer)`, `useCursorList(items, cursor, path)`, `useCityPicker`, `weekendDays(events)`; paths `eventPath`, `organizerPath`, `categoryPath`.

### `@/Core/ticketCheckout`
`useTicketCheckout({ event, tiers, preselect, referral, unlockCode, waitlistEntryId, channels })` — the one-page checkout: `tickets → details → pay`, with `account` (paid tiers need an account), `verify` (`EMAIL_NOT_VERIFIED`) and `done` (a guest's free RSVP). Quantities, lines, fees-included total and the server breakdown, answers, guest details, promo, channel, hold countdown, `stripe` props for `<StripePayment>`, a regional `charge`; `continueToDetails`, `submit`, `changeTickets`, `signIn`. `tierStateLabel(tier)`, `SELLABLE`.

### `@/Core/discover`
`useDiscover(props)` (URL-synced filters, list/map/calendar, cursor paging), `useMapPins(filters)` (`/events/map?bbox`), `useCalendarMonth(filters, category)`, `useAiSearch({ q, city, categories })` (parsed query as editable chips), `filterQuery`, `DATE_CHIPS`, `PRICE_CHIPS`, `FORMAT_CHIPS`.

### `@/Core/map`
`useLeafletMap(ref, { center, zoom, pins, pinClass, onSelect, onMove, interactive, fit })` — OpenStreetMap tiles through Leaflet, lazy-loaded, attribution kept, reduced motion honoured. `osmLink(lat, lng)`.

### `@/Core/tickets`
`useTicketQr(ticket, colors)` → `{ payload, svg, secondsLeft, rotating, usable }` (RFC 6238 TOTP over `qr.secret`: `EG1:{code}:{totp}`, works offline); `useTicketActions(ticket)` → `{ transfer, requestRefund, busy, errors, refund }`; `ticketStatusLabel`, `totp`, `qrSvg`.

### `@/Core/agenda`
`useAgenda({ event, sessions })` → `{ days, tracks, track, setTrack, onlyMine, setOnlyMine, mineCount, toggle(session), signIn }` — bookmarks through the API, or in this browser when signed out.

### `@/Core/preferences`
`useNotificationPreferences(initial)` — the `/me/preferences` contract (push, email, categories, quiet hours, muted organizers) saved with `PATCH`. `categoryCopy(key)`.

### `@/Core/media`
`imageProps(image, { sizes, priority, alt, ratio })` → `<img>` props plus `sources` (`[{ type, srcSet, sizes }]`, AVIF then WebP) when the upload has variants (`image.variants`, 480–1920 wide; themes render them in a `<picture className="contents">`), else a `srcset` for resizable deliveries (Cloudflare `/cdn-cgi/image/`, `?w=`); intrinsic size, lazy/eager, `fetchPriority`, and the dominant `color` as the placeholder background. `thumbSrc(image, size)` → the smallest variant ≥ 2× `size` (avatars, logos). `initials(name)`.

## Shell and account modules

- `@/Core/site` — `useLocale()`, `useRoute()` → `url(path)`, `useViewer()`, `useSiteBrand()`.
- `@/Core/format` — `cn`, `money(minor, currency, locale?)` / `formatPrice` (Intl, the page's `<html lang>`, the currency's exponent as decimals — writes exactly what `Money::format` writes; `npm run money:check`), `setCurrencyRules`, `withNodes`, counts.
- `@/Core/api` — `createApi(token)` → `{ get, list, post, patch, del }` for `/api/v1` (`list` returns `{ data, meta }`; errors are `{ code, message, fields, status }`).
- `@/Core/mode`, `@/Core/bridge`, `@/Core/scrollLock`, `@/Core/switcher`.
- `@/Core/chrome` — `useNavBar`, `useScrolled`, `useDismiss`, `useNotifications`, `useLanguageSelector`, `useUserMenu`, `useAppBanner`, `useFooter`, `useNewsletter`.
- `@/Core/auth` — the dialog store (`openAuthDialog`, `openVerifyEmailDialog`, `requireAccount` …), `useAuthModal`, `useVerifyEmail({ to })` (the site has no auth pages: sign-in, register, forgot and reset are the dialog, opened by `?auth=` too), `useSocialProviders`, account security hooks.
- `@/Core/account`, `@/Core/forms` (content pages, contact form), `@/Core/errors`.
- `@/Core/subscription`, `@/Core/checkout` (regional ChargeIntent dialog, `useOrderPolling`, countdowns, channels), `@/Core/payments` (Plus upgrade, card checkout, success, checkout return).

## SSR

Pages render on the server too (`resources/js/ssr.jsx`). Nothing may read `window`, `document`, `localStorage` or `matchMedia` at module scope or during render; use `pageLang()` (`@/Core/i18n`) for Intl formatting, `useNow()` for the clock and `viewerZone()` (null until hydrated) — they agree between server and browser.

## i18n — `@/Core/i18n`

`t(english, params?)`: literal English keys, `:named` placeholders, never at
module top level. Website locales: `resources/lang/{locale}.json`.
