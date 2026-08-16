# Apply progress: unified-users-identity

## PR 1 schema — done locally

- identity-merge helper + tests green (`bun test src/lib/identity-merge.test.ts`, 11 pass)
- `migrations/0020_unified_users.sql` written
- Applied **local only**: `wrangler d1 migrations apply afroup-db --local`
- Local now has `users` (id 1 Eduard Ramirez), slug `users` / display `Usuarios`, 2 default grants
- `afroup_users` and `admin_users` dropped locally
- Not applied remotely

## PR 2 auth — done in working tree

- `src/lib/identity-auth.ts` + `src/lib/identity-auth.test.ts` green
- Session lookup joins `users`. `getAdminUserByEmail` deleted. `getCurrentUser` added.
- register / verify / login / me / password / avatar / recover / reset / invite / accept / account point at `users`
- `/api/admin/login` deleted
- Login returns `{ user, permissions }`, not `admin`
- `bun test src/lib`: 32 pass
- `src/pages/api/admin/roles.ts` still writes `admin_users` — left for PR 3 grants

## Remaining slices

- PR 3 grants
- PR 4 chrome
- PR 5 docs
