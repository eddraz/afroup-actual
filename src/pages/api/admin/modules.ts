import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { forbiddenJson, getCurrentAdmin, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";

export const prerender = false;

async function readBody(request: Request) {
  const form = await request.formData();
  return {
    intent: form.get("_intent"),
    id: form.get("id"),
    name: form.get("name"),
    slug: form.get("slug"),
    description: form.get("description"),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentAdmin(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();
  if (!(await hasPermission(env.DB, actor.id, "modulos", "update"))) return forbiddenJson();
  const body = await readBody(request);
  if (body.intent === "delete" && typeof body.id === "string") {
    const id = Number(body.id);
    if (!Number.isFinite(id)) return json({ ok: false, error: "bad_id" }, 400);
    await env.DB.prepare("DELETE FROM admin_modules WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!name) return json({ ok: false, error: "name_required" }, 400);
  if (!/^[a-z0-9-]+$/.test(slug)) return json({ ok: false, error: "slug_invalid" }, 400);

  const existing = await env.DB.prepare(
    "SELECT id FROM admin_modules WHERE slug = ? LIMIT 1",
  ).bind(slug).first<{ id: number }>();
  if (existing) return json({ ok: false, error: "slug_taken" }, 409);

  await env.DB.prepare(
    "INSERT INTO admin_modules (name, slug, description) VALUES (?, ?, ?)",
  ).bind(name, slug, description || null).run();

  // Generate the four base permissions for the new module.
  const moduleId = await env.DB.prepare("SELECT id FROM admin_modules WHERE slug = ?").bind(slug).first<{ id: number }>();
  if (moduleId) {
    for (const action of ["create", "read", "update", "delete"] as const) {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO admin_permissions (module_id, action, name) VALUES (?, ?, ?)",
      ).bind(moduleId.id, action, `${slug}:${action}`).run();
    }
  }

  return json({ ok: true });
};