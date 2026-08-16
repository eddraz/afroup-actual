import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword, verifyPassword } from "../../lib/crypto";
import { getPublicUser, PUBLIC_SESSION_COOKIE } from "../../lib/public-session";
import { hasPermission } from "../../lib/rbac";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);
  if (!(await hasPermission(env.DB, user.id, "users", "update"))) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const form = await request.formData();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("new") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (!current || !next || !confirm) return json({ ok: false, error: "missing_fields" }, 400);
  if (next.length < 8) return json({ ok: false, error: "password_short" }, 400);
  if (next !== confirm) return json({ ok: false, error: "password_mismatch" }, 400);

  const row = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ? LIMIT 1")
    .bind(user.id)
    .first<{ password_hash: string }>();
  if (!row) return json({ ok: false, error: "unauthorized" }, 401);

  const matches = await verifyPassword(current, row.password_hash);
  if (!matches) return json({ ok: false, error: "invalid_current" }, 401);

  const hash = await hashPassword(next);
  await env.DB.prepare(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(hash, user.id)
    .run();

  return json({ ok: true });
};
