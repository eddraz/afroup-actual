import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { listSiteLanguages } from "../../../lib/site-languages";
import { loadAllCollaborateSkills, slugifySkill, deleteCollaborateSkill } from "../../../lib/collaborate";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list all skills
export const GET: APIRoute = async ({ cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "colabora", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver skills de colaboración." }, 403);
  }

  const skills = await loadAllCollaborateSkills(env.DB);
  return json({ ok: true, skills });
};

// POST: create or update skill
export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const idRaw = form.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const permissionAction = id ? "update" : "create";
  const canPerform = await hasPermission(env.DB, actor.id, "colabora", permissionAction);
  if (!canPerform) {
    return json({ ok: false, message: `No tienes permisos para ${id ? "editar" : "crear"} skills.` }, 403);
  }

  const titleEs = String(form.get("title_es") ?? form.get("title") ?? "").trim();
  if (!titleEs) {
    return json({ ok: false, message: "El título del skill en español es obligatorio." }, 400);
  }

  let slug = String(form.get("slug") ?? "").trim();
  if (!slug) {
    slug = slugifySkill(titleEs);
  } else {
    slug = slugifySkill(slug);
  }

  // Check unique slug
  if (id) {
    const existing = await env.DB.prepare("SELECT id FROM collaborate_skills WHERE slug = ? AND id != ?").bind(slug, id).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  } else {
    const existing = await env.DB.prepare("SELECT id FROM collaborate_skills WHERE slug = ?").bind(slug).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const icon = String(form.get("icon") || "ic-book2").trim();
  const badge_color = String(form.get("badge_color") || "accent").trim();
  const status = form.get("status") === "hidden" ? "hidden" : "active";
  const sort_order = Number(form.get("sort_order")) || 0;

  let skillId = id;

  if (id) {
    await env.DB.prepare(`
      UPDATE collaborate_skills SET
        slug = ?,
        icon = ?,
        badge_color = ?,
        status = ?,
        sort_order = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      slug,
      icon,
      badge_color,
      status,
      sort_order,
      id
    ).run();
  } else {
    const res = await env.DB.prepare(`
      INSERT INTO collaborate_skills (
        slug, icon, badge_color, status, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      slug,
      icon,
      badge_color,
      status,
      sort_order
    ).run();

    skillId = Number(res.meta?.last_row_id);
  }

  if (!skillId) {
    return json({ ok: false, message: "Error al guardar el skill." }, 500);
  }

  // Save localized titles & deks
  const languages = await listSiteLanguages(env.DB);
  const locales = languages.map((l) => l.code);

  const upsertLocaleStmt = env.DB.prepare(`
    INSERT INTO collaborate_skill_locales (
      skill_id, locale, title, dek, updated_at
    ) VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(skill_id, locale) DO UPDATE SET
      title = excluded.title,
      dek = excluded.dek,
      updated_at = excluded.updated_at
  `);

  const batchLocales = locales.map((locale) => {
    const title = String(form.get(`title_${locale}`) ?? (locale === "es" ? titleEs : "")).trim() || titleEs;
    const dek = String(form.get(`dek_${locale}`) ?? form.get("dek") ?? "").trim();

    return upsertLocaleStmt.bind(
      skillId,
      locale,
      title,
      dek
    );
  });

  await env.DB.batch(batchLocales);

  return json({
    ok: true,
    id: skillId,
    slug,
    message: id ? "Skill actualizado con éxito." : "Skill creado con éxito.",
  });
};

// DELETE: delete skill
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "colabora", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar skills." }, 403);
  }

  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  let id = Number(idParam);

  if (!id) {
    try {
      const data = await request.json();
      id = Number(data.id);
    } catch {}
  }

  if (!id) {
    return json({ ok: false, message: "ID de skill no proporcionado." }, 400);
  }

  await deleteCollaborateSkill(env.DB, id);
  return json({ ok: true, message: "Skill eliminado." });
};
