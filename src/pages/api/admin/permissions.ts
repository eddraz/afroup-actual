import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

async function readBody(request: Request) {
  const form = await request.formData();
  return {
    intent: form.get("_intent"),
    userId: form.get("userId"),
    roleId: form.get("roleId"),
    permissionId: form.get("permissionId"),
    permissionIds: form.getAll("permissionIds"),
    active: form.get("active"),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function setAssignments(
  table: "admin_user_permissions" | "admin_role_permissions",
  fk: "user_id" | "role_id",
  ownerId: number,
  permissionIds: number[],
): Promise<void> {
  await env.DB.prepare(`DELETE FROM ${table} WHERE ${fk} = ?`).bind(ownerId).run();
  if (permissionIds.length === 0) return;
  const stmt = env.DB.prepare(
    `INSERT INTO ${table} (${fk}, permission_id) VALUES (?, ?)`,
  );
  const batch = permissionIds.map((permissionId) => stmt.bind(ownerId, permissionId));
  await env.DB.batch(batch);
}

export const POST: APIRoute = async ({ request }) => {
  const body = await readBody(request);

  if (body.intent === "assign_user") {
    const userId = Number(body.userId);
    const permissionIds = (body.permissionIds as unknown[] ?? [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!Number.isFinite(userId)) return json({ ok: false, error: "bad_user" }, 400);
    await setAssignments("admin_user_permissions", "user_id", userId, permissionIds);
    return json({ ok: true });
  }

  if (body.intent === "assign_role") {
    const roleId = Number(body.roleId);
    const permissionIds = (body.permissionIds as unknown[] ?? [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!Number.isFinite(roleId)) return json({ ok: false, error: "bad_role" }, 400);
    await setAssignments("admin_role_permissions", "role_id", roleId, permissionIds);
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown_intent" }, 400);
};