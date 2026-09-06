# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General, all-ages social-network audience — no niche. People who post short text and/or a single image, follow others, comment (including nested replies), like, bookmark, and re-share posts, browse a feed, and manage a profile (photo, cover, password).

## Product Purpose

A general-purpose social network — feed, posts, comments, follow, notifications, bookmarks — built as a **portfolio/practice project** against Route Academy's public practice API (`route-posts.routemisr.com`). It exists to demonstrate front-end product and engineering craft, not to operate as a live business. Success is a design system and implementation good enough to stand as a portfolio centerpiece, not user/revenue metrics.

## Positioning

"A social network where identity is generated, not decorated." Every account resolves to one deterministic personal colour — the *aura* — derived client-side from the user's handle (FNV-1a hash, confined to an 80° arc of the colour wheel anchored at the brand's own Vermilion hue). Nobody else holds that exact colour, it costs zero backend storage, and it can't be copied by re-skinning a competitor's avatar-ring feature without rebuilding the same constrained colour system. Full spec: [`docs/brand-guidelines.md`](docs/brand-guidelines.md) §4.

## Operating Context

Single-page React app making real network calls to `route-posts.routemisr.com` — no mock data. Core workflows: browse the feed; compose a post (text and/or one image); like, bookmark, comment (with nested replies), and re-share a post; follow/unfollow; view own or another user's profile and their posts; upload profile photo and cover photo; read and clear notifications; view/manage bookmarked posts; change password; sign in / sign up.

Existing pages (`app/src/pages`): Home (feed), Login, Register, Profile (own + `:userId`), Settings, Notifications, Post Details, 404.

## Capabilities and Constraints

- Auth against the real API: sign in, sign up, change password. No social/OAuth login exists.
- Feed and post CRUD: create (text and/or one image), edit, delete (own posts only), like, bookmark, share-with-caption.
- Comments: create, like, nested replies.
- Follow/unfollow; profile photo and cover photo upload.
- Notifications: list, unread count, mark one/bulk/all read.
- All of the above are real, rate-limited, shared-practice-API calls — the redesign must not invent backend capabilities the API doesn't have (e.g. DMs, stories, live video). UI states (loading, empty, error) must reflect what the real API actually returns.
- No dedicated search page currently exists in the router; user/post search is an API capability (`/users/search`, `/posts`) without a confirmed UI home yet — treat as undecided rather than assumed.

## Brand Commitments

Fully locked and documented — treat as binding, not a starting point:

- **Mark:** "Aura" wordmark, Bricolage Grotesque 800 (capital A, lowercase rest), closed by a Vermilion halo dot sized/positioned from a measured x-height. Monogram ("A" + dot) for small square contexts (≤40px).
- **Colour:** Vermilion `#E4572E` — the single accent, never exceeding 8% of any surface. Gold `#F5B301` — aura warm pole and the *saved* state only, never a button. Dark mode is primary identity; warm-bone light (`#F7F4EF` ground) is secondary, not pure white.
- **Type:** Inter 800/400 for all UI text. Playfair Display italic for at most one pulled quote per page — no roman weight. JetBrains Mono for numbers/handles/labels only, never prose. Bricolage Grotesque is reserved for the wordmark alone.
- **System:** "Swiss Modernism 2.0" — 8-unit spacing scale, 12-column grid (1240px max-width), single vibrant accent used sparingly. Premium reads through proportion, not colour removal.
- **The aura system:** deterministic per-user colour (see Positioning). Rendered as a single hairline ring around an avatar — never filled, never blurred.
- **Motion:** four named behaviours only — vertical wipe (buttons, 380ms expo.out), plate reveal (on scroll, 750ms power1.out), rule draw (once, 1100ms expo.out), aura pulse (ambient, 3200ms loop). `prefers-reduced-motion` must collapse all of them.
- **Voice:** verbs first, fragments over sentences, no exclamation marks anywhere in the product, nothing claimed that can't be proven in the same sentence. English only (see below).
- Full reference: [`docs/brand-guidelines.md`](docs/brand-guidelines.md), [`docs/design-tokens.css`](docs/design-tokens.css), [`docs/design-tokens.json`](docs/design-tokens.json), live board at [`docs/brand-board.html`](docs/brand-board.html).

## Evidence on Hand

Real, live API integration is the only real evidence — actual network responses from `route-posts.routemisr.com`. No press, no case studies, no testimonials, no real user counts exist, and none may be fabricated. Sample handles/names used in brand material (e.g. `leila.harb`, `idris.okafor`) are demonstration material only and must stay visibly labeled as such if reused — never presented as real users, quotes, or metrics.

## Product Principles

1. Portfolio-honest: never fabricate business proof. Demonstration content stays visibly demonstration.
2. The aura is the product's one real differentiator — every design decision should make a user's own colour feel earned and personal, not decorative.
3. Design to the real API's actual states and limits; don't promise what the backend can't deliver.
4. English-only interface. Voice, copy, and UI text follow the locked English brand voice — Arabic is how this project is discussed, not a supported product locale.
5. General, all-ages audience — default to broadly legible, unpretentious craft over niche or insider visual references.

## Accessibility & Inclusion

No formal standard was mandated. One concrete, already-locked commitment carries forward from the brand system: every animation must respect `prefers-reduced-motion` (collapse to near-instant, disable ambient loops) — this is not optional polish, it's already specified in the motion system.
