import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";
import { listSiteLanguages } from "../../../lib/site-languages";
import {
  STORE_CATEGORIES,
  getStoreStats,
  loadStoreProducts,
  serializeStoreSpecs,
  slugifyStoreProduct,
} from "../../../lib/store";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list or filter store products
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "tienda", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver la tienda." }, 403);
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "es";
  const status = url.searchParams.get("status") || "all";
  const category = url.searchParams.get("category") || "all";
  const search = url.searchParams.get("search") || "";

  const products = await loadStoreProducts(env.DB, locale, { status, category, search });
  const stats = await getStoreStats(env.DB);

  return json({ ok: true, products, stats });
};

// POST: create or update a store product
export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const idRaw = form.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const permissionAction = id ? "update" : "create";
  const canPerform = await hasPermission(env.DB, actor.id, "tienda", permissionAction);
  if (!canPerform) {
    return json({ ok: false, message: `No tienes permisos para ${id ? "editar" : "crear"} productos.` }, 403);
  }

  const nameEs = String(form.get("name_es") ?? form.get("name") ?? "").trim();
  if (!nameEs) {
    return json({ ok: false, message: "El nombre en español es obligatorio." }, 400);
  }

  let slug = String(form.get("slug") ?? "").trim();
  if (!slug) {
    slug = slugifyStoreProduct(nameEs);
  } else {
    slug = slugifyStoreProduct(slug);
  }

  // Check slug uniqueness
  if (id) {
    const existing = await env.DB.prepare("SELECT id FROM store_products WHERE slug = ? AND id != ?").bind(slug, id).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  } else {
    const existing = await env.DB.prepare("SELECT id FROM store_products WHERE slug = ?").bind(slug).first();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const categoryRaw = String(form.get("category") || "ebook").trim();
  const category = STORE_CATEGORIES.some((c) => c.value === categoryRaw) ? categoryRaw : "ebook";
  const image_url = String(form.get("image_url") || "").trim();
  const image_label = String(form.get("image_label") || "").trim();
  const price_currency = String(form.get("price_currency") || "USD").trim() || "USD";
  const priceAmountRaw = String(form.get("price_amount") ?? "").trim();
  const price_amount = priceAmountRaw ? Number(priceAmountRaw) : null;
  const compareAtRaw = String(form.get("compare_at_price") ?? "").trim();
  const compare_at_price = compareAtRaw ? Number(compareAtRaw) : null;
  const is_downloadable = form.get("is_downloadable") === "1" || form.get("is_downloadable") === "on" ? 1 : 0;
  const status = form.get("status") === "draft" ? "draft" : "published";
  const featured = form.get("featured") === "1" || form.get("featured") === "on" ? 1 : 0;
  const sort_order = Number(form.get("sort_order")) || 0;

  let productId = id;

  if (id) {
    await env.DB.prepare(`
      UPDATE store_products SET
        slug = ?,
        category = ?,
        image_url = ?,
        image_label = ?,
        price_currency = ?,
        price_amount = ?,
        compare_at_price = ?,
        is_downloadable = ?,
        status = ?,
        featured = ?,
        sort_order = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      slug,
      category,
      image_url,
      image_label,
      price_currency,
      price_amount,
      compare_at_price,
      is_downloadable,
      status,
      featured,
      sort_order,
      id
    ).run();
  } else {
    const insertRes = await env.DB.prepare(`
      INSERT INTO store_products (
        slug, category, image_url, image_label, price_currency, price_amount,
        compare_at_price, is_downloadable, status, featured, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      slug,
      category,
      image_url,
      image_label,
      price_currency,
      price_amount,
      compare_at_price,
      is_downloadable,
      status,
      featured,
      sort_order
    ).run();

    productId = Number(insertRes.meta?.last_row_id);
  }

  if (!productId) {
    return json({ ok: false, message: "Error al registrar el producto." }, 500);
  }

  // Save localized fields for all site languages
  const siteLanguages = await listSiteLanguages(env.DB);
  for (const lang of siteLanguages) {
    const loc = lang.code;
    const nameVal = String(form.get(`name_${loc}`) ?? (loc === "es" ? nameEs : "")).trim();
    const dekVal = String(form.get(`dek_${loc}`) ?? "").trim();
    const descriptionHtmlVal = String(form.get(`description_html_${loc}`) ?? "").trim();

    // Technical sheet specs are sent per locale as `specs_json_<loc>` containing a
    // JSON array string of {label, value} pairs (preferred contract).
    let specsInput: unknown = [];
    const specsRaw = String(form.get(`specs_json_${loc}`) ?? "").trim();
    if (specsRaw) {
      try {
        specsInput = JSON.parse(specsRaw);
      } catch {
        specsInput = [];
      }
    }
    const specsJson = serializeStoreSpecs(specsInput);

    const ogData = parseOgFromForm(form, loc);
    const ogJson = serializeOgMetadata(ogData);

    if (nameVal || loc === "es") {
      await env.DB.prepare(`
        INSERT INTO store_product_locales (
          product_id, locale, name, dek, description_html, specs_json, og_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(product_id, locale) DO UPDATE SET
          name = excluded.name,
          dek = excluded.dek,
          description_html = excluded.description_html,
          specs_json = excluded.specs_json,
          og_json = excluded.og_json
      `).bind(
        productId,
        loc,
        nameVal || nameEs,
        dekVal,
        descriptionHtmlVal,
        specsJson,
        ogJson
      ).run();
    }
  }

  return json({
    ok: true,
    message: id ? "Producto actualizado con éxito." : "Producto creado con éxito.",
    id: projectId,
    slug,
  });
};

// DELETE: remove store product
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "tienda", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar productos." }, 403);
  }

  const url = new URL(request.url);
  const idRaw = url.searchParams.get("id");
  const id = idRaw ? Number(idRaw) : null;

  if (!id) {
    return json({ ok: false, message: "ID de producto no proporcionado." }, 400);
  }

  await env.DB.prepare("DELETE FROM store_product_locales WHERE product_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM store_products WHERE id = ?").bind(id).run();

  return json({ ok: true, message: "Producto eliminado." });
};
