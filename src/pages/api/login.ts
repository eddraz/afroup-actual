import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyPassword } from "../../lib/crypto";
import { classifyLogin, permissionsFromNamedRows } from "../../lib/identity-auth";
import {
  createPublicSession,
  sessionCookieOptions,
} from "../../lib/public-session";
import { effectivePermissions, mergePermissions } from "../../lib/rbac";

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

  const missing = classifyLogin({ email, password });
  if (missing === "missing_fields") return json({ ok: false, error: missing }, 400);

  const row = await env.DB.prepare(
    `SELECT id, name, email, password_hash, verified_at, invite_pending, is_active
       FROM users WHERE email = ? LIMIT 1`,
  )
    .bind(email)
    .first<{
      id: number;
      name: string;
      email: string;
      password_hash: string | null;
      verified_at: string | null;
      invite_pending: number;
      is_active: number;
    }>();

  const passwordOk = Boolean(row?.password_hash) && (await verifyPassword(password, row!.password_hash!));
  const decision = classifyLogin({
    email,
    password,
    user: row
      ? {
          passwordOk,
          invitePending: row.invite_pending ? 1 : 0,
          isActive: row.is_active ? 1 : 0,
          verifiedAt: row.verified_at,
        }
      : null,
  });

  if (decision === "invalid_credentials") return json({ ok: false, error: decision }, 401);
  if (decision !== "ok") return json({ ok: false, error: decision }, 403);

  const session = await createPublicSession(env.DB, row!.id);
  cookies.set("afroup_session", session.token, sessionCookieOptions(session.expiresAt));

  const permissions = permissionsFromNamedRows(
    mergePermissions(await effectivePermissions(env.DB, row!.id)),
  );
  return json({
    ok: true,
    user: { id: row!.id, name: row!.name, email: row!.email },
    permissions,
  });
};
