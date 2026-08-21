import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";
import { applySearchDocument, removeSearchDocuments, searchDocumentPath } from "../../../lib/search-documents";
import { listSiteLanguages } from "../../../lib/site-languages";
import {
  loadReferentes,
  getReferentesStats,
  slugifyReferente,
  serializeMilestones,
  type ReferenteMilestone,
} from "../../../lib/referentes";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list or filter referentes
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "referentes", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver referentes." }, 403);
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "es";
  const status = url.searchParams.get("status") || "all";
  const category = url.searchParams.get("category") || "all";
  const search = url.searchParams.get("search") || "";

  const referentes = await loadReferentes(env.DB, locale, { status, category, search });
  const stats = await getReferentesStats(env.DB);

  return json({ ok: true, referentes, stats });
};

// POST: create or update referente
export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const idRaw = form.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const permissionAction = id ? "update" : "create";
  const canPerform = await hasPermission(env.DB, actor.id, "referentes", permissionAction);
  if (!canPerform) {
    return json({ ok: false, message: `No tienes permisos para ${id ? "editar" : "crear"} referentes.` }, 403);
  }

  const nameEs = String(form.get("name_es") ?? form.get("name") ?? "").trim();
  if (!nameEs) {
    return json({ ok: false, message: "El nombre en español es obligatorio." }, 400);
  }

  let slug = String(form.get("slug") ?? "").trim();
  if (!slug) {
    slug = slugifyReferente(nameEs);
  } else {
    slug = slugifyReferente(slug);
  }

  // Check slug uniqueness
  if (id) {
    const existing = await env.DB.prepare("SELECT id FROM referentes WHERE slug = ? AND id != ?").bind(slug, id).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  } else {
    const existing = await env.DB.prepare("SELECT id FROM referentes WHERE slug = ?").bind(slug).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const category_tag = String(form.get("category_tag") || "Historia").trim();
  const badge_theme = String(form.get("badge_theme") || "primary").trim();
  const photo_url = String(form.get("photo_url") || "").trim() || null;
  const years_active = String(form.get("years_active") || "").trim() || null;
  const quote_es = String(form.get("quote_es") || form.get("quote") || "").trim() || null;
  const status = form.get("status") === "draft" ? "draft" : "published";
  const featured = form.get("featured") === "1" || form.get("featured") === "on" ? 1 : 0;
  const sort_order = Number(form.get("sort_order")) || 0;

  // Parse milestones if provided in JSON or form fields
  let milestonesEsJson = "[]";
  const rawMilestonesEs = form.get("milestones_json_es") || form.get("milestones_json");
  if (rawMilestonesEs && typeof rawMilestonesEs === "string") {
    try {
      const parsed = JSON.parse(rawMilestonesEs);
      milestonesEsJson = serializeMilestones(parsed);
    } catch {
      milestonesEsJson = "[]";
    }
  }

  let referenteId = id;

  if (id) {
    await env.DB.prepare(`
      UPDATE referentes SET
        slug = ?,
        category_tag = ?,
        badge_theme = ?,
        photo_url = ?,
        years_active = ?,
        quote = ?,
        milestones_json = ?,
        status = ?,
        featured = ?,
        sort_order = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      slug,
      category_tag,
      badge_theme,
      photo_url,
      years_active,
      quote_es,
      milestonesEsJson,
      status,
      featured,
      sort_order,
      id
    ).run();
  } else {
    const insertRes = await env.DB.prepare(`
      INSERT INTO referentes (
        slug, category_tag, badge_theme, photo_url, years_active,
        quote, milestones_json, status, featured, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      slug,
      category_tag,
      badge_theme,
      photo_url,
      years_active,
      quote_es,
      milestonesEsJson,
      status,
      featured,
      sort_order
    ).run();

    referenteId = Number(insertRes.meta?.last_row_id);
  }

  if (!referenteId) {
    return json({ ok: false, message: "Error al registrar el referente." }, 500);
  }

  // Save localized fields for all site languages
  const siteLanguages = await listSiteLanguages(env.DB);
  for (const lang of siteLanguages) {
    const loc = lang.code;
    const nameVal = String(form.get(`name_${loc}`) ?? (loc === "es" ? nameEs : "")).trim();
    const roleVal = String(form.get(`role_label_${loc}`) ?? "").trim() || null;
    const yearsLabelVal = String(form.get(`years_label_${loc}`) ?? "").trim() || years_active;
    const dekVal = String(form.get(`dek_${loc}`) ?? "").trim() || null;
    const bioHtmlVal = String(form.get(`bio_html_${loc}`) ?? "").trim() || null;
    const quoteVal = String(form.get(`quote_${loc}`) ?? (loc === "es" ? quote_es : "")).trim() || null;

    let milestonesLocJson = milestonesEsJson;
    const rawMilestonesLoc = form.get(`milestones_json_${loc}`);
    if (rawMilestonesLoc && typeof rawMilestonesLoc === "string") {
      try {
        const parsed = JSON.parse(rawMilestonesLoc);
        milestonesLocJson = serializeMilestones(parsed);
      } catch {}
    }

    const ogData = parseOgFromForm(form, loc);
    const ogJson = serializeOgMetadata(ogData);

    if (nameVal || loc === "es") {
      await env.DB.prepare(`
        INSERT INTO referente_locales (
          referente_id, locale, name, role_label, years_label,
          dek, bio_html, quote, milestones_json, og_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(referente_id, locale) DO UPDATE SET
          name = excluded.name,
          role_label = excluded.role_label,
          years_label = excluded.years_label,
          dek = excluded.dek,
          bio_html = excluded.bio_html,
          quote = excluded.quote,
          milestones_json = excluded.milestones_json,
          og_json = excluded.og_json
      `).bind(
        referenteId,
        loc,
        nameVal || nameEs,
        roleVal,
        yearsLabelVal,
        dekVal,
        bioHtmlVal,
        quoteVal,
        milestonesLocJson,
        ogJson
      ).run();

      // Apply Search Document
      await applySearchDocument(env.DB, {
        moduleSlug: "referentes",
        recordId: referenteId,
        locale: loc,
        title: nameVal || nameEs,
        description: dekVal || roleVal || `Referente de ${category_tag}`,
        kind: loc === "en" ? "Role Model" : "Referente",
        path: searchDocumentPath(loc, `referente/${slug}`),
        published: status === "published",
        tags: [category_tag, roleVal || "", yearsLabelVal || ""].filter(Boolean),
        extra: category_tag,
      });
    }
  }

  return json({
    ok: true,
    message: id ? "Referente actualizado con éxito." : "Referente creado con éxito.",
    id: referenteId,
    slug,
  });
};

// DELETE: remove referente
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "referentes", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar referentes." }, 403);
  }

  const url = new URL(request.url);
  const idRaw = url.searchParams.get("id");
  const id = idRaw ? Number(idRaw) : null;

  if (!id) {
    return json({ ok: false, message: "ID de referente no proporcionado." }, 400);
  }

  await removeSearchDocuments(env.DB, "referentes", id);
  await env.DB.prepare("DELETE FROM referente_locales WHERE referente_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM referentes WHERE id = ?").bind(id).run();

  return json({ ok: true, message: "Referente eliminado." });
};
