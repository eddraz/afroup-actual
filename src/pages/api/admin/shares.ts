import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  canManageAdminUser,
  forbiddenJson,
  getCurrentUser,
  sessionTokenFrom,
  unauthorizedJson,
} from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();
  if (!(await hasPermission(env.DB, actor.id, "users", "update"))) return forbiddenJson();

  const form = await request.formData();
  const intent = String(form.get("_intent") ?? "");
  const moduleSlug = String(form.get("module") ?? "users").trim();
  const recordId = Number(form.get("recordId"));
  const sharedWithId = Number(form.get("sharedWithId"));
  if (!moduleSlug || !Number.isFinite(recordId) || !Number.isFinite(sharedWithId)) {
    return json({ ok: false, error: "bad_share" }, 400);
  }
  if (sharedWithId === actor.id) return json({ ok: false, error: "self_share" }, 400);
  if (!(await canManageAdminUser(env.DB, actor.id, recordId, "update"))) return forbiddenJson();

  if (intent === "unshare") {
    await env.DB.prepare(
      `DELETE FROM record_shares
        WHERE module_slug = ? AND record_id = ? AND owner_id = ? AND shared_with_id = ?`,
    )
      .bind(moduleSlug, recordId, actor.id, sharedWithId)
      .run();
    return json({ ok: true });
  }

  await env.DB.prepare(
    `INSERT OR IGNORE INTO record_shares (module_slug, record_id, owner_id, shared_with_id)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(moduleSlug, recordId, actor.id, sharedWithId)
    .run();
  return json({ ok: true });
};
