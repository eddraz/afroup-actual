# Design: one `users` row per person

One D1 rebuild creates `users`. Public ids stay. Admin foreign keys remap. Register writes that table and grants only `users.read` + `users.update`. `/cuenta` requires `users.update`. `/admin` is an open shell; menu and pages follow module permission. No third-party auth.

This design answers the locked proposal. Specs were not on disk when it was written; tasks must still cover the proposal success criteria.

## Quick path

1. Add a pure merge/id-map helper and `src/lib` tests (strict TDD).
2. Ship one forward D1 migration that builds `users`, remaps admin FKs, renames slug `usuarios` → `users`, seeds default grants, and drops `afroup_users` + `admin_users`.
3. Point session, login, register, invite, `/api/me`, and gates at `users.id` + `hasPermission`.
4. Apply `--local`, export a remote backup, then move app deploy and `--remote` together.

## Locked decisions

| Topic | Decision |
| --- | --- |
| Identity table | One table named `users`. Roles and grants hang off that id. |
| Public ids | Copy every `afroup_users.id` unchanged so live `afroup_session` cookies still resolve. |
| Admin ids | Never copy an admin id into `users.id`. Build `admin_id → users.id` and remap FKs. |
| Password on email match | Keep the public hash. Invite-only rows keep the admin hash. |
| Register | Insert `users`, no role, grant only `users.read` + `users.update`. |
| Invite | Upsert the same `users` row. May add role, extra grants, and `created_by`. |
| `/cuenta` + header account link | Session **and** `users.update`. |
| `/admin` | Open to anonymous visitors. Not an admin-only app. |
| Admin chrome | Menu item and page exist only with that module permission. |
| Module slug | `usuarios` → `users` (A1). URL stays `/admin/usuarios`. |
| New registrant | Sees Users, self-scoped, unless parent / quota / `users.create`. |
| Auth providers | Email + password only. |
| Cookie | `afroup_session` stays. Session table rename is out of this slice. |
| Legacy tables | Leave `admin_sessions` / `admin_credentials` untouched. |

## Current write path (must die)

```text
register  → afroup_users          → no grants
login     → afroup_users.hash     → afroup_sessions.user_id
/api/me   → session user + admin_users by email → { admin: boolean }
invite    → admin_users only      → cannot log in until a public row exists
/cuenta   → session exists
/admin    → client bounce unless admin_users email match
```

Target:

```text
register / invite → users
login             → users.hash + verified_at + !invite_pending + is_active
session           → afroup_sessions.user_id → users.id
/api/me           → user + effective module actions
gates             → hasPermission(module, action) then scope
```

## Target schema

Next migration: `migrations/0020_unified_users.sql`.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  verified_at TEXT,
  bio TEXT,
  avatar_url TEXT,
  role_id INTEGER REFERENCES admin_roles(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  invite_pending INTEGER NOT NULL DEFAULT 0 CHECK (invite_pending IN (0, 1)),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Column | Source | Notes |
| --- | --- | --- |
| `id` | `afroup_users.id` or new | Public ids preserved. Invite-only admins get a **new** id. |
| `password_hash` | public, else admin | Nullable only while `invite_pending = 1`. |
| `verified_at` | public | Accept-invite sets this so one login path works. |
| `role_id` | admin | Register leaves NULL. |
| `is_active` | admin, else `1` | Login and `getCurrentUser` reject `0`. |
| `invite_pending` | admin, else `0` | Forced `0` when the public row is already verified. |
| `created_by` | remapped admin `created_by` | Points at `users.id`. Public-only rows stay NULL. |

Keep grant metadata tables. Rebuild only their user FKs:

- `admin_user_permissions.user_id → users(id) ON DELETE CASCADE`
- `admin_user_invitations.user_id → users(id) ON DELETE CASCADE`
- `admin_parent_grants.child_id / parent_id → users(id) ON DELETE CASCADE`
- `afroup_sessions.user_id → users(id) ON DELETE CASCADE`
- `afroup_email_verifications.user_id → users(id) ON DELETE CASCADE`
- `afroup_password_resets.user_id → users(id) ON DELETE CASCADE`
- `afroup_user_bios.user_id → users(id) ON DELETE CASCADE`

`users.created_by` has no FK during the rebuild (self-reference while rows are inserted). App code treats it as `users.id`. On account delete, children get `created_by = NULL`.

Do **not** rename session / verification / reset / bio tables in this slice.

## D1 rebuild

Follow the existing `0011` pattern: `PRAGMA foreign_keys = OFF`, copy, drop, rename, `PRAGMA foreign_keys = ON`. D1 cannot `ALTER` a foreign key in place.

### 1. Staging map

```sql
CREATE TABLE admin_id_map (
  admin_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL
);
```

### 2. Copy public rows (preserve ids)

Insert every `afroup_users` row into `users` with the same `id`. Set `role_id = NULL`, `is_active = 1`, `invite_pending = 0`, `created_by = NULL`.

### 3. Merge or insert each `admin_users` row

For each admin email:

| Case | `users` row | Password | Map |
| --- | --- | --- | --- |
| Email matches a public row | Update `role_id`, `is_active`, `invite_pending`, stash raw `created_by` for remap | Keep public hash | `admin_id → existing users.id` |
| No public row (invite-only) | Insert a **new** `users` id | Keep admin hash | `admin_id → new users.id` |

If the public row already has `verified_at`, set `invite_pending = 0` even when the admin row is still pending.

Never `INSERT` an admin id that already belongs to a different public person.

### 4. Remap admin FKs

```text
admin_user_permissions.user_id     = map(admin_id)
admin_user_invitations.user_id     = map(admin_id)
admin_parent_grants.child_id       = map(admin_id)
admin_parent_grants.parent_id      = map(admin_id)
users.created_by                   = map(old_admin_created_by)
```

Drop any parent-grant or `created_by` edge whose map key is missing. Rebuild the child tables so SQLite FKs point at `users(id)`.

Public child tables keep their `user_id` values (already public ids). Rebuild them only to retarget `REFERENCES users(id)`.

### 5. Slug A1

```sql
UPDATE admin_modules
   SET slug = 'users'
 WHERE slug = 'usuarios';

UPDATE admin_permissions
   SET name = 'users:' || action
 WHERE module_id = (SELECT id FROM admin_modules WHERE slug = 'users');
```

Keep the catalog display name `Usuarios` (UI language). Permission **slugs/names** become `users:read` and `users:update`.

### 6. Default grants

For every `users` row, `INSERT OR IGNORE` direct grants for `users.read` and `users.update` with `parent = 0`, `quota = NULL`, translate flags off.

Do not attach a role. Do not grant `users.create` / `users.delete`. Existing elevated grants stay.

### 7. Sequence and drop

Set `sqlite_sequence` for `users` to `MAX(id)`. Drop `admin_id_map`, `afroup_users`, and `admin_users`.

### SQL / helper parity

Put the merge rules in `src/lib/identity-merge.ts` (pure). The migration SQL must implement the same cases. Tests lock the map; reviewers diff the SQL against those cases.

## Data flow

```text
Cookie afroup_session
        │
        ▼
afroup_sessions.token ──► users.id
        │
        ▼
getCurrentUser()
  active + not invite_pending
        │
        ├─ /cuenta, password, avatar, bios, account delete
        │     require users.update
        │
        ├─ /api/me
        │     { user, permissions: { [slug]: actions[] } }
        │
        └─ AdminLayout + admin pages/APIs
              hasPermission(module, action)
              then list / manage scope
```

### Register

1. Reject taken email (`users.email`).
2. Insert `users` with hash, `verified_at = NULL`, `role_id = NULL`, `invite_pending = 0`, `is_active = 1`, `created_by = NULL`.
3. Insert `users.read` + `users.update` only.
4. Insert `afroup_email_verifications` and send the existing verify email.
5. `/api/verify` sets `users.verified_at`.

### Invite

`hasPermission(users, create)` + quota, then:

| Existing `users` row | Write |
| --- | --- |
| None | Insert invite-pending row, nullable hash, optional role / extra grants / `created_by`, send accept email. |
| Invite-pending | Update name / role / extra grants / `created_by` if allowed; refresh token; resend. |
| Verified | Attach role / extra grants / `created_by` (if currently NULL). Do **not** flip `invite_pending`, do **not** overwrite the hash. No accept step. |

Merge extra grants with `INSERT OR IGNORE`. Never delete the default `users.read` / `users.update` rows.

Accept-invite: set hash, `verified_at = now`, `invite_pending = 0`, consume token. That is the email-proof path for invite-only people.

### Login (`/api/login` only)

Reject in this order: missing fields → unknown email / bad password (`invalid_credentials`) → `invite_pending` (`account_pending`) → `is_active = 0` (`account_inactive`) → `verified_at` null (`unverified`).

Success creates `afroup_sessions` for `users.id`. Delete unused `/api/admin/login` (no page calls it; `/admin/login` already redirects to `/login`).

Login redirect: `next` wins; else `/cuenta` when the actor has `users.update`; else open `/admin`.

### Account delete

Require session + `users.update` + confirm phrase. Delete the avatar object, then `DELETE FROM users WHERE id = ?`. Cascades sessions, verifications, resets, bios, grants, invitations, parent grants. Null out `created_by` on remaining children. Clear the cookie.

## Contracts

### Current user

Replace email-join `getCurrentAdmin` / `getAdminUserByEmail` with session → `users`.

```ts
getCurrentUser(db, token): Promise<CurrentUser | null>
// users row by afroup_sessions, expires_at > now, is_active = 1, invite_pending = 0
```

Keep `getPublicUser` as the session profile (id, name, email, bio, avatar, verified_at) joining `users`. Callers that mutate account state still need `users.update`.

### Permission gate

`hasPermission(db, userId, moduleSlug, action)` becomes the real gate. Point its join at `users`, not `admin_users`. Direct grant **or** role grant counts.

`effectiveGrant` stays for `parent` / `quota` / translate flags, also joined on `users.id`. Slug `usuarios` becomes `users` in `admin-scope.ts` and `translationAccessForEmail`.

### Manage + list scope

```text
canManageUser(actor, target, action):
  1. hasPermission(actor, "users", action) must be true
  2. self + update → true
  3. self + delete → false
  4. target.created_by === actor → true
  5. else parent flag on the actor's users:<action> grant
```

Default `users.update` is **not** a directory write.

```text
listVisibleUsers(actor):
  require users.read
  always include self
  include created_by = actor when users.create OR quota is set
    if quota !== null, slice children to quota
  include the actor's creator when the users.read grant has parent
```

A new registrant therefore sees one self-card.

Invite / create UI renders only when `users.create` (and quota allows). Self-card still allows the owner to edit their own profile fields that `users.update` already covers; it must not assign roles or extra grants to other people.

### `/api/me`

```json
{
  "ok": true,
  "user": { "id": 1, "name": "", "email": "", "bio": null, "avatar_url": null, "verified_at": "" },
  "permissions": { "users": ["read", "update"] }
}
```

No `admin` boolean. `permissions` is slug → unique actions from `mergePermissions(effectivePermissions(users.id))`. Unauthenticated: `{ "ok": false }` + 401.

### Header account link

`public/session-user.js` sets `data-session-link` to `data-session-href` (`/cuenta` or `/en/cuenta`) only when `permissions.users` includes `update`. Otherwise the avatar stays on login.

### Open `/admin`

| Surface | Gate |
| --- | --- |
| `/admin`, `/en/admin` | Always 200. `prerender = false`. No client bounce on missing `admin`. |
| Menu item | Visible iff `hasPermission(module, "read")`. Dashboard link always visible. |
| `/admin/usuarios` | `users.read`. List uses `listVisibleUsers`. |
| `/admin/idiomas` | `idiomas.read` |
| `/admin/modulos` | `modulos.read` |
| `/admin/permisos` | `permisos.read` |
| `/admin/roles` | `roles.read` |
| Mock content pages | `prerender = false`. `articulos.read` / `comentarios.read` / `proyectos.read` or empty/forbidden. |
| Mutating APIs | Matching `hasPermission` + scope. 401 if no user, 403 if no permission. |
| Dashboard stats / quick actions / activity | Render only for modules the actor can read. Anonymous and default registrants see the empty shell, not mock counts. |

Anonymous visitors get the shell, locale switch, and “back to site”. Sign-out may stay visible; it is harmless without a cookie.

Remove `AdminLayout`’s `afroup:session` redirect. Client JS is not the lock.

Page path stays `/admin/usuarios` (site convention). Catalog slug is `users`.

### EN/ES lockstep

Every ES page/API change has the matching `src/pages/en/**` change in the same slice.

## File changes

| File | Change |
| --- | --- |
| `migrations/0020_unified_users.sql` | Rebuild, remap, slug rename, default grants, drop old tables. |
| `src/lib/identity-merge.ts` | Pure map / password / default-grant / verified-pending rules. |
| `src/lib/identity-merge.test.ts` | Id-map collisions, hash choice, default grants. |
| `src/lib/public-session.ts` | Join `users`. Delete `getAdminUserByEmail`. |
| `src/lib/admin-scope.ts` | `getCurrentUser`; slug `users`; permission-first manage/list. |
| `src/lib/admin-scope.test.ts` | Self-only list; manage cannot use default update on others. |
| `src/lib/rbac.ts` | `hasPermission` / `loadAdminUser` read `users`. |
| `src/lib/rbac.test.ts` | Role vs direct vs none. |
| `src/lib/permission-grants.ts` | `effectiveGrant` joins `users`. |
| `src/lib/user-bios.ts` | Update `users.bio`; translate flags via `users.update` on slug `users`. |
| `src/pages/api/register.ts` | Insert `users` + default grants. |
| `src/pages/api/login.ts` | Auth `users`; return `permissions`, not `admin`. |
| `src/pages/api/me.ts` | Same payload as login. |
| `src/pages/api/verify.ts`, `recover.ts`, `reset.ts`, `password.ts`, `avatar.ts` | Table `users`. Password/avatar also require `users.update`. |
| `src/pages/api/account.ts` | Delete `users` (cascade). Require `users.update`. |
| `src/pages/api/admin/users/invite.ts` | Upsert `users`; gate `users.create`. |
| `src/pages/api/admin/users/accept.ts` | Hash + `verified_at` + clear pending. |
| `src/pages/api/admin/login.ts` | Delete. |
| `src/pages/api/admin/roles.ts`, `permissions.ts`, `languages.ts` | `hasPermission` + `canManageUser`. `create_user` writes `users`. |
| `src/pages/cuenta.astro`, `src/pages/en/cuenta.astro` | Session + `users.update`, else login. |
| `src/layouts/AdminLayout.astro` | Server-filtered menu. No email-join bounce. |
| `src/pages/admin/index.astro` + EN | SSR empty shell; hide privileged mocks. |
| `src/pages/admin/{usuarios,idiomas,modulos,permisos,roles,articulos,comentarios,proyectos}.astro` + EN | Server `hasPermission`. Content mocks stop prerendering. |
| `src/pages/admin/usuarios.astro` + EN | Slug `users`; hide invite without `users.create`. |
| `src/pages/login.astro` + EN | Redirect from `permissions`, not `admin`. |
| `public/session-user.js` | Account href only with `users.update`. Stop writing `afroup-role=admin`. |

Out of file scope: `legacy/worker.js`, unused `admin_sessions` / `admin_credentials`, visual redesign, content-module data.

## Tests

Strict TDD is on. `package.json` test script: `bun test legacy/test src/lib`.

Write failing `src/lib` tests before helpers, then wire pages.

| File | Cases |
| --- | --- |
| `identity-merge.test.ts` | Public id preserved. Admin id that collides with another public id gets a new `users.id`. Email match keeps public hash. Invite-only keeps admin hash. Verified public row forces `invite_pending = 0`. Default grants are exactly `users.read` + `users.update`. |
| `admin-scope.test.ts` | List is self without parent / quota / create. Parent adds creator. Quota / create adds owned children and slices quota. `canManageUser` denies other-user update when only default grants exist. Self cannot delete self. Missing module permission denies even self-adjacent child writes. |
| `rbac.test.ts` | Direct hit, role hit, neither, inactive user. |

Keep tests pure (no live D1), matching `user-bios.test.ts`. Migration review checks SQL against the same cases.

After wiring, `bun test legacy/test src/lib` must stay green. Manual `--local` smoke: existing session cookie still loads; new register sees Users/self; `/admin` opens logged out.

## Rollout

D1 migrations are forward-only. App and schema move together.

| Step | Command / action |
| --- | --- |
| 1. Tests | `bun test legacy/test src/lib` |
| 2. Local schema | `wrangler d1 migrations apply afroup-db --local` (or `bun run db:migrate:local`) |
| 3. Local smoke | Register, login, existing cookie, invite upsert, `/cuenta`, open `/admin` |
| 4. Remote backup | `wrangler d1 export afroup-db --remote --output backups/pre-0020.sql` |
| 5. Cutover | Deploy the Worker that understands `users`, then `wrangler d1 migrations apply afroup-db --remote` in the same change window |
| 6. Prove | Live session cookie still resolves; one login; default registrant sees Users/self |

Do not apply `--remote` before the app deploy. A code revert after cutover breaks login.

### Rollback

| When | What works |
| --- | --- |
| Before remote migrate | Revert the app. Do not run `0020` on production. |
| After remote migrate | Forward fix only (missed remap, bad grant seed). Two-table identity needs a D1 backup restore, not `ALTER` back. |

## Risks

| Risk | Mitigation |
| --- | --- |
| Admin id reused as a public id | Map table; never insert unmapped admin ids. |
| Wrong password kept on merge | Public hash wins; documented in tests. |
| Default `users.update` becomes a directory write | Permission first, then self/child scope. |
| Open `/admin` leaks prerendered mocks | `prerender = false`; server menu + page gates; dashboard hides stats. |
| Invite-only user fails login as unverified | Accept sets `verified_at`. |
| EN/ES drift | Same-slice dual routes. |
| App/schema skew | Backup + paired deploy. |
| Specs missing at design time | Tasks phase must re-read the proposal success list and this file. |

## Checklist

- [ ] One `users` table; `afroup_users` and `admin_users` gone
- [ ] Public ids preserved; live `afroup_session` still resolves
- [ ] Admin FKs and `created_by` store `users.id`
- [ ] Register grants only `users.read` + `users.update`
- [ ] Invite upserts that row
- [ ] `/api/login` is the only live login
- [ ] `/cuenta` and the header account link require `users.update`
- [ ] `/admin` opens without an admin-email redirect
- [ ] New registrant sees Users, self-only
- [ ] Account delete removes the single person and dependents
- [ ] ES and EN stay in lockstep
- [ ] `bun test src/lib` covers merge/id-map, default grants, and gates

## Next step

Break this into tasks: failing lib tests, migration `0020`, helper rewires, API/page gates, local-then-remote rollout.
