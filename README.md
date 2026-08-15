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

Change them before any shared or remote use.

## What is seeded

Migration `0001_init.sql` creates departments and empty aid tables. There are no invented earthquake facts or aid rows. Official listings will be loaded later from the source document.

## Remote deploy (later)

`wrangler` is not logged in yet. Remote D1 create, real `database_id`, and `wrangler deploy` wait for Cloudflare auth plus the PDF seed.
