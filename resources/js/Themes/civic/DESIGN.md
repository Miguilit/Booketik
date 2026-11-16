# Daylight Civic

The default Eventgoo theme, the fallback for every page another theme has not
drawn, and the look of the organizer dashboard. Built for meetups,
conferences and the people who run them: a civic noticeboard in daylight —
warm paper, ink, a teal you can trust and one tangerine sticker that says
"press here".

## Principles

1. **The content brings the colour.** Covers and the event's own tint
   (`--ev-accent`, contrast-guarded on the server by `App\Support\AccentContrast`)
   carry the hue. The interface is paper, ink and teal.
2. **One sticker per screen.** The tangerine CTA (and the event-accent button
   on an event page) is the only element with a fill *and* the hard shadow.
   Key cards — the registration card, the checkout summary, a ticket — get the
   ink edge and shadow; everything else is a hairline card.
3. **Type is the identity.** Bricolage Grotesque at very large sizes with
   tight tracking for names of things (cities, events, organizers); Public
   Sans for reading; IBM Plex Mono for anything you'd check twice — times,
   time zones, prices, ticket codes.
4. **Times are always labelled.** Every time is in the event's own zone with
   its abbreviation (`19:00 CET`), plus "in 3 days" and, when the viewer is
   elsewhere, their own time (`Core/events.eventWhen`).
5. **Fees are in the price.** Every price shown is the fees-included total.

## Tokens (`tokens.css`)

`--cv-*` holds the palette as RGB triplets; the `--s-*` semantic layer maps
roles to it (every theme defines the same `--s-*` names, which is how a Civic
page shown under Marquee or Almanac takes their colours); `--t-*` is the
bridge read by Stripe, toasts and the progress bar.

| Role | Light | Dark | Job |
|---|---|---|---|
| `bg` | `#FAF8F4` paper | `#171412` warm ink | the page |
| `surface` | `#FFFFFF` | `#221E1A` | cards |
| `raised` | `#F2EEE6` | `#2C2722` | wells, chips, steppers |
| `ink` | `#13201F` | `#F4EFE6` cream | headings, the sticker edge |
| `body` | `#2C3836` | `#DCD4C7` | paragraphs |
| `muted` | `#59625F` | `#B3AA9C` | captions, meta (≥ 5.4:1 on every surface) |
| `brand` / `link` | `#0C5A52` teal | `#5FC9B9` / `#6FD3C3` | links, selected states, primary fills |
| `cta` | `#FF6B2C` tangerine | `#FF7A3D` | the one call to action — **ink text**, white fails AA |
| `tint` | `#BFE2F0` sky | `#1E3A42` | information, the weekend band, "ask" |
| `tint-2` | `#FFE7A0` butter | `#3D3216` | date stamps, "your next ticket", highlights |
| `success` | `#1C6E40` | `#7FD8A0` | confirmations only |
| `danger` | `#B3261E` | `#FF8A7A` | errors, sold out, cancelled |
| `warning` | `#7A4F00` | `#F2C46B` | scarcity ("3 left") |

The dark palette is designed, not inverted: a warm brown-black (never
blue-black, never `#000`), cream type, the teal lifted to a mint that still
reads on ink, tangerine slightly lighter so dark ink sits on it. Sticker
edges become cream cut-outs with a black hard shadow — stickers on a dark
board.

`npm run themes:contrast` checks 27 pairs per mode (text 4.5:1, focus ring
and edge 3:1) and fails the build otherwise.

## Shape

- Radii: cards 18px, buttons 14px, small things 10px, chips fully round.
- The sticker: `border-key border-edge shadow-key` = 1.5px ink border and a
  2px/2px hard shadow; on hover it lifts to 4px, on press it sits down flat.
- Hairline cards: `border border-line`, no shadow.
- Bento grids for featured content and dashboards (Home's top block).
- Scrims (`from-scrim/95`) only under text set on a cover — never decorative
  gradients.

## Type scale

| Use | Face | Size |
|---|---|---|
| City on Home | Bricolage 800 | 56 → 112px, tracking −0.045em |
| Page title (event, checkout) | Bricolage 800 | 40 → 56px |
| Section heading | Bricolage 700 | 26 → 30px |
| Card title | Bricolage 700 | 19px |
| Body | Public Sans | 15–17px, 1.65 for long text |
| Meta, times, prices, codes | Plex Mono 400/500 | 12–15px |

## Components (`components/ui.jsx`, `events.jsx`)

Button (`cta`, `accent`, `primary`, `secondary`, `quiet`, `ghost`, `link`,
`signal`, `danger`), IconButton, Chip (aria-pressed), Tag, DateStamp (the
butter sticker), Card, SectionHead, Rail (scroll-snap + prev/next), Img
(srcset from `Core/media`), Avatar, FacePile, Field/Input/Select/Textarea,
Checkbox, Toggle (a real switch), Stepper, Notice, Modal, Tabs (role=tablist).
Event cards: `EventCard`, `EventRow` (grid3/list/ranked), `PosterCard`,
`EventMini` (map sheet, calendar). `MapView` draws OSM tiles via Leaflet with
tangerine price pins.

## Motion

Short and physical: stickers lift 1px on hover and sit down on press; ticket
stubs drop in on the confirmation page. All of it is off under
`prefers-reduced-motion` (shared-base.css).

## Avoided on purpose

Purple and indigo, purple-to-blue gradients, glassmorphism, a centred hero
with three icon cards, emoji as icons (Lucide only), the same soft shadow on
everything, unlabelled time zones, fees revealed at the last step.

## Accessibility

AA for every token pair in both modes; a 2.5px focus ring in `focus` on
everything; skip link; every control labelled; the QR is always dark on white
whatever the mode; maps carry their OSM attribution and are never the only
way to reach an event; 360px wide without horizontal scroll (`overflow-x: clip`
on body and main, grid children may shrink).
