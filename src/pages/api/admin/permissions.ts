import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  canManageAdminUser,
  forbiddenJson,
  getCurrentAdmin,
  sessionTokenFrom,
  unauthorizedJson,
} from "../../../lib/admin-scope";
import { parsePermissionGrants, setPermissionGrants } from "../../../lib/permission-grants";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentAdmin(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();
  const form = await request.formData();
  const intent = form.get("_intent");
  const grants = parsePermissionGrants(form);

  if (intent === "assign_user") {
    const userId = Number(form.get("userId"));
    if (!Number.isFinite(userId)) return json({ ok: false, error: "bad_user" }, 400);
    if (!(await canManageAdminUser(env.DB, actor.id, userId, "update"))) return forbiddenJson();
    await setPermissionGrants(env.DB, "admin_user_permissions", "user_id", userId, grants);
    return json({ ok: true });
  }

  if (intent === "assign_role") {
    const roleId = Number(form.get("roleId"));
    if (!Number.isFinite(roleId)) return json({ ok: false, error: "bad_role" }, 400);
    await setPermissionGrants(env.DB, "admin_role_permissions", "role_id", roleId, grants);
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown_intent" }, 400);
};
