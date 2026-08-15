# Design DOX

## Purpose

- `design/` is the visual source of truth for AfroUp product screens and the sitemap used to guide Astro implementation.

## Ownership

- Owns the 19 linked high-fidelity product screens, `AfroUp Mapa del sitio.html`, shared visual assets, and the shared design CSS and JavaScript.
- `assets/`, `brand-site.css`, and `site-pages.css` carry conventions shared across the screen set.

## Local Contracts

- Preserve visual parity between each implemented product page and its corresponding design screen.
- Keep product UI and navigation copy in Spanish unless a requirement explicitly changes the language.
- Preserve the evidenced AfroUp system: Baloo 2 display type, Mulish body type, ink `#17150F`, cream `#FBF5E9`, cyan `#18D2E2`, gold `#F5C03A`, blue `#0A79A6`, rounded surfaces, and the shared logo, mark, and pattern assets.
- Keep `AfroUp Mapa del sitio.html` as the navigable inventory of the product screens.

## Work Guidance

- Put reusable visual behavior and styles in the existing shared assets before duplicating them in a screen.
- When a screen is added, removed, or renamed, update its links and count in `AfroUp Mapa del sitio.html`.
- Check shared asset changes against every screen that imports the affected file.

## Verification

- Visual parity is required, but no automated design verification exists. Manually open each affected screen and the sitemap, then check links, assets, and responsive presentation against the intended design.

## Child DOX Index

- No nested child boundaries are needed in `design/` now.
