# AfroUp emergency aid

Local Cloudflare Workers + D1 app for collecting and reviewing Chocó earthquake aid information.

The `design/` folder is the visual source of truth and stays untouched. The Worker serves `public/` and stores structured aid records in D1.

## Local setup

```bash
bun install
# or: npm install

bun run db:migrate:local
bun run dev
```

Open `http://127.0.0.1:8787` for the public page and `http://127.0.0.1:8787/admin` for review.

## Local admin credentials

Values live in `.dev.vars` (not committed):

- user: `admin`
- password: `changeme`

Change them before any shared or remote use. After login, use `/admin/password` to replace the bootstrap password. The new hash is stored in D1.

## What is seeded

- `0001_init.sql` creates departments, aid entries, and admin sessions.
- `0002_seed_official_guide.sql` loads the official AfroUp guide dated 14 August 2026.
- `0003_admin_credentials.sql` stores hashed admin password overrides.
- `0004_security.sql` tracks login and public-submit rate limits.

## Remote deploy (later)

Create a remote D1 database, replace the local `database_id` placeholder in `wrangler.jsonc`, put `ADMIN_USER` / `ADMIN_PASSWORD` / `SESSION_SECRET` as secrets, then run `wrangler deploy`.
