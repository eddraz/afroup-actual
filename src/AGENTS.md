# Astro App DOX

## Purpose

- `src/` contains the current Astro application served through the Cloudflare adapter.

## Ownership

- Owns Astro pages and API routes, shared layouts and chrome, route constants, and application styles.
- Root `public/` owns the static assets consumed by this application.

## Local Contracts

- Keep shared navigation, responsive dock/sidebar, top bar, and page chrome in `layouts/BaseLayout.astro` rather than copying them into pages.
- Keep the sidebar logo and bottom language/donation controls outside the scroll region; only the menu item list may own vertical overflow.
- Keep shared route targets in `lib/paths.ts` and the daisyUI theme and Tailwind entry in `styles/global.css`.
- Build UI with daisyUI components first, Tailwind utilities second, and custom CSS only when neither covers the requirement.
- Preserve Spanish UI and visual parity with the corresponding source screen under `design/`.
- Keep runtime D1 access through the Cloudflare `DB` binding; `/api/health` currently exercises that binding.

## Work Guidance

- Add page and API routes under `pages/`; reuse `BaseLayout.astro` for application chrome.
- Reference static files from root `public/` by their public URL instead of importing from `design/assets/`.
- Centralize reusable theme changes in `styles/global.css` and reusable navigation changes in the shared layout or route map.

## Verification

- `bun run build` is the current production build check.
- `bun run dev` runs the current Astro/workerd development runtime; `bun run preview` runs the local Workers preview.
- In a configured runtime with local D1 migrations applied, request `GET /api/health` to check the `DB` binding.

## Child DOX Index

- No nested child boundaries are needed in `src/` now.
