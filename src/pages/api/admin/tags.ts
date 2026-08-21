import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") ?? "").trim().toLowerCase();

  const query = q
    ? "SELECT name, slug FROM tags WHERE name LIKE ? OR slug LIKE ? ORDER BY name ASC LIMIT 30"
    : "SELECT name, slug FROM tags ORDER BY name ASC LIMIT 100";

  const stmt = q
    ? env.DB.prepare(query).bind(`%${q}%`, `%${q}%`)
    : env.DB.prepare(query);

  const results = (await stmt.all<{ name: string; slug: string }>()).results ?? [];
  return json({ ok: true, tags: results.map((r) => r.name) });
};
