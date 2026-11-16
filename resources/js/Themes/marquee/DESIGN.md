# Marquee

A gig poster for nightlife, music and culture. Black bands, paper stock,
condensed capitals, and one signal colour that only ever means "yes" or
"press here". The covers bring the colour; everything else is ink and paper.

## Principles

1. **Billing, not cards.** Events are listed like a lineup: the date in mono,
   the act in Anton capitals, 1px rules between acts (`BillRow` on Home).
2. **Two reserved signals.** Signal lime `#C8FF2E` appears only on the call to
   action and on confirmations — always as a fill with ink type, never as text
   on paper. Hot `#FF4A1C` appears only for sold out and live — as a fill with
   ink type. Small error text uses a darkened hot that passes AA. The event's
   own tint is a small rule beside the tags, never the button: the CTA stays lime.
3. **Flat.** 2px corners, no shadows, 1px rules, full-bleed black bands at the
   top and the foot of every page (in both modes).
4. **Hard cuts.** No easing: states switch, they do not glide. The only motion
   is the selling-fast ticker and the ticket reveal (a stepped wipe), both off
   under `prefers-reduced-motion`.
5. **Labelled time, honest price.** Every time carries its zone; every price is
   fees-included (from `@/Core/events`).

## Tokens (`tokens.css`)

`--mq-*` palette, the shared semantic layer `--s-*` (what Civic's fallback
pages read) and the bridge `--t-*`. Inside a `.mq-band` the semantic tokens
are re-declared with the night values so every kit piece reads on black.

| Role | Light (paper) | Dark (ink, default) |
|---|---|---|
| `bg` | `#F3F0E8` paper | `#0D0D0B` ink |
| `surface` | `#FAF8F2` | `#171714` |
| `raised` | `#E6E2D8` | `#23221E` |
| `ink` | `#0D0D0B` | `#F3F0E8` |
| `body` | `#1F1E1B` | `#DEDAD0` |
| `muted` | `#56524C` (smoke, darkened for small type) | `#A39E94` |
| `line` | `#D6D2C7` concrete | `#34322D` |
| `edge` (rules that matter) | ink | concrete `#D6D2C7` |
| `brand` / `on-brand` | ink / paper | paper / ink |
| `cta` / `on-cta` | lime / ink | lime / ink |
| `tint-2` (date block) | ink / paper | paper / ink |
| `success` | `#1E6B2F` | lime |
| `danger` (text) | `#B02C0C` | `#FF6A40` |
| `hot` (fills only) | `#FF4A1C` + ink text | same |

`npm run themes:contrast` passes all 27 pairs in both modes.

## Type

| Use | Face | Size |
|---|---|---|
| City name, 404 | Anton | `clamp(84px, 19vw, 240px)` |
| Event title | Anton | `clamp(56px, 9vw, 132px)` |
| Section titles | Anton | 38–50px, with a rule above |
| Acts in a bill | Anton | 24–36px |
| Body | Schibsted Grotesk | 15–17px |
| Dates, prices, labels, buttons | IBM Plex Mono, uppercase, tracked | 11–15px |

Anton has one weight; `.font-display` forces 400, uppercase, line-height 0.92.

## Pieces

`components/ui.jsx` (buttons in mono capitals, square chips, tags with the two
signals, the black/paper date block, `Ticker`, `Band`), `events.jsx` (4:5
covers at 35% grey, Anton titles, ranked numerals `01`–`10`), `MapView`
(greyscale tiles — inverted at night — with square lime price tags).

Pages drawn: Home, Discover, Event, Organizer, Checkout, OrderConfirmation,
Tickets, the Auth pages and Error. Everything else is Civic's page in this
Layout and these tokens.

## Avoided

Purple, decorative gradients (the only gradient is the legibility scrim on a
cover), glass, emoji, rounded pills, soft shadows, lime as decoration, hot as
decoration.

## Accessibility

AA everywhere; the ticker's moving track is `aria-hidden` with the text read
once; the QR stays dark on white; the focus ring is paper on black bands and
ink on paper; 360px without sideways scroll (titles `break-words`).
