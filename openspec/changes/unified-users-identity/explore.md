# Explore: unified-users-identity

## Intent

Replace the split identity (`afroup_users` + `admin_users` joined by email) with one `users` table. Roles and permission grants hang off that single user id. Public registration creates a person and grants only `users.read` + `users.update`. `/cuenta` is visible only with `users.update`. `/admin` is open to everyone; the admin menu and pages appear only when the actor has permission on that module. No third-party auth.

## Current state

### Two people, one email

Public accounts live in `afroup_users` (migrations `0009`, `0012`, `0013`, `0017`):

- `id`, `name`, `email` unique, `password_hash`, `verified_at`, `bio`, `avatar_url`
- Children: `afroup_sessions`, `afroup_email_verifications`, `afroup_password_resets`, `afroup_user_bios`

Admin accounts live in `admin_users` (migrations `0010`, `0011`, `0014`):

- `id`, `name`, `email` unique, nullable `password_hash`, `role_id`, `is_active`, `invite_pending`, `created_by`
- Children: `admin_user_permissions`, `admin_user_invitations`, `admin_parent_grants`

There is no shared primary key. `getCurrentAdmin` (`src/lib/admin-scope.ts`) loads the public session user, then selects `admin_users` **by email**. `/api/login` and `/api/me` do the same via `getAdminUserByEmail`.

Consequences already in production code:

- Two ids for the same person. Sessions, bios, and password resets use the public id. Roles, grants, invites, and `created_by` use the admin id.
- Two password hashes. `/cuenta` password change updates `afroup_users` only.
- Account delete (`src/pages/api/account.ts`) removes the public row and leaves an orphan `admin_users` row.
- Admin invite (`src/pages/api/admin/users/invite.ts`) inserts only into `admin_users`. Accept writes `admin_users.password_hash`. Public login (`src/pages/api/login.ts`) reads only `afroup_users`. `/admin/login` redirects to `/login`. Invited-only admins cannot sign in unless they also registered publicly with the same email.
- `/api/admin/login` still authenticates `admin_users` but no current page uses it.

Legacy `admin_sessions` and `admin_credentials` (`0001`, `0003`) are unused by the Astro app.

### Sessions

One cookie: `afroup_session` → `afroup_sessions.user_id` → `afroup_users.id`. TTL 30 days. Logout destroys that row. There is no admin session table in the live path.

### RBAC

Catalog:

- Modules: `articulos`, `comentarios`, `proyectos`, `usuarios`, `modulos`, `permisos`, `roles`, plus later `idiomas` and `traduccion`.
- Actions: `create | read | update | delete`.
- Roles: Administrador / Editor / Moderador, via `admin_users.role_id`.
- Direct grants: `admin_user_permissions` with `parent`, `quota`, `translate_manual`, `translate_ai`.
- `admin_parent_grants` still exists; live scope uses the `parent` flag on the `usuarios` permission (`0015`).

Helpers:

- `hasPermission` (`src/lib/rbac.ts`) is defined and **never called**.
- `effectiveGrant` joins `admin_users` by **admin id**.
- `listVisibleAdminUsers` scopes by self / `created_by` / parent flag / quota.
- `canManageAdminUser` allows self update/delete-except-self, or any child, without checking the module permission first.
- `translationAccessForEmail` maps email → admin id → `usuarios:update` translate flags.

Public registration inserts `afroup_users` and sends a verification email. It grants **no** permissions.

### Page gates

| Surface | Actual gate |
|---|---|
| `/cuenta`, `/en/cuenta` | Public session exists. No `users.update` check. |
| Public header avatar | Always points at `/cuenta` once `/api/me` returns a user. |
| `/admin`, `/en/admin` | Prerendered. No server actor check. Client script redirects to `/login` unless `/api/me` returns `admin`. |
| Admin menu | Static. Every item is rendered. |
| `/admin/usuarios`, `/admin/idiomas` | Server `getCurrentAdmin` (email join). No module permission. |
| `/admin/articulos`, `comentarios`, `proyectos` | Prerendered mocks. Client-only admin lock. |
| `/admin/modulos`, `permisos`, `roles` | Load D1 with no actor check. |
| Admin APIs (`roles`, `permissions`, `users/invite`, `languages`) | `getCurrentAdmin` only. No `hasPermission(module, action)`. |
| `/admin/login` | Redirects to `/login`. |

`AdminLayout` treats `/admin/login` and `/admin/usuarios/aceptar` as public. After `afroup:session`, anyone without an `admin_users` email match is sent to `/login`. That is the opposite of “everyone can open `/admin`”.

Login success redirects admins to `/admin` and everyone else to `/cuenta`.

### Platform

Astro 7 on Cloudflare Workers (`wrangler.jsonc`). D1 binding `DB` / `afroup-db`, migrations in `./migrations`. Forward-only D1 migrations; table rebuilds already follow the `PRAGMA foreign_keys=OFF` + copy + rename pattern (`0011`). Tests: `bun test legacy/test src/lib`. No identity/RBAC tests in `src/`.

Duplicate English routes live under `src/pages/en/**` and must stay in lockstep.

## Gap vs intent

1. Identity is two tables joined by email, not one `users` row.
2. Grants and roles hang off `admin_users.id`, not the session user id.
3. Registration does not grant `users.read` + `users.update`.
4. `/cuenta` is session-gated, not permission-gated.
5. `/admin` is treated as an admin-only app, not an open shell with a filtered menu.
6. Menu and most admin pages ignore module permissions.
7. The live module slug is `usuarios`, not `users`. Product language is `users.read` / `users.update`.
8. Invite and public register create different kinds of person.
9. Client `admin` boolean is a proxy for “has an admin_users row”, not “has any module permission”.

## Options

### A. Rebuild into `users`, remap admin FKs (recommended)

Create `users` with the union of both schemas. Copy every `afroup_users` row **preserving public ids** so sessions, bios, verifications, and resets stay valid. For each `admin_users` row:

- matching email → copy `role_id`, `is_active`, `invite_pending`, `created_by` onto that `users` row; record `admin_id → users.id`
- no public row → insert a new `users` row (invite-only admin)

Remap `admin_user_permissions.user_id`, `admin_user_invitations.user_id`, `admin_parent_grants`, and `created_by` through that map. Point session/verification/reset/bio FKs at `users(id)`. Seed default `users.read` + `users.update` grants. Drop `afroup_users` and `admin_users`.

Password on conflict: keep the public hash (that is what `/api/login` already uses). Invite-only rows keep the admin hash. Set `verified_at` on invite accept so one login path works.

Keep grant metadata (`parent`, `quota`, translate flags) and roles. Do not introduce a third-party IdP.

### B. Rename `afroup_users` → `users` and attach admin columns only

Smaller SQL if almost every admin already has a public row. Still needs the same email merge, admin-id remap, and invite-only inserts. Same end state as A; A is just more explicit about the rebuild.

### C. Link table (`admin_users.user_id → users.id`)

Removes the email join without collapsing identity. Rejected: product requires one table named `users`, and roles/grants must hang off that id.

### Module-slug fork (must decide in proposal)

The current `usuarios` module is “public accounts and admin permissions”. Product default grants are `users.read` + `users.update`, and `/admin` shows any module the user can access.

- **A1. Rename `usuarios` → `users`.** Default grants then show a Users item in the admin menu. `listVisibleAdminUsers` without parent/quota already returns only self, so the page is mostly a self-card. `/cuenta` and `/admin/usuarios` both key off the same permission.
- **A2. Split capabilities.** Keep a self-profile permission (`users.update` for `/cuenta`) and a separate admin-management module. Closer to today’s mental model, but it is a second module and not what the prompt literally says.
- **A3. Same `users` module, hide default grants from the admin nav** (show the item only when the actor has `users.create` / parent / quota / a role). Matches “menu by permission” less literally.

Recommendation: **A1** unless product explicitly does not want registered people inside `/admin/usuarios`. Call that out in the proposal.

## First slice

Stay inside identity + gating. Do not rebuild articles/comments/projects.

1. D1 migration: `users` table, remapped FKs, `usuarios` slug → `users` (or documented alias), default grants for every existing person, drop the two old user tables.
2. One login: `/api/login` against `users`; check `verified_at`, `invite_pending`, `is_active`. Delete or make `/api/admin/login` a shim.
3. Session stays one cookie, now `sessions.user_id → users.id` (rename optional in this slice).
4. Register: insert `users`, grant `users.read` + `users.update` only, keep email verification. No role.
5. Invite: upsert the same `users` row, attach extra grants/role/`created_by`, send accept link. Accept sets password + `verified_at` + clears `invite_pending`.
6. `getCurrentAdmin` becomes “current user”. `effectiveGrant` / `hasPermission` use `users.id`. `/api/me` returns the user plus effective module actions, not an `admin` boolean.
7. `/cuenta`: require session **and** `users.update`. Header account link follows the same rule.
8. `/admin`: no email-join redirect. Render the shell for everyone. Filter `AdminLayout` menu by module permission. Server-gate each admin page and mutating API with `hasPermission(module, action)`. Dashboard must not leak privileged data to anonymous or default users.
9. Account delete cascades the single `users` row (grants, sessions, bios, invites).
10. Keep `src/pages/en/**` in lockstep. Add `src/lib` tests for merge/id-map, default grants, and the new gates.

Out of this slice: rewriting mock content modules, dropping parent/quota/translate, touching legacy `worker.js` credentials, visual redesign.

## Non-goals

- OAuth, Passkeys, Magic-link-only auth, or any third-party IdP
- Multiple people per email
- Soft-delete / account recovery beyond the existing password-reset table
- Changing daisyUI structure beyond showing/hiding menu items and empty admin states
- Migrating or deleting unused `admin_sessions` / `admin_credentials` (optional cleanup later)
- Making articles/comments/projects real data
- Per-locale permission names in the database (UI can stay Spanish; slugs should be `users`, …)

## Risks

- **Email merge + two passwords.** Wrong hash choice locks someone out. Prefer public hash; document invite-only rows.
- **Admin id remap.** `created_by`, grants, invitations, and parent rows break if any admin id is copied verbatim into the public id space.
- **Live sessions.** Preserving public ids keeps existing cookies. Remapping public ids would sign everyone out.
- **D1 rebuild.** Forward-only migrations; test `--local` before `--remote`. Foreign keys must be rebuilt, not only `ALTER TABLE RENAME`.
- **`users.read` vs admin directory.** Default grants can expose `/admin/usuarios` unless list scope stays “self unless parent/quota/create”.
- **Open `/admin`.** Several admin pages are prerendered and already leak mock stats + the full menu if JS is skipped. Server-side menu and page gates are mandatory, not cosmetic.
- **`canManageAdminUser`.** Today a user can mutate their own admin row without a module check. After default `users.update`, that becomes every registered person unless self-scope is explicit.
- **Duplicate EN/ES pages.** Easy to gate one locale and leave the other open.
- **No current identity tests.** Regression will be silent without new lib tests.
- **Invite vs verify.** One email-proof path after merge, or invited users bounce on `unverified`.

## Recommendation

Take **option A + slug A1**. One `users` table, public ids preserved, admin FKs remapped, default `users.read`/`users.update` grants, single password/session, `/cuenta` gated on `users.update`, `/admin` as an open shell with a permission-filtered menu and server-side page/API gates. Resolve the “does a new registrant see Users in `/admin`?” question in the proposal before specs.
