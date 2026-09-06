# Aura

A social feed reimagined as a museum accession record. Every account resolves
to one deterministic colour — an **aura**, hashed client-side from the
handle — and every post is a catalogued work rather than a card in a stream.

Built as a portfolio piece on top of Route Academy's public practice API
(`route-posts.routemisr.com`): real network calls, real states, no mock data.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)

---

## The idea

**Everyone here is a catalogued individual holding a number they did not
choose.** A handle hashes (FNV-1a) to a hue confined to an 80° arc anchored
at the brand's Vermilion — nobody else holds that exact colour, it costs zero
backend storage, and it can't be copied by re-skinning a competitor's avatar
ring.

The interface follows the same metaphor: posts are **works** hung on a
**wall**, authors are identified by a **tombstone label** (portrait ringed in
their aura, name, handle, date, and an accession number such as `AUR-A247`),
and a profile is a **collection** — that person's works, filtered.

Full rationale for every structural and colour decision lives in
[`DESIGN.md`](DESIGN.md); product scope and constraints in
[`PRODUCT.md`](PRODUCT.md); the brand system itself in
[`docs/brand-guidelines.md`](docs/brand-guidelines.md).

## Features

- Feed, post composer (text and/or one image), like, bookmark, comment with
  nested replies, and re-share
- Follow / unfollow, profile photo and cover photo upload, password change
- Notifications with unread count and read/unread state
- People search, post details as a standalone record view
- Light and dark themes as two independently designed surfaces — not
  inversions of each other — resolved before first paint and switched with a
  circular view-transition from the toggle itself
- Skeleton loading states and an indeterminate top-of-viewport fetch
  indicator for background activity
- A condition-note (toast) system for action results, separate from
  form-level inline feedback

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query v5 ·
React Router v7 · React Hook Form + Zod · Axios

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

`VITE_API_BASE_URL` in `.env` points at the API; it defaults to the
production host (`https://route-posts.routemisr.com`) if unset.

```bash
npm run build      # type-check and build for production
npm run preview    # preview the production build locally
npm run lint        # eslint
npm run typecheck   # tsc -b only
```

## Project structure

```
src/
├── app/          # providers, router
├── features/     # feature-scoped modules (posts, comments, users, auth)
├── layouts/      # shell layout + navigation (catalogue index, mobile dock)
├── pages/        # route-level components
└── shared/       # design-system primitives, API client, hooks, lib
```

Feature folders own their own components, hooks, and API/model code;
`shared/ui` holds the primitives (`Plate`, `TombstoneLabel`, `ThemeToggle`,
`Skeleton`, the toast system) that every feature composes rather than
styling from scratch.

## Deployment

Configured for [Vercel](https://vercel.com) — `vercel.json` rewrites every
route to `index.html` for client-side routing via React Router. Import the
repository, set `VITE_API_BASE_URL` if you need a different API host than
the default, and deploy.

## Design documentation

This project was built through a deliberate design process, not a visual
default:

- [`DESIGN.md`](DESIGN.md) — the direction, the two-theme colour system with
  measured WCAG contrast ratios, the motion system, and known trade-offs
- [`PRODUCT.md`](PRODUCT.md) — product scope, users, and constraints
- [`docs/brand-guidelines.md`](docs/brand-guidelines.md) — the full brand
  system (colour, type, motion, voice)

## License

MIT © Kazem Mohamed
