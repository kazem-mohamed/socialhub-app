# Aura — Brand Guidelines

**Status: Locked.** This is the source-of-truth reference. The interactive version of everything below lives in [`brand-board.html`](./brand-board.html) — open it to see the mark, colours, and aura generator live. This document exists so a developer can implement the system without opening the board.

System name: **Swiss Modernism 2.0** — a disciplined grid carrying exactly one vibrant accent, used sparingly. Premium comes from *proportion*, not from removing colour.

---

## 1 · The mark — Aura wordmark

The logo is the brand name itself — "Aura", set in Bricolage Grotesque (not Inter), closed by a single Vermilion point sitting on the x-height. There is no separate abstract symbol.

**Construction:**
- Typeface: **Bricolage Grotesque**, weight 800. Reserved exclusively for this mark — it appears nowhere else in the system (Inter carries all UI type, see §3).
- Case: first letter capital, rest lowercase — "Aura", never "AURA" or "aura".
- Tracking: −3 (internal units, at a 100-unit font size) — i.e. slightly tightened, not loose.
- Halo dot: radius = `0.16 × x-height`, positioned `0.30 × x-height` to the right of the wordmark's right edge. Vertical centre sits on the x-height mid-line — never on the baseline, never above the cap-height. Always Vermilion `#E4572E`, even when the wordmark itself is recoloured to `currentColor` for 1-colour contexts.
- Clear space: half the height of the capital "A", minimum, on all sides.

Because the dot's size and position are derived from a *measured* x-height rather than a fixed pixel offset, the mark reproduces correctly at any implementation size without manual per-size tuning — render the wordmark, measure an x-height letter (e.g. "u") in the same font/size, then place the dot from that measurement. See the reference implementation in [`brand-board.html`](./brand-board.html)'s `buildWordmark()`.

**Two forms:**
- **Full wordmark** — "Aura" + dot. Used wherever there's room for the whole word: cover, nav bar, card/poster corner marks, share assets.
- **Monogram** — "A" + dot alone. Used in small square contexts where the full word won't read: app icon, favicon, tight nav slots (16–40px). Never shrink the full wordmark below a comfortably legible size instead of switching to the monogram.

**Rules**

| ✓ Do | ✕ Never |
|---|---|
| Set in Bricolage Grotesque 800 only | Substitute Inter, or any other typeface |
| Keep the capital-A / lowercase-rest casing | Set in all caps or all lowercase |
| Recolour the wordmark to `currentColor` for 1-colour contexts (dot stays Vermilion) | Recolour the dot to anything but Vermilion |
| Scale uniformly | Stretch or skew the aspect ratio, or loosen the tracking |
| Place on Ink, Surface, or white | Add drop shadows, glows, or bevels |

Earlier explorations — an abstract ring symbol ("Open Halo") and two alternative wordmark treatments — were reviewed and retired. The Aura wordmark above is the only mark that ships.

---

## 2 · Colour

Vermilion is locked. It reads as premium, not loud, because it never exceeds **8% of any surface** — proportion is the whole trick.

**Surface ratio** (drawn to scale in the board): Ink 62% · Surface 24% · Vermilion 8% · Gold 6%.

### Dark mode (primary identity)

| Token | Value | Usage |
|---|---|---|
| `--ink` | `#0B0A0A` | Page ground |
| `--surface` | `#141211` | Cards, panels |
| `--surface-2` | `#1C1917` | Inputs, wells |
| `--line` | `rgba(245,241,234,.13)` | Hairlines, dividers |
| `--line-2` | `rgba(245,241,234,.07)` | Secondary hairlines |
| `--fg` | `#F5F1EA` | Headings, body |
| `--fg-2` | `#A79E93` | Supporting copy |
| `--fg-3` | `#6E665D` | Tertiary / disabled |
| `--verm` | `#E4572E` | The single accent — 8% max |
| `--verm-text` | `#F06B45` | Vermilion on dark (AA-legible) |
| `--gold` | `#F5B301` | Aura warm pole · saved state only |
| `--grid-c` | `rgba(228,87,46,.30)` | Construction guides only |

### Light mode (secondary — warm bone, not pure white)

| Token | Value |
|---|---|
| `--ink` | `#F7F4EF` |
| `--surface` | `#FFFFFF` |
| `--surface-2` | `#EEEAE3` |
| `--line` | `rgba(11,10,10,.16)` |
| `--line-2` | `rgba(11,10,10,.08)` |
| `--fg` | `#0B0A0A` |
| `--fg-2` | `#57514A` |
| `--fg-3` | `#8A8279` |
| `--verm-text` | `#B93D19` |
| `--gold-text` | `#8A6304` |
| `--grid-c` | `rgba(185,61,25,.28)` |

`--verm` and `--gold` themselves do not change between modes — only their higher-contrast "-text" variants do.

**Gold is not a button colour.** It is reserved exclusively for the aura gradient's warm pole and for exactly one UI state: *saved*.

---

## 3 · Typography

| Role | Face | Weight | Notes |
|---|---|---|---|
| Display / Heading / Body | Inter | 800 / 700 / 400 | Carries the entire system at two weights (800, 400) — 700 appears only at heading scale |
| Pulled quote | Playfair Display | Italic only | At most once per page, one line. No roman weight exists in this system |
| Numbers, handles, labels | JetBrains Mono | 400 / 500 / 600 | Never used for prose — notation only |
| Arabic copy | Noto Sans Arabic | 400 / 500 / 700 | RTL sections only |

**Rules**
- Display tracking is always negative: `letter-spacing: -.045em` to `-.06em`.
- Body copy never exceeds 68 characters per line.
- Mono is never used for prose — only notation (handles, timestamps, hex codes, spec values).
- Playfair is italic-only.
- Bricolage Grotesque is reserved for the wordmark (§1) — never used in UI text.

**Scale reference** (from the board's type specimen):

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Display | `clamp(60px,13vw,168px)` | 800 | `-.055em` |
| Cover word | `clamp(84px,19vw,250px)` | 800 | `-.06em` |
| Heading | 28px | 700 | `-.03em` |
| Body | 16px | 400 | normal |
| Pulled quote | 24px | 400 italic (Playfair) | normal |
| Spec / mono | 13px | 500 | `.06em` |

---

## 4 · The aura system

Vermilion is the brand's colour. The **aura** is the user's — a deterministic, per-handle colour generated client-side, with zero backend cost, that always reads as part of the same family.

**Why it can't drift:** every generated hue is confined to a single **80° arc** of the colour wheel, anchored at Vermilion's own hue. Ten thousand distinct auras still read as one family — none can land on green or neon magenta.

### Algorithm

```js
// FNV-1a hash: string -> uint32
function hash32(s) {
  var h = 2166136261 >>> 0;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

var VERM_HUE = 14, FAM_START = 330, FAM_SPAN = 80; // arc: 330° -> 360°/0° -> 50°, centred through Vermilion's 14°

function auraFor(handle) {
  var h = hash32(String(handle).toLowerCase().trim() || "anon");

  var p1 = (h % 1000) / 1000 * FAM_SPAN;                     // 0 -> 80
  var p2 = Math.min(FAM_SPAN, p1 + 13 + (h >>> 11) % 12);    // stays inside the arc

  var h1 = (FAM_START + p1) % 360;
  var h2 = (FAM_START + p2) % 360;

  return {
    h1: Math.round(h1), h2: Math.round(h2),
    sat: 68 + (h >>> 7) % 17,   // 68-84%
    lum: 52 + (h >>> 17) % 6,   // 52-57%
  };
}

// gradient: linear-gradient(135deg, hsl(h1 sat% lum%), hsl(h2 sat% (lum-8)%))
```

**Constants are fixed.** `VERM_HUE`, `FAM_START`, and `FAM_SPAN` must not change per-deployment — they are what keeps every aura on-brand.

**Rendering rule:** an aura is shown as a single hairline ring around an avatar, never a filled or blurred shape.

```css
.avatar {
  border-radius: 50%;
  background: var(--surface-2);
  box-shadow: 0 0 0 1.25px var(--ink), 0 0 0 2.25px var(--tag, var(--line));
}
/* --tag is set inline per-user: hsl(h1 sat% lum%) from auraFor() */
```

No blur, no glow, no gradient fill on the avatar itself — the two-hue gradient (`grad()`) is only used for the larger swatches in the generator, not for avatars in product UI.

---

## 5 · Grid & spacing

- Base unit: `--u: 8px`. All spacing is a multiple of it.
- Container: `max-width: 1240px`, `padding: 0 40px` (`--u * 5`).
- Grid: 12 columns, `gap: 24px` (`--u * 3`) on desktop.
- Below 860px: any element pinned to a specific column span/offset collapses to full-width, single column, row-gap `40px` (`--u * 5`).
- Below 640px: the 12-column grid itself becomes 6 columns.

---

## 6 · Motion

Four named behaviours. Nothing in the product moves outside these four.

| Behaviour | Where | Duration | Easing |
|---|---|---|---|
| Vertical wipe | Buttons (hover) | 380ms | `expo.out` |
| Plate reveal | On scroll into view | 750ms | `power1.out` |
| Rule draw | Once, on load | 1100ms | `expo.out` |
| Aura pulse | Ambient (brand dot) | 3200ms | loop, `cubic-bezier(.4,0,.6,1)` |

`prefers-reduced-motion: reduce` must collapse all four to effectively instant (`.001s`) and disable the ambient pulse entirely — already implemented in the board's CSS.

---

## 7 · Voice

Verbs first. Fragments over sentences. **No exclamation marks anywhere in the product.** Nothing claimed that can't be proven in the same sentence.

| We write | We never write |
|---|---|
| Sending. | Sending your post! |
| Up. Twelve saw it. | Woohoo — 12 views 🎉 |
| Empty. Say something. | Nothing here yet! |
| Didn't land. Again. | Oops! Try again. |
| 41 people. | Following 41 amazing people |

---

## 8 · Applications reference

The mark and tokens above are the only inputs needed to produce any surface:

- **App icon** — monogram centred at ~54% of a rounded-square container (22px radius at 96px, scaling proportionally).
- **Profile/content card** — `--surface` background, 1px `--line` border, a 6px Vermilion edge accent, monogram top-left, handle in mono.
- **Feed row avatar** — 26px circle, aura hairline ring per §4 (the user's own aura colour, unrelated to the brand mark).
- **Poster / share card** — `--ink` background, monogram top-left, display-weight headline with one Vermilion-coloured word max.

---

## Reference files

- Interactive board (source of every value above): [`docs/brand-board.html`](./brand-board.html)
- Machine-readable tokens: [`docs/design-tokens.json`](./design-tokens.json)
- CSS custom properties: [`docs/design-tokens.css`](./design-tokens.css)

Nothing in this document is provisional. Any change to a value here is a rebrand decision, not an implementation detail.
