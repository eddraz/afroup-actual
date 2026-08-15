# Astro App DOX

## Purpose

- `src/` contains the current Astro application served through the Cloudflare adapter.

## Ownership

- Owns Astro pages and API routes, shared layouts and chrome, route constants, and application styles.
- Root `public/` owns the static assets consumed by this application.

## Local Contracts

- Keep shared navigation, responsive dock/sidebar, top bar, and page chrome in `layouts/BaseLayout.astro` rather than copying them into pages.
- Keep site icons as official Tabler outline symbols in `layouts/BaseLayout.astro`.
- Keep the sidebar logo and bottom language/donation controls outside the scroll region; only the menu item list may own vertical overflow.
- Keep the sidebar menu scrollbar thin and black-toned via the `sidebar-scroll` utility.
- Keep branded light and dark themes in `styles/global.css` as `afroup` and `afroup-dark`; switch them with a daisyUI `theme-controller` in `layouts/BaseLayout.astro`.
- Keep site-wide Astro view transitions via `ClientRouter` in `layouts/BaseLayout.astro` and reapply the theme on `astro:before-swap` / `astro:after-swap`.
- Keep shared route targets in `lib/paths.ts` and the daisyUI theme and Tailwind entry in `styles/global.css`.
- Keep the search mockup at `/buscar`, wired through `paths.search`.
- Keep the Africa category mockup at `/africa` and `/en/africa`, wired through `paths.africa`.
- Keep the Diaspora category mockup at `/diaspora` and `/en/diaspora`, wired through `paths.diaspora`.
- Keep the Antiracism category mockup at `/antirracismo` and `/en/antirracismo`, wired through `paths.antirracismo`.
- Keep the History category mockup at `/historia` and `/en/historia`, wired through `paths.historia`.
- Keep the Aesthetics category mockup at `/estetica` and `/en/estetica`, wired through `paths.estetica`.
- Keep the News category mockup at `/actualidad` and `/en/actualidad`, wired through `paths.actualidad`.
- Keep the article mockup at `/articulo` and `/en/articulo`, wired through `paths.article`.
- Keep the donation mockup at `/donacion` and `/en/donacion`, wired through `paths.donate`.
- Keep the support mockup at `/apoyanos` and `/en/apoyanos`, wired through `paths.support`.
- Keep the About mockup at `/nosotros` and `/en/nosotros`, wired through `paths.about`.
- Keep the Collaborate mockup at `/colabora` and `/en/colabora`, wired through `paths.collaborate`.
- Keep the Contact mockup at `/contacto` and `/en/contacto`, wired through `paths.contact`.
- Keep the Resources mockup at `/recursos` and `/en/recursos`, wired through `paths.resources`.
- Keep the resource detail mockup at `/recurso` and `/en/recurso`, wired through `paths.resource`.
- Keep the Projects mockup at `/proyectos` and `/en/proyectos`, wired through `paths.projects`.
- Keep the project detail mockup at `/proyecto` and `/en/proyecto`, wired through `paths.project`.
- Keep the People mockup at `/referentes` and `/en/referentes`, wired through `paths.people`.
- Keep the Community hub at `/comunidad` and `/en/comunidad`, wired through `paths.community`, with links to Referentes, Proyectos, Emprendedores, and Colabora.
- Keep the Entrepreneurs mockup at `/emprendedores` and `/en/emprendedores`, wired through `paths.entrepreneurs`.
- Keep the Saved mockup at `/guardados` and `/en/guardados`, wired through `paths.saved`, listing saved articles, resources, and products.
- Keep the Store mockup at `/tienda` and `/en/tienda`, wired through `paths.store`.
- Use official Astro i18n only: Spanish default at unprefixed routes, English under `/en`, dictionaries in `lib/i18n.ts`.
- Build UI with daisyUI first. If daisyUI cannot do it well, use daisyUI plus Tailwind. Use custom CSS only if that combination still cannot do it well.
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
