import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { sendInviteEmail, type EmailLocale } from "../../../../lib/email";
import {
  assertUserQuota,
  canManageAdminUser,
  getCurrentUser,
  sessionTokenFrom,
  unauthorizedJson,
} from "../../../../lib/admin-scope";
import { planInvite } from "../../../../lib/identity-auth";
import { parsePermissionGrants } from "../../../../lib/permission-grants";
import { hasPermission } from "../../../../lib/rbac";

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

async function loadExistingUser(email: string) {
  const user = await env.DB.prepare(
    `SELECT id, name, email, password_hash, role_id, invite_pending, created_by
       FROM users WHERE email = ? LIMIT 1`,
  )
    .bind(email)
    .first<{
      id: number;
      name: string;
      email: string;
      password_hash: string | null;
      role_id: number | null;
      invite_pending: number;
      created_by: number | null;
    }>();
  if (!user) return null;

  const grants = await env.DB.prepare(
    `SELECT p.name
       FROM admin_user_permissions up
       JOIN admin_permissions p ON p.id = up.permission_id
      WHERE up.user_id = ?`,
  )
    .bind(user.id)
    .all<{ name: string }>();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    roleId: user.role_id,
    invitePending: user.invite_pending ? (1 as const) : (0 as const),
    createdBy: user.created_by,
    grantNames: (grants.results ?? []).map((row) => row.name),
  };
}

async function mergeNamedGrants(userId: number, grantNames: string[]) {
  if (grantNames.length === 0) return;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO admin_user_permissions (user_id, permission_id)
     SELECT ?, p.id
       FROM admin_permissions p
      WHERE p.name IN (${grantNames.map(() => "?").join(", ")})`,
  )
    .bind(userId, ...grantNames)
    .run();
}

async function mergeParsedGrants(
  userId: number,
  grants: Array<{
    permissionId: number;
    parent: boolean;
    quota: number | null;
    translateManual: boolean;
    translateAi: boolean;
  }>,
) {
  if (grants.length === 0) return;
  const stmt = env.DB.prepare(
    `INSERT OR IGNORE INTO admin_user_permissions
       (user_id, permission_id, parent, quota, translate_manual, translate_ai)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  await env.DB.batch(
    grants.map((grant) =>
      stmt.bind(
        userId,
        grant.permissionId,
        grant.parent ? 1 : 0,
        grant.quota,
        grant.translateManual ? 1 : 0,
        grant.translateAi ? 1 : 0,
      ),
    ),
  );
}

async function issueInviteToken(userId: number) {
  await env.DB.prepare(
    "UPDATE admin_user_invitations SET consumed_at = datetime('now') WHERE user_id = ? AND consumed_at IS NULL",
  )
    .bind(userId)
    .run();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  await env.DB.prepare(
    "INSERT INTO admin_user_invitations (token, user_id, expires_at) VALUES (?, ?, ?)",
  )
    .bind(token, userId, expiresAt)
    .run();
  return token;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();
  if (!(await hasPermission(env.DB, actor.id, "users", "create"))) {
    return json({ ok: false, error: "forbidden" }, 403);
  }
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

  const extraNames = await env.DB.prepare(
    `SELECT name FROM admin_permissions WHERE id IN (${
      grants.length ? grants.map(() => "?").join(", ") : "NULL"
    })`,
  )
    .bind(...grants.map((grant) => grant.permissionId))
    .all<{ name: string }>();

  const existing = await loadExistingUser(email);
  const plan = planInvite({
    existing,
    name,
    email,
    roleId,
    extraGrantNames: (extraNames.results ?? []).map((row) => row.name),
    createdBy,
  });

  let userId = plan.user.id;
  if (plan.action === "insert") {
    const insert = await env.DB.prepare(
      `INSERT INTO users (name, email, password_hash, role_id, is_active, invite_pending, created_by)
       VALUES (?, ?, NULL, ?, 1, 1, ?)
       RETURNING id`,
    )
      .bind(plan.user.name, plan.user.email, plan.user.roleId, plan.user.createdBy)
      .first<{ id: number }>();
    if (!insert) return json({ ok: false, error: "insert_failed" }, 500);
    userId = insert.id;
  } else if (plan.action === "update-pending") {
    await env.DB.prepare(
      `UPDATE users
          SET name = ?, role_id = ?, created_by = ?, updated_at = datetime('now')
        WHERE id = ?`,
    )
      .bind(plan.user.name, plan.user.roleId, plan.user.createdBy, userId)
      .run();
  } else {
    await env.DB.prepare(
      `UPDATE users
          SET role_id = COALESCE(?, role_id),
              created_by = COALESCE(created_by, ?),
              updated_at = datetime('now')
        WHERE id = ?`,
    )
      .bind(plan.user.roleId, plan.user.createdBy, userId)
      .run();
  }

  if (userId == null) return json({ ok: false, error: "insert_failed" }, 500);
  await mergeNamedGrants(userId, plan.grantNames);
  await mergeParsedGrants(userId, grants);

  if (plan.action !== "attach-verified") {
    const token = await issueInviteToken(userId);
    const acceptUrl = new URL(
      `/admin/usuarios/aceptar?token=${encodeURIComponent(token)}`,
      request.url,
    ).toString();
    try {
      await sendInviteEmail(env, { to: email, acceptUrl, locale, name: plan.user.name });
    } catch (error) {
      console.error("admin invite: email send failed", error);
      return json({ ok: false, error: "email_failed" }, 502);
    }
  }

  return json({ ok: true, userId, emailSentTo: email });
};
