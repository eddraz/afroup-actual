import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyPassword } from "../../lib/crypto";
import {
  createPublicSession,
  getAdminUserByEmail,
  sessionCookieOptions,
} from "../../lib/public-session";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) return json({ ok: false, error: "missing_fields" }, 400);

  const row = await env.DB.prepare(
    `SELECT id, name, email, password_hash, verified_at
       FROM afroup_users WHERE email = ? LIMIT 1`,
  )
    .bind(email)
    .first<{
      id: number;
      name: string;
      email: string;
      password_hash: string;
      verified_at: string | null;
    }>();

  if (!row) return json({ ok: false, error: "invalid_credentials" }, 401);
  if (!row.verified_at) return json({ ok: false, error: "unverified" }, 403);

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return json({ ok: false, error: "invalid_credentials" }, 401);

  const session = await createPublicSession(env.DB, row.id);
  cookies.set("afroup_session", session.token, sessionCookieOptions(session.expiresAt));

  const admin = await getAdminUserByEmail(env.DB, row.email);
  return json({
    ok: true,
    user: { id: row.id, name: row.name, email: row.email },
    admin: admin ? { id: admin.id, name: admin.name, email: admin.email } : null,
  });
};
