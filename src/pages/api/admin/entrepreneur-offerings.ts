import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";
import { listSiteLanguages } from "../../../lib/site-languages";
import {
  OFFERING_KINDS,
  loadOfferings,
  slugifyEntrepreneur,
} from "../../../lib/entrepreneurs";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list offerings of one entrepreneur (joined localized items)
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "emprendedores", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver ofertas de emprendimientos." }, 403);
  }

  const url = new URL(request.url);
  const entrepreneurIdRaw = url.searchParams.get("entrepreneur_id");
  const entrepreneurId = entrepreneurIdRaw ? Number(entrepreneurIdRaw) : null;
  if (!entrepreneurId) {
    return json({ ok: false, message: "ID de emprendimiento no proporcionado." }, 400);
  }

  const locale = url.searchParams.get("locale") || "es";
  const offerings = await loadOfferings(env.DB, entrepreneurId, locale);

  return json({ ok: true, offerings });
};

// POST: create or update an offering (product/service) of an entrepreneur.
// Technical sheet specs are sent per locale as `specs_json_<loc>` containing a
// JSON array string of {label, value} pairs (preferred contract).
export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const idRaw = form.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const permissionAction = id ? "update" : "create";
  const canPerform = await hasPermission(env.DB, actor.id, "emprendedores", permissionAction);
  if (!canPerform) {
    return json(
      { ok: false, message: `No tienes permisos para ${id ? "editar" : "crear"} ofertas.` },
      403
    );
  }

  const entrepreneurIdRaw = String(form.get("entrepreneur_id") ?? "").trim();
  const entrepreneur_id = entrepreneurIdRaw ? Number(entrepreneurIdRaw) : null;
  if (!entrepreneur_id) {
    return json({ ok: false, message: "El emprendimiento al que pertenece la oferta es obligatorio." }, 400);
  }
  const parent = await env.DB.prepare("SELECT id FROM entrepreneurs WHERE id = ?").bind(entrepreneur_id).first();
  if (!parent) {
    return json({ ok: false, message: "El emprendimiento especificado no existe." }, 400);
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

  // Check slug uniqueness within the same company
  if (id) {
    const existing = await env.DB
      .prepare("SELECT id FROM entrepreneur_offerings WHERE entrepreneur_id = ? AND slug = ? AND id != ?")
      .bind(entrepreneur_id, slug, id)
      .first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  } else {
    const existing = await env.DB
      .prepare("SELECT id FROM entrepreneur_offerings WHERE entrepreneur_id = ? AND slug = ?")
      .bind(entrepreneur_id, slug)
      .first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const kindRaw = String(form.get("kind") || "producto").trim();
  const kind = OFFERING_KINDS.some((k) => k.value === kindRaw) ? kindRaw : "producto";
  const image_url = String(form.get("image_url") || "").trim();
  const price_currency = String(form.get("price_currency") || "USD").trim() || "USD";
  const priceAmountRaw = String(form.get("price_amount") ?? "").trim();
  const price_amount = priceAmountRaw ? Number(priceAmountRaw) : null;
  const sort_order = Number(form.get("sort_order")) || 0;
  const status = form.get("status") === "draft" ? "draft" : "published";

  let offeringId = id;

  if (id) {
    await env.DB.prepare(`
      UPDATE entrepreneur_offerings SET
        entrepreneur_id = ?,
        slug = ?,
        kind = ?,
        image_url = ?,
        price_currency = ?,
        price_amount = ?,
        sort_order = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      entrepreneur_id,
      slug,
      kind,
      image_url,
      price_currency,
      price_amount,
      sort_order,
      status,
      id
    ).run();
  } else {
    const insertRes = await env.DB.prepare(`
      INSERT INTO entrepreneur_offerings (
        entrepreneur_id, slug, kind, image_url, price_currency, price_amount,
        sort_order, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      entrepreneur_id,
      slug,
      kind,
      image_url,
      price_currency,
      price_amount,
      sort_order,
      status
    ).run();

    offeringId = Number(insertRes.meta?.last_row_id);
  }

  if (!offeringId) {
    return json({ ok: false, message: "Error al registrar la oferta." }, 500);
  }

  // Save localized fields for all site languages
  const siteLanguages = await listSiteLanguages(env.DB);
  for (const lang of siteLanguages) {
    const loc = lang.code;
    const nameVal = String(form.get(`name_${loc}`) ?? (loc === "es" ? nameEs : "")).trim();
    const dekVal = String(form.get(`dek_${loc}`) ?? "").trim();
    const descriptionHtmlVal = String(form.get(`description_html_${loc}`) ?? "").trim();
    const specsJsonVal = String(form.get(`specs_json_${loc}`) ?? "").trim() || "[]";
    const ogData = parseOgFromForm(form, loc);
    const ogJson = serializeOgMetadata(ogData);

    if (nameVal || loc === "es") {
      await env.DB.prepare(`
        INSERT INTO entrepreneur_offering_locales (
          offering_id, locale, name, dek, description_html, specs_json, og_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(offering_id, locale) DO UPDATE SET
          name = excluded.name,
          dek = excluded.dek,
          description_html = excluded.description_html,
          specs_json = excluded.specs_json,
          og_json = excluded.og_json
      `).bind(
        offeringId,
        loc,
        nameVal || nameEs,
        dekVal,
        descriptionHtmlVal,
        specsJsonVal,
        ogJson
      ).run();
    }
  }

  return json({
    ok: true,
    message: id ? "Oferta actualizada con éxito." : "Oferta creada con éxito.",
    id: offeringId,
    slug,
  });
};

// DELETE: remove offering (localized rows cascade)
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "emprendedores", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar ofertas." }, 403);
  }

  const url = new URL(request.url);
  const idRaw = url.searchParams.get("id");
  const id = idRaw ? Number(idRaw) : null;

  if (!id) {
    return json({ ok: false, message: "ID de oferta no proporcionado." }, 400);
  }

  await env.DB.prepare("DELETE FROM entrepreneur_offering_locales WHERE offering_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM entrepreneur_offerings WHERE id = ?").bind(id).run();

  return json({ ok: true, message: "Oferta eliminada." });
};
