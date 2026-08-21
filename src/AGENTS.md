# Astro App DOX

## Purpose

- `src/` contains the current Astro application served through the Cloudflare adapter.

## Ownership

- Owns Astro pages and API routes, shared layouts and chrome, route constants, and application styles.
- Root `public/` owns the static assets consumed by this application.

## Local Contracts

- Keep shared navigation, responsive dock/sidebar, top bar, and page chrome in `layouts/BaseLayout.astro` rather than copying them into pages. Admin puts the page title in `layouts/AdminLayout.astro` as the only `h1`; module pages do not repeat it.
- Keep the AfroUp wordmark and AU mark as the SVG `components/AfroUpLogo.astro`. The wordmark paths in `lib/logo.ts` come from `public/assets/logo-black.svg`, mapped to the 1600x288 box. Use `variant="wordmark"` or `variant="mark"`, scale with `height`, and color through `currentColor` or the `color` prop. Do not swap PNG logo files for in-app chrome. Public and admin sidebars use the wordmark when expanded and the AU mark when collapsed via the desktop collapse toggle (`data-site-collapsed` / `data-admin-collapsed`).
- Keep signed-in photo and name in `components/SessionAvatar.astro` and `components/SessionUser.astro`; hydrate them from `/api/me` via `public/session-user.js`. Public chrome shows a circular guest avatar (`btn-circle` with user icon) linking to `/login` until `/api/me` paints the signed-in menu. Admin puts `SessionUser` with `menu` at the bottom of the sidebar; a click opens a daisyUI popover with account ("Tu cuenta"), back-to-site, and sign out.
- Completing `/api/reset` must set `verified_at` and clear `invite_pending`. An unverified login opens a daisyUI modal that can resend the password-reset email through `/api/recover`.
- Keep admin visibility scoped in `lib/admin-scope.ts`: a user sees themselves, records they created, and records shared with them via `record_shares`. Parent no longer opens the creator tree.
- Keep permission assignment in `components/PermissionMatrix.astro`: show one compact chip per flag in the matrix, with a daisyUI tooltip for the permission name (`Permitir` → Allow, `Todos`/`5` → Limit, `A mano`/`Con IA` → Translation), and edit Allow, Limit, and Translation in one modal per module. Allow is the action grant. Translation is two independent checks on every module action: by hand and with AI. The AI chip uses `badge-ai`. An empty Limit means all matching records. Persist those values through `lib/permission-grants.ts` as `permissionIds`.
- Keep public language visibility in `site_languages` and `components/LanguageSwitcher.astro`: 0/1 visible languages hide the switcher, 2 show a sigla toggle, 3+ show a select. Admin uses the same switcher and `resolveRequestCopy` so a new language dictionary covers public and admin UI.
- Keep account bios per locale in `afroup_user_bios` and the shared `components/AccountPage.astro` form. The `usuarios:update` translation checks stay independent: by hand writes translations, with AI unlocks Workers AI. Hide the page language select when the user has neither check. Never copy the primary bio into an empty locale field; show it as a non-invasive original guide. AI reviews the current locale in a modal before applying. AI-only fields stay locked, but an applied AI draft may persist.
- Keep the page language select in `components/PageLocaleSwitch.astro`, at the top-right of the page title. Only nodes marked `data-i18n-panel` change when the selected language changes.
- Keep site icons as official Tabler outline symbols in `layouts/BaseLayout.astro` and `layouts/AdminLayout.astro`.
- Keep the sidebar logo and bottom language/donation/session controls outside the scroll region in public and admin; only the menu item list may own vertical overflow.
- Keep public chrome viewport-locked (`#site-layout-drawer`): navbar, dock, sidebar logo, and sidebar footer stay fixed. Only `.sidebar-scroll` (menu) and `.site-content-scroll` (main + footer) may scroll, both with the thin black `sidebar-scroll` utility.
- Keep admin Studio chrome viewport-locked (`#admin-layout-drawer`): top navbar, sidebar logo header, and sidebar footer remain fixed. Only the sidebar navigation menu (`ul.sidebar-scroll`) and the main content area (`main.admin-content-scroll`) scroll independently with thin, black-toned scrollbars (`scrollbar-width: thin; scrollbar-color: #111111 transparent`).
- Keep branded light and dark themes in `styles/global.css` as `afroup` and `afroup-dark`; switch them with a daisyUI `theme-controller` in `layouts/BaseLayout.astro` and `layouts/AdminLayout.astro`.
- Keep AI actions in purple via the `ai` theme token and `btn-ai` / `checkbox-ai` / `badge-ai`. Only elements that execute or grant AI use those classes.
- Keep site-wide Astro view transitions via `ClientRouter` in `layouts/BaseLayout.astro` and `layouts/AdminLayout.astro` and reapply the theme on `astro:before-swap` / `astro:after-swap`.
- Keep shared route targets in `lib/paths.ts` and the daisyUI theme and Tailwind entry in `styles/global.css`.
- Keep editorial content in `article_categories` / `articles` with per-locale title, description, rich text `content_html`, and `og_json` Open Graph / Twitter metadata. Each locale can fill Open Graph fields manually; `og:image` and `twitter:image` use R2Uploader (`media` bucket, `og/` prefix) rather than a URL-only field. Generate with AI (`@cf/deepseek-ai/deepseek-v4-flash-0731`) when the user has `translate_ai` on `articulos` or `categorias` (create or update). Article and category forms expose AI generation via a "Generar contenido con IA" button that opens a daisyUI modal asking for the instruction/prompt, generating title, description, slug, tags, body, and OG from the prompt per selected locale. They also expose content translation from original Spanish via a "Traducir con IA" button that opens a daisyUI modal allowing the user to select the target language to translate to, translating title, description, rich content/Editor.js blocks, and metadata via `/api/admin/translate`, `components/EditorialTranslateModal.astro`, `components/ArticleEditor.astro`, and `components/CategoryEditor.astro`. AI translation requires all fields in the primary Spanish (`es`) form to be complete: categories require title and description; articles require title, description/dek, and rich content body. Saving an article as a draft (`status: 'draft'`) requires only the primary title; all other fields are optional. Publishing an article (`status: 'published'`) strictly requires all fields: primary title, description/dek, rich content body, at least one category, at least one tag, cover image, and valid slug. Categories require title and description. Missing locale sources fall back to the primary locale. Rows with `created_by` null are site catalog and stay visible to anyone with module read; newly created articles reference the session creator. An article can belong to many categories via `article_category_map`, carry tags in `article_tags`, persist unique tags globally in `tags` (`/api/admin/tags`), provide autocomplete and quick suggestions in the admin `ArticleEditor.astro` chips input, and render as interactive links (`/buscar?q={tag}`) in public article detail pages for cross-article discovery. Article content editing in the admin uses Editor.js (`lib/editorjs-client.ts` and `lib/editorjs.ts`) with one editor per configured site language, lazy-initialized when that locale panel is shown, and Editor.js chrome translated from `editorjs*` UI dictionary keys (generated with the language dictionary when a new site language is created), with rich block support (headers, paragraphs, lists, quotes, figures/images, carousels, videos, tables, delimiters, and embeds), bi-directional HTML serialization/parsing, AI translation sync, and a persistent "Preview" action that autosyncs drafts to D1 and opens `/{category}/{article}?preview=true`. Public URLs are `/{category}/{article}` with full visual parity to `design/AfroUp Articulo.html`. Saving a published locale upserts `search_documents`; drafts and deletes remove those rows.
- Category color themes aligned with the sidebar navigation dot tokens (`africa`/`actualidad` → `primary`, `diaspora`/`estetica` → `accent`, `antirracismo`/`historia` → `secondary`) via `lib/category-routes.ts` `getCategoryTheme`.
- Keep article author avatars with high-contrast brand gradient (`bg-gradient-to-tr from-primary via-primary/90 to-accent text-primary-content font-extrabold`) and double-ring offset (`ring-2 ring-primary/40 ring-offset-4 ring-offset-base-100 shadow-md`) and plain-text sanitized bios so the initial and card stay vibrant and readable in light and dark mode.
- Keep the article donation CTA as daisyUI `btn-neutral` (ink) with `donateCta` copy (`Haz tu Donación`). Do not use `btn-primary` or `navDonate` there: mockup `.btn-primary` is ink, not brand blue.
- R2Uploader always exposes Generate with AI as a button that opens a daisyUI modal. Callers pass `promptModel`, `imageModel`, `videoModel`, `musicModel`, `textModel`, and `prompt` (initial prompt). Hide with `canUseAi={false}`. Article covers may pass `allowFormContext`.
- Keep R2 storage management at `/admin/almacenamiento` and `/en/admin/almacenamiento` via `lib/r2-storage.ts`, `/api/admin/r2`, and `/api/admin/r2/stream`, providing bucket inspection (`AVATARS`, `MEDIA`, `DOCUMENTS`), multi-type item filtering, daisyUI drawers for upload and detailed item preview/metadata, direct streaming/downloading, and object deletion. File uploads and image optimization are encapsulated in `components/R2Uploader.astro` and `lib/image-optimizer.ts`, supporting drag-and-drop, clipboard pasting, URL fetching, format conversion (WebP/JPEG/PNG), and constrained resolution scaling.
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
- Keep the entrepreneur detail mockup at `/emprendimiento` and `/en/emprendimiento`, wired through `paths.entrepreneur`.
- Keep the Saved mockup at `/guardados` and `/en/guardados`, wired through `paths.saved`, listing saved articles, resources, and products.
- Keep the Store mockup at `/tienda` and `/en/tienda`, wired through `paths.store`.
- Keep the product detail mockup at `/producto` and `/en/producto`, wired through `paths.product`.
- Keep the login mockup at `/login` and `/en/login`, wired through `paths.login` in the sidebar and dock.
- Use official Astro i18n only: Spanish default at unprefixed routes, English under `/en`, dictionaries in `lib/i18n.ts`.
- Build UI with daisyUI first. If daisyUI cannot do it well, use daisyUI plus Tailwind. Use custom CSS only if that combination still cannot do it well.
- Keep short form success and error messages in `AfroUpFeedback.toast` from `public/form-feedback.js`. Use `AfroUpFeedback.modal` when the user must confirm a next step. Keep existing input-collecting dialogs as page-owned modals.
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
