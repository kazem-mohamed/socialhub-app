# Design — The Accession Card

The visual system as **built** in `app/src`. Brand law lives in
[`docs/brand-guidelines.md`](docs/brand-guidelines.md); this file records how
it was resolved into a working interface.

Direction seed `05c6e942`, candidate 5 of 7. The contract is the first
comment inside `<body>` in [`app/index.html`](app/index.html) and survives
the production build.

Surface mode: **Operate**, with expression permitted to lead on ties.

---

## 1 · The thesis

**Everyone here is a catalogued individual holding a number they did not
choose.**

That is the aura's premise stated as a museum states it. An accession number
is assigned on entry, never chosen, never reused — exactly what a handle
hashing to one colour already was.

**What this refuses:** top bar, centre column, right rail. The previous
build kept that arrangement and re-skinned it, which is why it read as the
same layout in new paint.

**Why this world and not another:** it is the only candidate that survives an
API returning poor images or none. A museum tombstone card with no
photograph is still a correct, dignified record — so a text-only post is a
first-class work here, not a degraded one.

---

## 2 · Structure

| Surface | Arrangement |
|---|---|
| **Desktop shell** | A **248px catalogue index** fixed down the left edge. No top navigation bar exists on this breakpoint. |
| **Phone shell** | A slim plate carrying the mark and the lighting switch, plus a **dock** of four destinations at thumb height. |
| **The wall** | One hanging line: works stacked in a single 640px reading column, newest first. |
| **Rooms** | Following / Everyone / Yours / Saved are a **filter of one wall**, at its head — not four destinations. Destinations live in the index. |
| **A work** | A plate headed by its **tombstone label**: the author's portrait ringed in their aura, name, handle, date. On a record the accession number (`AUR-A247`) is stated too. The label sits at the *head* — on a wall you read the card after the painting, but in a feed you need to know whose voice it is before you start reading. |
| **A record** | The work taken off the wall — its image carries a `view-transition-name`, so it travels rather than the page replacing itself. |
| **A profile** | A *collection*: the same wall filtered to one contributor. Holdings, not stat tiles. An empty cover falls back to that person's own aura. |
| **`/people`** | New. User search existed in the API but had no home; it is now a room of catalogue entries. |

Deleted as superseded: `AppNavbar`, `ProfileCover`, `ProfileIdentity`,
`ProfileStats`, `OtherProfileHeader`.

### Phones are not the desktop, scaled

Plates go **full-bleed** below `sm`: no side borders, no corner radius, no
shadow, and the works hang flush with a single hairline between them. A
mounted work on a wall has an edge; a sheet held in the hand meets the edge
of the screen. Action targets grow to 44px there and shrink back on pointer
devices.

### The masonry that was tried and rejected

The wall was first built as a round-robin masonry across 1/2/3 columns. It
was replaced with a single column on review: a feed is read rather than
scanned, and multi-column burying of recency costs more than the
arrangement gains. `Wall.tsx` is now a hanging line.

---

## 3 · Two themes, both designed

Neither is an inversion of the other. Light is a gallery wall in daylight;
dark is the same object in a night vitrine.

| Token | Light | Dark |
|---|---|---|
| `--ground` | `#F7F4EF` bone wall | `#0B0A0A` |
| `--plate` | `#FFFFFF` | `#141211` |
| `--recess` | `#EFEBE4` | `#1C1917` |
| `--rail` | `#E4DFD6` | `#292827` |
| `--ink` | `#1A1613` warm, not pure black | `#F5F1EA` |
| `--ink-2` | `#57514A` | `#A79E93` |
| `--ink-3` | `#726B64` | `#877E74` |
| `--verm` | `#E4572E` (locked, constant) | same |
| `--verm-ink` | `#B93D19` | `#F06B45` |
| `--on-verm` | `#0B0A0A` | same |

Resolution before first paint via an inline script, so neither theme flashes
the other on boot. Follows the OS until someone chooses, then remembers.
`@theme inline` keeps the utilities pointing at the variables, so one
attribute flips the whole system.

### Two brand values were overridden, both for contrast

1. **`--ink-3` in dark** — the brand's `#6E665D` measured **3.31:1** on a
   plate. Raised to `#877E74` (4.68:1 plate, 4.96:1 ground).
2. **White on vermilion** — the brand board set the primary button as white
   on `#E4572E`, which is **3.68:1** and fails AA for text at button size.
   Vermilion is locked, so the *foreground* moved: `--on-verm` is near-black
   at **5.37:1**. Dark on a vermilion field is also closer to the print
   register than white was.

Measured, both themes:

| Pair | Light | Dark |
|---|---|---|
| ink on plate | 17.98 | 16.59 |
| ink-2 on plate | 7.83 | 7.08 |
| ink-3 on plate | 5.25 | 4.68 |
| ink-3 on ground | 4.78 | 4.96 |
| verm-ink on plate | 5.61 | 6.13 |
| on-verm on verm | 5.37 | 5.37 |

---

## 4 · Type

Fixed rem scale, not `clamp()` — product UI is read at consistent DPI, and a
heading that shrinks inside a column looks worse, not better.

`--text-micro` 11px · `--text-label` 12px · `--text-sm` 13px ·
`--text-base` 15px · `--text-read` 17px · `--text-lg` 20px ·
`--text-xl` 26px · `--text-2xl` 36px

Inter carries the interface. JetBrains Mono carries catalogue notation —
numbers, handles, accession codes, dates — always `tabular-nums`, so a
changing count never shifts a row. Bricolage Grotesque is the wordmark only.

---

## 5 · Motion

**Focal moment:** a work coming off the wall. The plate's image holds a
`view-transition-name`, so opening a record moves the piece rather than
swapping the page.

**Signature:** the lighting switch runs `startViewTransition` with a circle
clipped to the button's own coordinates — the new theme opens from under
your finger.

Everything else is feedback and continuity, at Operate timings: 100–150ms
for acknowledgement, 150–300ms for routine state, 300–500ms for view
transitions. No page-load choreography. Every one collapses under
`prefers-reduced-motion`.

**Loading has two registers.** Skeletons own first paint — plate-shaped, so
nothing jumps when content lands. The **fetch rule**, a 2px vermilion
hairline across the top of the window, accounts for the background work a
skeleton cannot show: a refetch, a like in flight, an upload. It waits 220ms
before appearing, so a fast request never causes a flash of loading chrome,
and it is deliberately indeterminate — the API reports no progress, and a
bar that pretended to know would be lying.

**Hover on a work:** the plate lifts 3px, its shadow deepens, the image
leans 2.5% inside its frame, and the colour chip reaches further down the
label — one gesture of stepping toward a piece, not four separate effects.
Pressing settles it back against the wall.

---

## 6 · Components

`shared/ui/` — features compose these rather than styling from scratch.

`Plate` (the only container) · `TombstoneLabel` · `Wordmark` · `Avatar` ·
`ThemeToggle` · `Button` · `Field` / `SelectField` / `Textarea` (one shared
shell in `controlStyles.ts`) · `InlineSelect` · `SearchInput` · `Skeleton` ·
`Modal` · `ConfirmDialog` · `FeedbackAlert` · `Label` · `StateMessage`

**Skeletons, not spinners.** Plate-shaped, with varying line counts so a
loading wall reads as different works rather than a repeating pattern.

**Condition notes** (`shared/ui/toast`). An action result — posted, saved,
withdrawn, shared, failed — is a small plate that arrives bottom-right,
states the fact, and files itself away. Its remaining time retracts along
the bottom rule. Three tones: `note` (neutral), `saved` (gold, the one state
gold owns), `problem` (vermilion, and it waits 7s rather than 3). At most
three stack; problems announce via `role="alert"`, the rest are polite. On a
phone the shelf clears the dock rather than sitting on it.

**Where a toast is right, and where it is not.** Toasts carry *transient
action results* that could originate anywhere. `FeedbackAlert` stays for
*form- and section-level* feedback that belongs beside its context — a
sign-in failure sits with the sign-in form, not in a corner the eye has
already left.

**Empty states teach.** Each room says what it collects and how something
gets into it, rather than announcing a void.

---

## 7 · Content honesty

`PRODUCT.md` forbids unprovable claims. Removed rather than restyled: the
auth showcase's fabricated user counts and feature grid, `"1 mutual"`
hardcoded onto every person, three privacy dropdowns the endpoints ignore,
and two buttons wired to nothing.

---

## 8 · Known state

- **Verified mostly without screenshots.** The Browser pane would not
  composite frames for most of this build, so the shell, both themes, the
  toggle, and every contrast pair were verified by DOM and computed-style
  inspection. Two screenshots from the user covered the record page and
  caught a duplicated label that inspection had missed.
- `react-icons` has been removed.
- HeroUI is used only by the provider; no visible control comes from it.
- Two icon files still exist (`shared/ui/icons.tsx` and
  `profile/profileIcons.tsx`) with a duplicated wrapper.
- A view transition exposes three promises (`ready`, `updateCallbackDone`,
  `finished`) and an interrupted one rejects more than just `finished`.
  All three are caught in `shared/lib/theme.ts`; attaching only to
  `finished` surfaced an unhandled `InvalidStateError` on rapid toggling.
- The design detector reports one warning: Inter as an overused face. It is
  a locked brand commitment and is kept deliberately; the distinctive face
  is Bricolage Grotesque on the mark.
