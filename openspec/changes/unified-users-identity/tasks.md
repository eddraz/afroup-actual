# Tasks: unify identity into one `users` table

One person is one `users` row. Stay inside locked A1: slug `usuarios` → `users`, URL stays `/admin/usuarios`, email + password only, no second user table, no OAuth. Strict TDD is on. Each task is one reviewable commit. Tests ship with the behavior they prove.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1100–1600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 schema → PR 2 auth → PR 3 grants → PR 4 chrome → PR 5 docs |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-feat/original-site |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-feat/original-site
400-line budget risk: High
```

Do not apply `--remote` until the Worker that reads `users` is deployed. App and `0020` move together. A code revert after remote migrate breaks login.

Locked A1 (do not reopen A2/A3):

| Topic | Decision |
|-------|----------|
| Table | One `users` table. No second identity table. |
| Slug | Catalog `users`. Page path stays `/admin/usuarios`. |
| Register | No role. Only `users.read` + `users.update`. |
| `/cuenta` | Session and `users.update`. |
| `/admin` | Open shell, including anonymous. |
| New registrant | Sees Users, self-only unless parent / quota / `users.create`. |
| Auth | Email + password only. |

Test command: `bun test src/lib`. Keep tests pure, matching `src/lib/user-bios.test.ts`.

---

## 1. Schema

Start: dual tables `afroup_users` + `admin_users`. Finish: merge helper + tests + forward `0020` exist; public ids stay; admin FKs remap. Rollback: revert the commit; do not apply `0020` remotely.

- [x] RED: add failing `src/lib/identity-merge.test.ts` for public-id preserve, colliding admin id gets a new `users.id`, email match keeps the public hash, invite-only keeps the admin hash, verified public row forces `invite_pending = 0`, and default grants are exactly `users.read` + `users.update`. Run `bun test src/lib/identity-merge.test.ts` and confirm RED. <!-- sdd-owner: implementation -->
- [x] GREEN: add `src/lib/identity-merge.ts` with the pure map / password / verified-pending / default-grant rules from `openspec/changes/unified-users-identity/design.md`. Make `src/lib/identity-merge.test.ts` pass. Do not query D1. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: extend `src/lib/identity-merge.test.ts` + `src/lib/identity-merge.ts` for missing `created_by` / parent-grant map keys (drop the edge) and “never insert an unmapped admin id”. Keep `bun test src/lib/identity-merge.test.ts` green. <!-- sdd-owner: implementation -->
- [x] Add `migrations/0020_unified_users.sql` using the `0011` rebuild pattern (`PRAGMA foreign_keys=OFF`, copy, drop, rename, `PRAGMA foreign_keys=ON`). Create `users` with the designed columns. Copy every `afroup_users.id` unchanged. Merge or insert each `admin_users` row through `admin_id_map`. Remap `admin_user_permissions.user_id`, `admin_user_invitations.user_id`, `admin_parent_grants.child_id` / `parent_id`, and `users.created_by`. Rebuild public child FKs onto `users(id)` without changing those `user_id` values. Rename slug `usuarios` → `users` and permission names to `users:<action>`. Keep display name `Usuarios`. `INSERT OR IGNORE` default `users.read` + `users.update` for every person. Set `sqlite_sequence` to `MAX(users.id)`. Drop `admin_id_map`, `afroup_users`, and `admin_users`. Leave `admin_sessions` / `admin_credentials` and the `afroup_session` cookie name alone. Diff the SQL against `src/lib/identity-merge.test.ts`. Do not run `--remote`. <!-- sdd-owner: implementation -->

## 2. Auth

Depends on 1. Start: APIs still read `afroup_users` / `admin_users`. Finish: one register, one login, one session, one invite/accept path against `users`. Rollback: revert the commit; restore previous queries only if `0020` was not applied.

- [x] RED: add failing cases in `src/lib/identity-merge.test.ts` (or a focused sibling under `src/lib/`) for register writes one `users` row with `role_id = NULL` and only the two default grants, and for invite upsert (no second row; may attach role / extra grants / `created_by`; never delete default grants). Confirm RED with `bun test src/lib`. <!-- sdd-owner: implementation -->
- [x] GREEN: point `src/lib/public-session.ts` `getPublicUser` at `JOIN users`. Delete `getAdminUserByEmail`. Add `getCurrentUser` in `src/lib/admin-scope.ts` (session → `users`, `is_active = 1`, `invite_pending = 0`). Stop email-joining `admin_users` in `src/lib/admin-scope.ts`. Keep cookie name `afroup_session`. Verify `bun test src/lib`. <!-- sdd-owner: implementation -->
- [x] Wire `src/pages/api/register.ts` to insert `users` (hash, `verified_at = NULL`, `role_id = NULL`, `invite_pending = 0`, `is_active = 1`, `created_by = NULL`), grant only `users.read` + `users.update`, and keep `afroup_email_verifications` + the existing verify email. Point `src/pages/api/verify.ts` at `users`. Reject taken `users.email`. No role. No `users.create` / `users.delete`. <!-- sdd-owner: implementation -->
- [x] Wire `src/pages/api/login.ts` to authenticate `users` only. Reject in order: missing fields → unknown email / bad password (`invalid_credentials`) → `invite_pending` (`account_pending`) → `is_active = 0` (`account_inactive`) → `verified_at` null (`unverified`). Success creates `afroup_sessions` for `users.id` and returns `{ user, permissions }`, not `admin`. Delete `src/pages/api/admin/login.ts`. Update `src/pages/api/me.ts` to the same payload (`permissions` = slug → unique actions from `mergePermissions(effectivePermissions(users.id))`). Unauthenticated `/api/me` stays `{ "ok": false }` + 401. Point `src/pages/api/admin/session.ts` at `getCurrentUser` or delete the email-join `not_admin` path. <!-- sdd-owner: implementation -->
- [x] Point `src/pages/api/password.ts`, `src/pages/api/avatar.ts`, `src/pages/api/recover.ts`, and `src/pages/api/reset.ts` at `users`. Password and avatar also require `users.update`. Reset/recover still use `afroup_password_resets.user_id → users.id`. <!-- sdd-owner: implementation -->
- [x] Rewrite `src/pages/api/admin/users/invite.ts` to `hasPermission(users, create)` + quota, then upsert `users`: no row → insert invite-pending with nullable hash; invite-pending → update name / role / extra grants / `created_by` if allowed and resend; verified → attach role / extra grants / `created_by` if NULL, do not flip `invite_pending` or overwrite the hash. Merge extra grants with `INSERT OR IGNORE`. Never delete default `users.read` / `users.update`. <!-- sdd-owner: implementation -->
- [x] Update `src/pages/api/admin/users/accept.ts` plus `src/pages/admin/usuarios/aceptar.astro` and `src/pages/en/admin/usuarios/aceptar.astro` to join `users`. Accept sets hash, `verified_at = now`, `invite_pending = 0`, and consumes the token. <!-- sdd-owner: implementation -->
- [x] Update `src/pages/api/account.ts` to require session + `users.update` + confirm phrase, delete the avatar object, `DELETE FROM users WHERE id = ?`, null `created_by` on remaining children, and clear the cookie. Cascades must remove grants, sessions, bios, invitations, and parent grants. No leftover identity row. <!-- sdd-owner: implementation -->

## 3. Grants

Depends on 2. Start: `hasPermission` unused; scope joins `admin_users` / slug `usuarios`. Finish: every gate and list helper keys off `users.id` + slug `users`; default `users.update` is not a directory write. Rollback: revert the commit.

- [ ] RED: add failing `src/lib/rbac.test.ts` for direct hit, role hit, neither, and inactive user. Confirm RED with `bun test src/lib/rbac.test.ts`. <!-- sdd-owner: implementation -->
- [ ] GREEN: point `src/lib/rbac.ts` `loadAdminUser` / `hasPermission` / `effectivePermissions` at `users` (not `admin_users`). Keep direct **or** role grant. Make `src/lib/rbac.test.ts` pass. <!-- sdd-owner: implementation -->
- [ ] RED: add failing `src/lib/admin-scope.test.ts` for self-only list without parent / quota / create, parent adds creator, quota / create adds owned children and slices quota, `canManageUser` denies other-user update on default grants, self cannot delete self, and missing module permission denies even self-adjacent child writes. Confirm RED with `bun test src/lib/admin-scope.test.ts`. <!-- sdd-owner: implementation -->
- [ ] GREEN: rewrite `src/lib/admin-scope.ts` to `listVisibleUsers` / `canManageUser` on slug `users`. Permission first, then self / `created_by` / parent / quota. Point `src/lib/permission-grants.ts` `effectiveGrant` at `users`. Change `src/lib/user-bios.ts` `translationAccessForEmail` off email-join; use `users.id` + slug `users` + `users.update` translate flags; `saveUserBios` updates `users.bio`. Make `src/lib/admin-scope.test.ts` pass. Keep `src/lib/user-bios.test.ts` green. <!-- sdd-owner: implementation -->
- [ ] Gate mutating admin APIs with `hasPermission` + `canManageUser`: `src/pages/api/admin/roles.ts` (`create_user` writes `users`), `src/pages/api/admin/permissions.ts`, and `src/pages/api/admin/languages.ts`. 401 if no user, 403 if no permission. No live grant or gate may still key off `usuarios`. <!-- sdd-owner: implementation -->

## 4. Chrome

Depends on 3. Start: `/cuenta` is session-only; `/admin` client-bounces non-admins; menu is static. Finish: permission-gated account surfaces; open admin shell; server-filtered menu and pages; EN/ES lockstep. Rollback: revert the commit.

- [ ] Gate `src/pages/cuenta.astro` and `src/pages/en/cuenta.astro` on session **and** `users.update`; otherwise redirect to login. Update `public/session-user.js` so `data-session-link` gets `data-session-href` only when `permissions.users` includes `update`; stop writing `afroup-role=admin`. <!-- sdd-owner: implementation -->
- [ ] Open `src/layouts/AdminLayout.astro`: remove the `afroup:session` email-join bounce. Server-filter menu items with `hasPermission(module, "read")`. Dashboard link always visible. Anonymous visitors get the shell, locale switch, and back-to-site. Client JS is not the lock. <!-- sdd-owner: implementation -->
- [ ] Set `prerender = false` on `src/pages/admin/index.astro` and `src/pages/en/admin/index.astro`. Hide privileged stats / quick actions / activity unless the actor can read that module. Anonymous and default registrants see the empty shell, not mock counts. <!-- sdd-owner: implementation -->
- [ ] Server-gate `src/pages/admin/usuarios.astro` and `src/pages/en/admin/usuarios.astro` with `users.read`. List through `listVisibleUsers`. Hide invite / create UI without `users.create`. Keep URL `/admin/usuarios`. Catalog slug is `users`. A default registrant sees one self-card. <!-- sdd-owner: implementation -->
- [ ] Server-gate the remaining admin pages in both locales: `src/pages/admin/idiomas.astro` + `src/pages/en/admin/idiomas.astro` (`idiomas.read`); `modulos.astro` (`modulos.read`); `permisos.astro` (`permisos.read`); `roles.astro` (`roles.read`). Same-slice ES/EN. Denied page is not an authorized view without client JS. <!-- sdd-owner: implementation -->
- [ ] Set `prerender = false` and server-gate mock content pages in both locales: `src/pages/admin/articulos.astro` + `src/pages/en/admin/articulos.astro` (`articulos.read`); `comentarios.astro` (`comentarios.read`); `proyectos.astro` (`proyectos.read`). Missing permission → empty/forbidden, not prerendered mocks. <!-- sdd-owner: implementation -->
- [ ] Update `src/pages/login.astro` and `src/pages/en/login.astro` redirects from `permissions`, not `admin`: `next` wins; else `/cuenta` when the actor has `users.update`; else open `/admin`. Surface `account_pending` / `account_inactive`. Do not add OAuth, Passkeys, or a third-party IdP. <!-- sdd-owner: implementation -->

## 5. Docs

Depends on 4. Start: DOX still describes two identity tables and `usuarios:update`. Finish: nearest docs match the shipped contract. Rollback: revert the commit.

- [ ] Update `migrations/AGENTS.md` with `0020_unified_users.sql`: one `users` table, public-id preserve, admin-id map, slug A1, default grants, drop `afroup_users` + `admin_users`, forward-only, backup before `--remote`, app and migrate move together. Lead with the cutover rule. <!-- sdd-owner: implementation -->
- [ ] Update `src/AGENTS.md` identity / scope / bio contracts: `getCurrentUser`, slug `users`, `hasPermission` first, `listVisibleUsers` self unless parent / quota / `users.create`, `/cuenta` needs `users.update`, `/admin` is an open filtered shell, `/api/me` returns `permissions` not `admin`. Remove stale `usuarios:update` and email-join notes. <!-- sdd-owner: implementation -->

---

## Verify

- [ ] Run `bun test src/lib` (and `bun test legacy/test src/lib` if the package script is used). Confirm merge/id-map, default grants, login/invite cases, list scope, and the new gates. Apply `0020` only with `bun run db:migrate:local`. Smoke locally: existing `afroup_session` still loads, new register sees Users/self, `/admin` opens logged out. Do not run `--remote` in this change. <!-- sdd-owner: implementation -->

## Parent

- [ ] Resolve delivery before apply: High 400-line risk under `ask-on-risk`. Confirm chain strategy (`stacked-to-main` or `feature-branch-chain`) or a recorded `size:exception`. Do not launch apply until that decision exists. <!-- sdd-owner: parent -->
- [ ] After apply, start or reuse bounded review on the chosen PR slice. <!-- sdd-owner: parent -->
