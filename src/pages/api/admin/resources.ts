import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";
import { applySearchDocument, removeSearchDocuments, searchDocumentPath } from "../../../lib/search-documents";
import { listSiteLanguages } from "../../../lib/site-languages";
import { loadResources, getResourceStats, deleteResource, slugifyResource } from "../../../lib/resources";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list resources
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "recursos", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver recursos." }, 403);
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "es";
  const status = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";

  const resources = await loadResources(env.DB, locale, { status, search });
  const stats = await getResourceStats(env.DB);

  return json({ ok: true, resources, stats });
};

// POST: create or update resource
export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const idRaw = form.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const permissionAction = id ? "update" : "create";
  const canPerform = await hasPermission(env.DB, actor.id, "recursos", permissionAction);
  if (!canPerform) {
    return json({ ok: false, message: `No tienes permisos para ${id ? "editar" : "crear"} recursos.` }, 403);
  }

  const titleEs = String(form.get("title_es") ?? form.get("title") ?? "").trim();
  if (!titleEs) {
    return json({ ok: false, message: "El título en español es obligatorio." }, 400);
  }

  let slug = String(form.get("slug") ?? "").trim();
  if (!slug) {
    slug = slugifyResource(titleEs);
  } else {
    slug = slugifyResource(slug);
  }

  // Check slug uniqueness
  if (id) {
    const existing = await env.DB.prepare("SELECT id FROM resources WHERE slug = ? AND id != ?").bind(slug, id).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  } else {
    const existing = await env.DB.prepare("SELECT id FROM resources WHERE slug = ?").bind(slug).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const resource_type = String(form.get("resource_type") || "pdf").trim();
  const category_tag = String(form.get("category_tag") || "Guía PDF").trim();
  const file_url = String(form.get("file_url") || "").trim() || null;
  const external_url = String(form.get("external_url") || "").trim() || null;
  const cover_image_url = String(form.get("cover_image_url") || "").trim() || null;
  const format_label = String(form.get("format_label") || "PDF").trim();
  const pages_count = String(form.get("pages_count") || "").trim() || null;
  const languages_label = String(form.get("languages_label") || "ES/EN").trim() || null;
  const status = form.get("status") === "draft" ? "draft" : "published";
  const featured = form.get("featured") === "1" || form.get("featured") === "on" ? 1 : 0;
  const sort_order = Number(form.get("sort_order")) || 0;

  let resourceId = id;

  if (id) {
    await env.DB.prepare(`
      UPDATE resources SET
        slug = ?,
        resource_type = ?,
        category_tag = ?,
        file_url = ?,
        external_url = ?,
        cover_image_url = ?,
        format_label = ?,
        pages_count = ?,
        languages_label = ?,
        status = ?,
        featured = ?,
        sort_order = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      slug,
      resource_type,
      category_tag,
      file_url,
      external_url,
      cover_image_url,
      format_label,
      pages_count,
      languages_label,
      status,
      featured,
      sort_order,
      id
    ).run();
  } else {
    const res = await env.DB.prepare(`
      INSERT INTO resources (
        slug, resource_type, category_tag, file_url, external_url, cover_image_url,
        format_label, pages_count, languages_label, status, featured, sort_order, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      slug,
      resource_type,
      category_tag,
      file_url,
      external_url,
      cover_image_url,
      format_label,
      pages_count,
      languages_label,
      status,
      featured,
      sort_order,
      actor.id
    ).run();

    resourceId = Number(res.meta?.last_row_id);
  }

  if (!resourceId) {
    return json({ ok: false, message: "Error al guardar el recurso." }, 500);
  }

  // Save localized fields
  const languages = await listSiteLanguages(env.DB);
  const locales = languages.map((l) => l.code);

  const upsertLocaleStmt = env.DB.prepare(`
    INSERT INTO resource_locales (
      resource_id, locale, title, dek, content_html, og_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(resource_id, locale) DO UPDATE SET
      title = excluded.title,
      dek = excluded.dek,
      content_html = excluded.content_html,
      og_json = excluded.og_json,
      updated_at = excluded.updated_at
  `);

  const batchLocales = locales.map((locale) => {
    const title = String(form.get(`title_${locale}`) ?? (locale === "es" ? titleEs : "")).trim() || titleEs;
    const dek = String(form.get(`dek_${locale}`) ?? form.get("dek") ?? "").trim();
    const content_html = String(form.get(`content_html_${locale}`) ?? form.get("content_html") ?? "").trim() || null;
    const og_json = serializeOgMetadata(parseOgFromForm(form, locale));

    return upsertLocaleStmt.bind(
      resourceId,
      locale,
      title,
      dek,
      content_html,
      og_json
    );
  });

  await env.DB.batch(batchLocales);

  // Sync search documents
  for (const locale of locales) {
    const title = String(form.get(`title_${locale}`) ?? titleEs).trim() || titleEs;
    const dek = String(form.get(`dek_${locale}`) ?? "").trim();

    await applySearchDocument(env.DB, {
      moduleSlug: "recursos",
      recordId: resourceId,
      locale,
      title,
      description: dek,
      kind: `Recurso · ${format_label}`,
      path: searchDocumentPath(locale, `recurso/${slug}`),
      published: status === "published",
      tags: [category_tag, format_label, resource_type, "recurso", "educacion", "descarga"],
    });
  }

  return json({
    ok: true,
    id: resourceId,
    slug,
    message: id ? "Recurso actualizado con éxito." : "Recurso creado con éxito.",
  });
};

// DELETE: delete resource
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "recursos", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar recursos." }, 403);
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
    return json({ ok: false, message: "ID de recurso no proporcionado." }, 400);
  }

  await deleteResource(env.DB, id);

  return json({ ok: true, message: "Recurso eliminado." });
};
