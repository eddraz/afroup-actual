# Proposal: Unify identity into one `users` table

One person is one `users` row. Public registration grants only `users.read` + `users.update`. `/cuenta` and `/admin/usuarios` share that permission. `/admin` stays an open shell; menu items and pages appear only when the actor has the matching module permission. No third-party auth.

## Quick path

1. Rebuild `afroup_users` + `admin_users` into one `users` table. Preserve public ids. Remap admin foreign keys.
2. Register and invite write the same table. Register grants only `users.read` + `users.update`. Invite may add role, extra grants, and `created_by`.
3. Gate `/cuenta` on `users.update`. Keep `/admin` open. Filter the admin menu and server-gate each page/API by module permission. A new registrant sees Users, scoped to self.

## Product decisions (locked)

| Topic | Decision |
| --- | --- |
| Identity table | One table named `users`. Roles and grants hang off that id. |
| Public registration | Creates a `users` row and grants only `users.read` + `users.update`. No role. |
| `/cuenta` | Requires session **and** `users.update`. Header account link follows the same rule. |
| `/admin` | Open to everyone, including anonymous visitors. Not an admin-only app. |
| Admin chrome | Menu items and pages appear only when the actor has permission on that module. |
| Module slug | **A1.** Rename `usuarios` → `users`. |
| New registrant in admin | Sees **Users** in the admin menu. List is self-only unless parent / quota / `users.create`. |
| Shared permission | `/cuenta` and `/admin/usuarios` both key off `users.update` / `users.read`. |
| Auth providers | Email + password only. No OAuth, Passkeys, magic-link-only, or third-party IdP. |
| First slice | Identity, grants, login/session, and public/admin chrome. Not content modules. |

These answers close the explore forks. Spec and design must not reopen A2/A3 or a second user table.

## Intent

Stop treating one email as two people. Today public accounts live in `afroup_users` and admin accounts live in `admin_users`, joined by email. That split creates two ids, two password hashes, orphan admin rows on account delete, and invited-only admins who cannot sign in through `/api/login`.

The product outcome is one login, one password, one session, and one permission catalog. A registered person can edit their own account. An invited or promoted person can manage more users or other modules. Everyone can open `/admin`; nobody sees a module they cannot use.

## Current-state gap

| Area | Today | After this change |
| --- | --- | --- |
| Identity | Two tables, no shared primary key | One `users` row per email |
| Login | Public hash in `afroup_users`; invite writes `admin_users.password_hash` | One login against `users` |
| Session | `afroup_session` → public id; admin lookup by email | Same cookie → `users.id` |
| Registration | Inserts public row, grants nothing | Inserts `users`, grants `users.read` + `users.update` |
| Invite | Inserts admin-only row; cannot log in unless a public row also exists | Upserts the same `users` row |
| `/cuenta` | Session exists | Session + `users.update` |
| `/admin` | Client redirect unless `admin_users` email match | Open shell, permission-filtered menu |
| Admin APIs / pages | `getCurrentAdmin` only; `hasPermission` unused | `hasPermission(module, action)` on every gated surface |
| Account delete | Drops public row, leaves orphan admin row | Cascades the single `users` row |
| Client `/api/me` | `admin` boolean = “has admin_users row” | User + effective module actions |

## Scope

### In scope

- D1 rebuild into `users` with the union of both schemas.
- Preserve every `afroup_users.id` so live sessions, bios, verifications, and resets stay valid.
- Remap `admin_user_permissions`, `admin_user_invitations`, `admin_parent_grants`, and `created_by` through `admin_id → users.id`.
- Rename module slug `usuarios` → `users`. Seed default `users.read` + `users.update` for every existing person.
- One login path: `/api/login` against `users`. Check `verified_at`, `invite_pending`, and `is_active`. Shim or delete unused `/api/admin/login`.
- Register, invite, accept-invite, password change, password reset, and account delete on the same table.
- `getCurrentAdmin` becomes current user. `effectiveGrant` / `hasPermission` / list scope use `users.id`.
- `/api/me` returns the user plus effective module actions, not an `admin` boolean.
- `/cuenta` and the public header account link require `users.update`.
- `/admin` renders for everyone. `AdminLayout` menu is filtered by module permission. Each admin page and mutating API is server-gated. Dashboard must not leak privileged data.
- Users list stays self unless the actor has parent, quota, or `users.create`.
- English routes under `src/pages/en/**` stay in lockstep.
- `src/lib` tests for merge/id-map, default grants, login/invite, list scope, and the new gates.

### Out of scope

- OAuth, Passkeys, magic-link-only auth, or any third-party IdP
- Multiple people per email
- Soft-delete or account recovery beyond the existing password-reset table
- Visual redesign beyond showing/hiding menu items and empty admin states
- Migrating or deleting unused `admin_sessions` / `admin_credentials`
- Making articles, comments, or projects real data
- Dropping parent / quota / translate flags
- Per-locale permission slugs in the database
- Changing the live session cookie name in this slice (`afroup_session` may stay)

## Approach

Take **option A + slug A1** from explore.

1. **Schema.** Create `users`. Copy public rows with original ids. Merge matching admin emails onto those rows. Insert invite-only admins as new `users` rows. Remap every admin FK. Point session / verification / reset / bio FKs at `users(id)`. Drop `afroup_users` and `admin_users`.
2. **Password merge.** Keep the public hash when both exist (`/api/login` already uses it). Invite-only rows keep the admin hash. Accept-invite sets password + `verified_at` and clears `invite_pending`.
3. **Auth.** One register, one login, one session cookie. Register never assigns a role. Invite may attach role, extra grants, and `created_by`.
4. **RBAC.** Catalog slug is `users`. `hasPermission` becomes the real gate. List helpers stay self / created-by / parent / quota, but they must check the module permission first. `canManageAdminUser` must not let default `users.update` mutate other people.
5. **Chrome.** `/admin` no longer redirects “non-admins” to `/login`. Anonymous visitors see an empty or public shell. A default registrant sees Users (self-card). Elevated actors see the modules they can use. Server HTML and APIs enforce the same rules; client JS is not the lock.

## Affected areas

| Area | Change |
| --- | --- |
| `migrations/` | Forward-only D1 rebuild: `users`, remapped FKs, slug rename, default grants, drop old tables |
| `src/lib/public-session.ts`, `admin-scope.ts`, `rbac.ts`, `permission-grants.ts` | Current user + grants keyed by `users.id`; `hasPermission` used |
| `src/pages/api/login.ts`, `register.ts`, `account.ts`, `admin/users/invite.ts` | Single write path; invite upserts `users` |
| `src/pages/api/me.ts` and `/api/admin/login` | Effective actions; admin login shim or delete |
| `src/pages/cuenta.astro`, `src/pages/en/cuenta.astro` | Permission gate |
| Public header / session client | Account link only with `users.update` |
| `src/layouts/AdminLayout.astro` | Open shell, filtered menu, no email-join bounce |
| Admin pages and APIs (`usuarios`, `idiomas`, `modulos`, `permisos`, `roles`, mocks) | Server `hasPermission`; EN/ES lockstep |
| `src/lib` tests | Merge, grants, gates, list scope |

## Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Email merge + two hashes | Wrong hash locks someone out | Keep public hash; document invite-only rows; accept-invite sets `verified_at` |
| Admin id remap | Grants, invites, and `created_by` break if admin ids are copied into the public id space | Explicit `admin_id → users.id` map; never reuse an unmapped admin id |
| Live sessions | Remapping public ids signs everyone out | Preserve `afroup_users.id` |
| D1 rebuild | Forward-only; FKs cannot be fixed with rename alone | Follow existing `PRAGMA foreign_keys=OFF` + copy + rename; test `--local` before `--remote` |
| Default grants vs directory | `users.read` could expose other people | List stays self unless parent / quota / `users.create` |
| Open `/admin` | Prerendered pages already leak mock stats and the full menu if JS is skipped | Server-side menu and page/API gates are mandatory |
| `canManageAdminUser` | Today self-mutate skips the module check; after default `users.update` that is everyone | Require module permission, then apply self/child scope |
| EN/ES drift | Easy to gate one locale and leave the other open | Change both route trees in the same slice |
| No identity tests today | Merge or gate bugs ship silently | Add `src/lib` tests before wiring pages |
| Invite vs verify | Invited users bounce as unverified | One email-proof path: accept sets `verified_at` |

## Rollback

D1 migrations are forward-only. Rollback is **not** `ALTER TABLE` back to two user tables.

- **Before remote apply:** revert the app deploy and do not run the migration against production D1.
- **After remote apply:** ship a new forward migration only if a specific recoverable defect appears (bad grant seed, missed remap). Restoring the two-table model requires a D1 backup restore, not a code revert.
- **App-only rollback:** a code revert after the schema cutover will break login. App and migration must move together.
- Keep a pre-migration D1 export before `--remote`.

## Success criteria

- [ ] One `users` table exists. `afroup_users` and `admin_users` are gone.
- [ ] Public ids are preserved. Existing `afroup_session` cookies still resolve.
- [ ] Admin FKs and `created_by` point at `users.id`, not leftover admin ids.
- [ ] Register creates one row and grants only `users.read` + `users.update`.
- [ ] Invite upserts that same row and can add role / extra grants / `created_by`.
- [ ] `/api/login` authenticates `users` and is the only live login.
- [ ] `/cuenta` and the header account link require `users.update`.
- [ ] `/admin` opens without an admin-email redirect. Menu and pages follow module permission.
- [ ] A newly registered person sees Users and only themselves, unless parent / quota / create.
- [ ] Account delete removes the single person and their grants, sessions, bios, and invites.
- [ ] ES and EN surfaces stay in lockstep.
- [ ] `bun test src/lib` covers merge/id-map, default grants, and the new gates.

## Next step

Write specs for identity merge, default grants, login/invite, `/cuenta`, open `/admin`, and Users list scope. Design then records the D1 rebuild and permission helpers those specs require.
