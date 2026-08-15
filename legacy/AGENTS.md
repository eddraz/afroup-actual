# Legacy Emergency Aid DOX

## Purpose

- `legacy/` contains the legacy emergency-aid Worker, Spanish static UI, admin UI, and SQL-injection tests.

## Ownership

- Owns `worker.js`, the static application under `public/`, the legacy Wrangler configuration, and tests under `test/`.
- Root `migrations/` remains the owner of the D1 schema used by this Worker.

## Local Contracts

- Preserve the public API routes for departments, published entries, and pending submissions, plus the authenticated admin session, category, password, and entry-management routes.
- Public listings expose published records only; public submissions are sanitized, rate-limited, and stored as pending for review.
- Preserve parameterized D1 queries, public-field allowlisting, JSON and field-size limits, and the existing rich-HTML sanitization boundary.
- Preserve session authentication, same-origin enforcement for state-changing admin requests, CSRF checks on protected mutations, login and submission rate limits, secure cookie behavior, and the current security headers/CSP. Admin assets remain no-store and noindex.
- Keep the static emergency-aid and admin UI in Spanish and preserve its current Worker API payloads and status workflow.

## Work Guidance

- Coordinate Worker API or data-shape changes with `public/`, `test/`, and the root-owned D1 migrations.
- Keep static asset fallback through the Worker and retain the explicit `/admin` and `/admin/password` asset routes.
- Do not report legacy tests or deploy validation as passing while the configured entrypoint remains absent.

## Verification

- Verification is currently unresolved: root `bun test legacy/test` imports `legacy/src/index.js`, and `legacy/wrangler.jsonc` also declares `src/index.js`, but that entrypoint is missing. The existing implementation is `legacy/worker.js`.
- Do not claim the declared test or deploy path passes until the missing entrypoint is restored or both references are deliberately corrected.

## Child DOX Index

- No nested child boundaries are needed in `legacy/` now.
