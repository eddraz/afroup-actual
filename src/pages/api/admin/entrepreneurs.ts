import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";
import { listSiteLanguages } from "../../../lib/site-languages";
import {
  ENTREPRENEUR_CATEGORIES,
  getEntrepreneursStats,
  loadEntrepreneurs,
  slugifyEntrepreneur,
} from "../../../lib/entrepreneurs";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list or filter entrepreneurs
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "emprendedores", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver emprendimientos." }, 403);
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "es";
  const status = url.searchParams.get("status") || "all";
  const category = url.searchParams.get("category") || "all";
  const search = url.searchParams.get("search") || "";

  const entrepreneurs = await loadEntrepreneurs(env.DB, locale, { status, category, search });
  const stats = await getEntrepreneursStats(env.DB);

  return json({ ok: true, entrepreneurs, stats });
};

// POST: create or update entrepreneur
export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const idRaw = form.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const permissionAction = id ? "update" : "create";
  const canPerform = await hasPermission(env.DB, actor.id, "emprendedores", permissionAction);
  if (!canPerform) {
    return json({ ok: false, message: `No tienes permisos para ${id ? "editar" : "crear"} emprendimientos.` }, 403);
  }

  const nameEs = String(form.get("name_es") ?? form.get("name") ?? "").trim();
  if (!nameEs) {
    return json({ ok: false, message: "El nombre en español es obligatorio." }, 400);
  }

  let slug = String(form.get("slug") ?? "").trim();
  if (!slug) {
    slug = slugifyEntrepreneur(nameEs);
  } else {
    slug = slugifyEntrepreneur(slug);
  }

  // Check slug uniqueness
  if (id) {
    const existing = await env.DB.prepare("SELECT id FROM entrepreneurs WHERE slug = ? AND id != ?").bind(slug, id).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  } else {
    const existing = await env.DB.prepare("SELECT id FROM entrepreneurs WHERE slug = ?").bind(slug).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const categoryRaw = String(form.get("category") || "moda").trim();
  const category = ENTREPRENEUR_CATEGORIES.some((c) => c.value === categoryRaw) ? categoryRaw : "moda";
  const city = String(form.get("city") || "").trim();
  const country = String(form.get("country") || "").trim();
  const foundedYearRaw = String(form.get("founded_year") ?? "").trim();
  const founded_year = foundedYearRaw ? Number(foundedYearRaw) : null;
  const logo_url = String(form.get("logo_url") || "").trim();
  const instagram_handle = String(form.get("instagram_handle") || "").trim();
  const website_url = String(form.get("website_url") || "").trim();
  const contact_email = String(form.get("contact_email") || "").trim();
  const teamSizeRaw = String(form.get("team_size") ?? "").trim();
  const team_size = teamSizeRaw ? Number(teamSizeRaw) : null;
  const status = form.get("status") === "draft" ? "draft" : "published";
  const featured = form.get("featured") === "1" || form.get("featured") === "on" ? 1 : 0;
  const sort_order = Number(form.get("sort_order")) || 0;

  let entrepreneurId = id;

  if (id) {
    await env.DB.prepare(`
      UPDATE entrepreneurs SET
        slug = ?,
        category = ?,
        city = ?,
        country = ?,
        founded_year = ?,
        logo_url = ?,
        instagram_handle = ?,
        website_url = ?,
        contact_email = ?,
        team_size = ?,
        status = ?,
        featured = ?,
        sort_order = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      slug,
      category,
      city,
      country,
      founded_year,
      logo_url,
      instagram_handle,
      website_url,
      contact_email,
      team_size,
      status,
      featured,
      sort_order,
      id
    ).run();
  } else {
    const insertRes = await env.DB.prepare(`
      INSERT INTO entrepreneurs (
        slug, category, city, country, founded_year, logo_url,
        instagram_handle, website_url, contact_email, team_size,
        status, featured, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      slug,
      category,
      city,
      country,
      founded_year,
      logo_url,
      instagram_handle,
      website_url,
      contact_email,
      team_size,
      status,
      featured,
      sort_order
    ).run();

    entrepreneurId = Number(insertRes.meta?.last_row_id);
  }

  if (!entrepreneurId) {
    return json({ ok: false, message: "Error al registrar el emprendimiento." }, 500);
  }

  // Save localized fields for all site languages
  const siteLanguages = await listSiteLanguages(env.DB);
  for (const lang of siteLanguages) {
    const loc = lang.code;
    const nameVal = String(form.get(`name_${loc}`) ?? (loc === "es" ? nameEs : "")).trim();
    const dekVal = String(form.get(`dek_${loc}`) ?? "").trim();
    const storyHtmlVal = String(form.get(`story_html_${loc}`) ?? "").trim();
    const quoteVal = String(form.get(`quote_${loc}`) ?? "").trim();
    const rubroLabelVal = String(form.get(`rubro_label_${loc}`) ?? "").trim();
    const teamLabelVal = String(form.get(`team_label_${loc}`) ?? "").trim();
    const shippingLabelVal = String(form.get(`shipping_label_${loc}`) ?? "").trim();

    const ogData = parseOgFromForm(form, loc);
    const ogJson = serializeOgMetadata(ogData);

    if (nameVal || loc === "es") {
      await env.DB.prepare(`
        INSERT INTO entrepreneur_locales (
          entrepreneur_id, locale, name, dek, story_html, quote,
          rubro_label, team_label, shipping_label, og_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(entrepreneur_id, locale) DO UPDATE SET
          name = excluded.name,
          dek = excluded.dek,
          story_html = excluded.story_html,
          quote = excluded.quote,
          rubro_label = excluded.rubro_label,
          team_label = excluded.team_label,
          shipping_label = excluded.shipping_label,
          og_json = excluded.og_json
      `).bind(
        entrepreneurId,
        loc,
        nameVal || nameEs,
        dekVal,
        storyHtmlVal,
        quoteVal,
        rubroLabelVal,
        teamLabelVal,
        shippingLabelVal,
        ogJson
      ).run();
    }
  }

  return json({
    ok: true,
    message: id ? "Emprendimiento actualizado con éxito." : "Emprendimiento creado con éxito.",
    id: entrepreneurId,
    slug,
  });
};

// DELETE: remove entrepreneur (offerings and locales cascade)
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "emprendedores", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar emprendimientos." }, 403);
  }

  const url = new URL(request.url);
  const idRaw = url.searchParams.get("id");
  const id = idRaw ? Number(idRaw) : null;

  if (!id) {
    return json({ ok: false, message: "ID de emprendimiento no proporcionado." }, 400);
  }

  // Offerings are removed through the FK ON DELETE CASCADE; delete them explicitly for determinism.
  await env.DB.prepare("DELETE FROM entrepreneur_offerings WHERE entrepreneur_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM entrepreneur_locales WHERE entrepreneur_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM entrepreneurs WHERE id = ?").bind(id).run();

  return json({ ok: true, message: "Emprendimiento eliminado." });
};
