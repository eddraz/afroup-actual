import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getPublicUser, PUBLIC_SESSION_COOKIE } from "../../lib/public-session";

export const prerender = false;

const BIO_MAX = 280;

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
  const bio = String(form.get("bio") ?? "").trim();
  if (bio.length > BIO_MAX) return json({ ok: false, error: "bio_too_long" }, 400);

  await env.DB.prepare(
    "UPDATE afroup_users SET bio = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(bio || null, user.id)
    .run();

  return json({ ok: true, bio: bio || null });
};
