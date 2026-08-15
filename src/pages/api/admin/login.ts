import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyPassword } from "../../../lib/crypto";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) return json({ ok: false, error: "missing_fields" }, 400);

  const row = await env.DB.prepare(
    `SELECT id, name, email, password_hash, is_active, invite_pending
       FROM admin_users WHERE email = ? LIMIT 1`,
  ).bind(email).first<{
    id: number;
    name: string;
    email: string;
    password_hash: string | null;
    is_active: number;
    invite_pending: number;
  }>();

  if (!row || !row.password_hash) return json({ ok: false, error: "invalid_credentials" }, 401);
  if (row.invite_pending) return json({ ok: false, error: "account_pending" }, 403);
  if (!row.is_active) return json({ ok: false, error: "account_inactive" }, 403);

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return json({ ok: false, error: "invalid_credentials" }, 401);

  return json({ ok: true, user: { id: row.id, name: row.name, email: row.email } });
};