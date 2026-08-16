import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { sendInviteEmail, type EmailLocale } from "../../../../lib/email";
import {
  assertUserQuota,
  canManageAdminUser,
  getCurrentAdmin,
  sessionTokenFrom,
  unauthorizedJson,
} from "../../../../lib/admin-scope";
import { parsePermissionGrants, setPermissionGrants } from "../../../../lib/permission-grants";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_MS = 1000 * 60 * 60 * 24;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isLocale(value: unknown): value is EmailLocale {
  return value === "es" || value === "en";
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentAdmin(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();
  if (!(await assertUserQuota(env.DB, actor.id, "create"))) {
    return json({ ok: false, error: "quota_exceeded" }, 403);
  }

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const locale = isLocale(form.get("locale")) ? (form.get("locale") as EmailLocale) : "es";
  const roleIdRaw = form.get("roleId");
  const roleId = roleIdRaw && typeof roleIdRaw === "string" && roleIdRaw !== "" ? Number(roleIdRaw) : null;
  const grants = parsePermissionGrants(form);
  const parentIdRaw = form.get("parentId");
  const requestedParentId =
    parentIdRaw && typeof parentIdRaw === "string" && parentIdRaw !== ""
      ? Number(parentIdRaw)
      : actor.id;
  const createdBy =
    requestedParentId === actor.id
      ? actor.id
      : (await canManageAdminUser(env.DB, actor.id, requestedParentId, "create"))
        ? requestedParentId
        : null;
  if (!createdBy) return json({ ok: false, error: "forbidden" }, 403);

  if (!name) return json({ ok: false, error: "name_required" }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "email_invalid" }, 400);

  const existing = await env.DB.prepare(
    "SELECT id, invite_pending FROM admin_users WHERE email = ? LIMIT 1",
  ).bind(email).first<{ id: number; invite_pending: number }>();
  if (existing) return json({ ok: false, error: "email_taken" }, 409);

  const insert = await env.DB.prepare(
    `INSERT INTO admin_users (name, email, password_hash, role_id, is_active, invite_pending, created_by)
     VALUES (?, ?, NULL, ?, 1, 1, ?)
     RETURNING id`,
  ).bind(name, email, roleId, createdBy).first<{ id: number }>();
  if (!insert) return json({ ok: false, error: "insert_failed" }, 500);

  if (grants.length > 0) {
    await setPermissionGrants(env.DB, "admin_user_permissions", "user_id", insert.id, grants);
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  await env.DB.prepare(
    "INSERT INTO admin_user_invitations (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).bind(token, insert.id, expiresAt).run();

  const acceptUrl = new URL(`/admin/usuarios/aceptar?token=${encodeURIComponent(token)}`, request.url).toString();
  try {
    await sendInviteEmail(env, { to: email, acceptUrl, locale, name });
  } catch (error) {
    console.error("admin invite: email send failed", error);
    return json({ ok: false, error: "email_failed" }, 502);
  }

  return json({ ok: true, userId: insert.id, emailSentTo: email });
};
