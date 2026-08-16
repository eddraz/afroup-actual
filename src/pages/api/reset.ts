import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword } from "../../lib/crypto";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (!token) return json({ ok: false, error: "token_required" }, 400);
  if (password.length < 8) return json({ ok: false, error: "password_short" }, 400);
  if (password !== confirm) return json({ ok: false, error: "password_mismatch" }, 400);

  const row = await env.DB.prepare(
    `SELECT r.token, r.expires_at, r.consumed_at, u.id
       FROM afroup_password_resets r
       JOIN users u ON u.id = r.user_id
      WHERE r.token = ? LIMIT 1`,
  )
    .bind(token)
    .first<{ token: string; expires_at: string; consumed_at: string | null; id: number }>();

  if (!row) return json({ ok: false, error: "token_invalid" }, 404);
  if (row.consumed_at) return json({ ok: false, error: "token_consumed" }, 410);
  if (Date.parse(row.expires_at) < Date.now()) return json({ ok: false, error: "token_expired" }, 410);

  const hash = await hashPassword(password);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(hash, now, row.id),
    env.DB.prepare("UPDATE afroup_password_resets SET consumed_at = ? WHERE token = ?").bind(now, token),
    env.DB.prepare("DELETE FROM afroup_sessions WHERE user_id = ?").bind(row.id),
  ]);

  return json({ ok: true });
};
