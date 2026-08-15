import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword } from "../../../../lib/crypto";

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
    `SELECT i.token, i.expires_at, i.consumed_at, u.id, u.email, u.name, u.invite_pending
       FROM admin_user_invitations i
       JOIN admin_users u ON u.id = i.user_id
      WHERE i.token = ? LIMIT 1`,
  ).bind(token).first<{
    token: string;
    expires_at: string;
    consumed_at: string | null;
    id: number;
    email: string;
    name: string;
    invite_pending: number;
  }>();

  if (!row) return json({ ok: false, error: "token_invalid" }, 404);
  if (row.consumed_at) return json({ ok: false, error: "token_consumed" }, 410);
  if (Date.parse(row.expires_at) < Date.now()) return json({ ok: false, error: "token_expired" }, 410);
  if (!row.invite_pending) return json({ ok: false, error: "already_active" }, 409);

  const hash = await hashPassword(password);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE admin_users SET password_hash = ?, invite_pending = 0, updated_at = ? WHERE id = ?",
    ).bind(hash, now, row.id),
    env.DB.prepare(
      "UPDATE admin_user_invitations SET consumed_at = ? WHERE token = ?",
    ).bind(now, token),
  ]);

  return json({ ok: true, email: row.email });
};