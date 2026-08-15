# AfroUp

Astro + daisyUI + Tailwind CSS + Cloudflare Workers + D1. Local implementation of the editorial site.

The emergency aid Worker lives in `legacy/`. `design/` stays the visual source of truth.

## Local setup

```bash
bun install
bun run db:migrate:local
bun run dev
```

Open `http://localhost:4321`.

D1 is bound as `env.DB`. Example: `GET /api/health`.

## Scripts

- `bun run dev` — Astro + workerd
- `bun run build` — production build
- `bun run preview` — local Workers preview
- `bun run db:migrate:local` — apply D1 migrations locally
