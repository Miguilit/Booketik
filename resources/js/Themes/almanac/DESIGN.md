# Almanac

A printed programme for a city's week: cream stock, warm ink, a serif
masthead, italic dates in the margin, hairline column rules. For community
calendars, culture and curated listings — events you read about before you
go.

## Principles

1. **Set it like print.** Listings are ruled lines, not tiles: a margin
   *dateline* (weekday · big italic day · month), then the title in serif, the
   time and place in mono. Two columns on wide screens with a column rule.
2. **Italic means a date.** Instrument Serif italic is reserved for when
   things happen (and the occasional subtitle); it is never decoration.
3. **One thing to press.** Terracotta is the call to action and the link
   colour; moss means confirmed; ochre washes highlight dates and "your
   ticket". The event's own tint (`--ev-accent`) replaces terracotta on its
   page.
4. **Paper, not plastic.** A whisper of fibre texture on the page, soft warm
   shadows on the few things you keep (the registration card, the ticket),
   6–8px corners. No gradients except the legibility scrim on a cover.
5. **Times are labelled, prices include fees** — the same rules as every
   theme (`@/Core/events`).

## Tokens (`tokens.css`)

`--al-*` palette (RGB triplets), the shared `--s-*` semantic layer (so Civic
pages Almanac does not draw read Almanac's colours, faces and shapes) and the
`--t-*` bridge.

| Role | Light | Dark | Job |
|---|---|---|---|
| `bg` | `#F6F0E3` cream | `#1C1813` warm brown-black | the page (with paper texture) |
| `surface` | `#FFFBF3` card | `#26211A` | cards |
| `raised` | `#EFE6D3` | `#302922` | wells, chips |
| `ink` | `#1F1A14` | `#F3EAD8` | titles |
| `body` | `#3A3128` | `#DDD1BC` | reading text |
| `muted` | `#6A5F51` | `#B9AC97` | meta (≥ 5:1) |
| `line` | `#DCCFB8` rule | `#41382C` | column rules (decorative) |
| `edge` | `#8C7B63` | `#8A7A63` | frames on key items (≥ 3:1) |
| `brand` / `cta` / `link` | `#A8441F` terracotta | `#E58A63` / `#EE9A74` | the one action, links |
| `tint` | `#E3EAD6` moss paper | `#2B3524` | the weekend spread, info |
| `tint-2` | `#F3DFA8` ochre paper | `#3E3218` | dates, "your next ticket" |
| `success` | `#4E6A3B` moss | `#9DB884` | confirmations |
| `danger` / `warning` | `#A3291D` / `#7A5300` | `#F08A78` / `#E2B85A` | errors / scarcity |

The source terracotta `#C2532B` fails AA as text on cream, so it is set
darker (`#A8441F`); ochre `#E2A532` only ever appears as a washed fill under
ink. The dark palette is a lamp-lit programme: brown-black paper, cream type,
terracotta and moss lifted until they read on it.

`npm run themes:contrast`: 27 pairs per mode at AA.

## Type

| Use | Face |
|---|---|
| Masthead, city, titles | Instrument Serif 400, 22–128px |
| Dates, subtitles | Instrument Serif *italic* |
| Reading text, UI | Instrument Sans (variable) |
| Times, zones, prices, codes, small caps labels | IBM Plex Mono, uppercase tracked at 11px for labels |

## Layout pieces

- **Masthead**: a dated rule line ("Programme · Monday 19 October 2026"), the
  wordmark in serif, a quiet underlined nav, a double rule beneath.
- **Dateline** (`components/ui.jsx`): the margin block used by `ProgrammeRow`,
  the event page and the confirmation.
- **Programme rows** (`ProgrammeRow`) in CSS columns with `.al-columns`
  (column rule).
- **Index**: categories as an index with dotted leaders.
- **Feature**: a curated collection as a framed pull-out.
- **Colophon** footer with ruled columns.
- Map pins are terracotta lozenges with an italic count; tiles are lightly
  sepia-toned, dimmed at night.

## Motion

Almost none: underlines appear on hover, the ticket stub slides up once on
the confirmation page. Off under `prefers-reduced-motion`.

## Avoided

Purple and indigo, decorative gradients, glassmorphism, emoji (Lucide only),
sticker shadows (that is Civic's voice), a centred hero with three cards.

## Pages drawn

Home, Discover, Event, Organizer, Checkout, OrderConfirmation, Tickets, the
Auth pages and Error. Everything else falls back to Civic's page inside
Almanac's Layout and tokens. The global dialogs use Civic's `roots.jsx`
(app.jsx fallback), rendered in Almanac's tokens.
