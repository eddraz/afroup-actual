import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getPublicUser, PUBLIC_SESSION_COOKIE } from "../../lib/public-session";

export const prerender = false;

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);

  const form = await request.formData();
  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) return json({ ok: false, error: "missing_file" }, 400);
  if (!ALLOWED.has(file.type)) return json({ ok: false, error: "invalid_type" }, 400);
  if (file.size > MAX_BYTES) return json({ ok: false, error: "too_large" }, 400);

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `avatars/${user.id}/${crypto.randomUUID()}.${ext}`;
  await env.AVATARS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });

  const url = `/api/avatar/${key}`;
  await env.DB.prepare(
    "UPDATE afroup_users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(url, user.id)
    .run();

  return json({ ok: true, url });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);
  await env.DB.prepare(
    "UPDATE afroup_users SET avatar_url = NULL, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(user.id)
    .run();
  return json({ ok: true });
};
