import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  forbiddenJson,
  getCurrentUser,
  sessionTokenFrom,
  unauthorizedJson,
} from "../../../lib/admin-scope";
import { defaultLocale } from "../../../lib/i18n";
import {
  canManageOwnedRecord,
  parseLocaleFields,
  plannedLocales,
  slugify,
  translationAccess,
} from "../../../lib/editorial";
import { isReservedCategorySlug } from "../../../lib/category-routes";
import { applySearchDocument, removeSearchDocuments, searchDocumentPath } from "../../../lib/search-documents";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function loadLocales(categoryId: number) {
  const rows = (await env.DB.prepare(
    "SELECT locale, title, description FROM article_category_locales WHERE category_id = ?",
  )
    .bind(categoryId)
    .all<{ locale: string; title: string; description: string }>()).results ?? [];
  const titles: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  for (const row of rows) {
    titles[row.locale] = row.title;
    descriptions[row.locale] = row.description;
  }
  return { titles, descriptions };
}

async function syncIndex(categoryId: number, slug: string) {
  const { titles, descriptions } = await loadLocales(categoryId);
  const locales = new Set([...Object.keys(titles), ...Object.keys(descriptions)]);
  for (const locale of locales) {
    await applySearchDocument(env.DB, {
      moduleSlug: "categorias",
      recordId: categoryId,
      locale,
      title: titles[locale] ?? "",
      description: descriptions[locale] ?? "",
      kind: "Categoría",
      path: searchDocumentPath(locale, slug),
      published: true,
    });
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const intent = String(form.get("_intent") ?? "save");
  const id = Number(form.get("id"));

  if (intent === "delete") {
    if (!(await hasPermission(env.DB, actor.id, "categorias", "delete"))) return forbiddenJson();
    if (!Number.isFinite(id)) return json({ ok: false, error: "bad_id" }, 400);
    if (!(await canManageOwnedRecord(env.DB, actor.id, "article_categories", id, "categorias"))) {
      return forbiddenJson();
    }
    await removeSearchDocuments(env.DB, "categorias", id);
    await env.DB.prepare("DELETE FROM article_categories WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  const action = Number.isFinite(id) && id > 0 ? "update" : "create";
  if (!(await hasPermission(env.DB, actor.id, "categorias", action))) return forbiddenJson();
  if (action === "update" && !(await canManageOwnedRecord(env.DB, actor.id, "article_categories", id, "categorias"))) {
    return forbiddenJson();
  }

  const access = await translationAccess(env.DB, actor.id, "categorias", action);
  const existing = action === "update" ? await loadLocales(id) : { titles: {}, descriptions: {} };
  const locales = plannedLocales(
    parseLocaleFields(form, "title"),
    parseLocaleFields(form, "description"),
    existing.titles,
    existing.descriptions,
    access,
  );
  const primary = locales.find((row) => row.locale === defaultLocale);
  if (!primary) return json({ ok: false, error: "title_required" }, 400);

  const requestedSlug = String(form.get("slug") ?? "").trim().toLowerCase();
  const slug = requestedSlug || slugify(primary.title);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || isReservedCategorySlug(slug)) {
    return json({ ok: false, error: "slug_invalid" }, 400);
  }

  const taken = await env.DB.prepare(
    "SELECT id FROM article_categories WHERE slug = ? AND id != ? LIMIT 1",
  )
    .bind(slug, action === "update" ? id : 0)
    .first<{ id: number }>();
  if (taken) return json({ ok: false, error: "slug_taken" }, 409);

  let categoryId = id;
  if (action === "create") {
    const created = await env.DB.prepare(
      "INSERT INTO article_categories (slug, created_by) VALUES (?, ?) RETURNING id",
    )
      .bind(slug, actor.id)
      .first<{ id: number }>();
    if (!created) return json({ ok: false, error: "insert_failed" }, 500);
    categoryId = created.id;
  } else {
    await env.DB.prepare(
      "UPDATE article_categories SET slug = ?, updated_at = datetime('now') WHERE id = ?",
    )
      .bind(slug, categoryId)
      .run();
    await env.DB.prepare("DELETE FROM article_category_locales WHERE category_id = ?").bind(categoryId).run();
  }

  const stmt = env.DB.prepare(
    "INSERT INTO article_category_locales (category_id, locale, title, description, og_json) VALUES (?, ?, ?, ?, ?)",
  );
  await env.DB.batch(
    locales.map((row) =>
      stmt.bind(categoryId, row.locale, row.title, row.description, serializeOgMetadata(parseOgFromForm(form, row.locale))),
    ),
  );
  await syncIndex(categoryId, slug);
  return json({ ok: true, id: categoryId });
};
