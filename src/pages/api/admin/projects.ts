import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";
import { listSiteLanguages } from "../../../lib/site-languages";
import {
  loadProjects,
  getProjectsStats,
  slugifyProject,
} from "../../../lib/projects";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list or filter projects
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "proyectos", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver proyectos." }, 403);
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "es";
  const status = url.searchParams.get("status") || "all";
  const stage = url.searchParams.get("stage") || "all";
  const search = url.searchParams.get("search") || "";

  const projects = await loadProjects(env.DB, locale, { status, stage, search });
  const stats = await getProjectsStats(env.DB);

  return json({ ok: true, projects, stats });
};

// POST: create or update project
export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const idRaw = form.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const permissionAction = id ? "update" : "create";
  const canPerform = await hasPermission(env.DB, actor.id, "proyectos", permissionAction);
  if (!canPerform) {
    return json({ ok: false, message: `No tienes permisos para ${id ? "editar" : "crear"} proyectos.` }, 403);
  }

  const nameEs = String(form.get("name_es") ?? form.get("name") ?? "").trim();
  if (!nameEs) {
    return json({ ok: false, message: "El nombre en español es obligatorio." }, 400);
  }

  let slug = String(form.get("slug") ?? "").trim();
  if (!slug) {
    slug = slugifyProject(nameEs);
  } else {
    slug = slugifyProject(slug);
  }

  // Check slug uniqueness
  if (id) {
    const existing = await env.DB.prepare("SELECT id FROM projects WHERE slug = ? AND id != ?").bind(slug, id).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  } else {
    const existing = await env.DB.prepare("SELECT id FROM projects WHERE slug = ?").bind(slug).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const organization = String(form.get("organization") || "").trim();
  const stageRaw = String(form.get("stage") || "borrador").trim();
  const stage = ["borrador", "en_revision", "aprobado"].includes(stageRaw) ? stageRaw : "borrador";
  const budget_currency = String(form.get("budget_currency") || "USD").trim() || "USD";
  const budgetAmountRaw = String(form.get("budget_amount") ?? "").trim();
  const budget_amount = budgetAmountRaw ? Number(budgetAmountRaw) : null;
  const start_date = String(form.get("start_date") || "").trim() || null;
  const status = form.get("status") === "draft" ? "draft" : "published";
  const featured = form.get("featured") === "1" || form.get("featured") === "on" ? 1 : 0;
  const sort_order = Number(form.get("sort_order")) || 0;

  let projectId = id;

  if (id) {
    await env.DB.prepare(`
      UPDATE projects SET
        slug = ?,
        organization = ?,
        stage = ?,
        budget_currency = ?,
        budget_amount = ?,
        start_date = ?,
        status = ?,
        featured = ?,
        sort_order = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      slug,
      organization,
      stage,
      budget_currency,
      budget_amount,
      start_date,
      status,
      featured,
      sort_order,
      id
    ).run();
  } else {
    const insertRes = await env.DB.prepare(`
      INSERT INTO projects (
        slug, organization, stage, budget_currency, budget_amount,
        start_date, status, featured, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      slug,
      organization,
      stage,
      budget_currency,
      budget_amount,
      start_date,
      status,
      featured,
      sort_order
    ).run();

    projectId = Number(insertRes.meta?.last_row_id);
  }

  if (!projectId) {
    return json({ ok: false, message: "Error al registrar el proyecto." }, 500);
  }

  // Save localized fields for all site languages
  const siteLanguages = await listSiteLanguages(env.DB);
  for (const lang of siteLanguages) {
    const loc = lang.code;
    const nameVal = String(form.get(`name_${loc}`) ?? (loc === "es" ? nameEs : "")).trim();
    const dekVal = String(form.get(`dek_${loc}`) ?? "").trim();
    const descriptionHtmlVal = String(form.get(`description_html_${loc}`) ?? "").trim();

    const ogData = parseOgFromForm(form, loc);
    const ogJson = serializeOgMetadata(ogData);

    if (nameVal || loc === "es") {
      await env.DB.prepare(`
        INSERT INTO project_locales (
          project_id, locale, name, dek, description_html, og_json
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id, locale) DO UPDATE SET
          name = excluded.name,
          dek = excluded.dek,
          description_html = excluded.description_html,
          og_json = excluded.og_json
      `).bind(
        projectId,
        loc,
        nameVal || nameEs,
        dekVal,
        descriptionHtmlVal,
        ogJson
      ).run();
    }
  }

  return json({
    ok: true,
    message: id ? "Proyecto actualizado con éxito." : "Proyecto creado con éxito.",
    id: projectId,
    slug,
  });
};

// DELETE: remove project
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "proyectos", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar proyectos." }, 403);
  }

  const url = new URL(request.url);
  const idRaw = url.searchParams.get("id");
  const id = idRaw ? Number(idRaw) : null;

  if (!id) {
    return json({ ok: false, message: "ID de proyecto no proporcionado." }, 400);
  }

  await env.DB.prepare("DELETE FROM project_locales WHERE project_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();

  return json({ ok: true, message: "Proyecto eliminado." });
};
