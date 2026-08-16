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
import { applySearchDocument, removeSearchDocuments, searchDocumentPath } from "../../../lib/search-documents";
import { hasPermission } from "../../../lib/rbac";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function loadLocales(articleId: number) {
  const rows = (await env.DB.prepare(
    "SELECT locale, title, description FROM article_locales WHERE article_id = ?",
  )
    .bind(articleId)
    .all<{ locale: string; title: string; description: string }>()).results ?? [];
  const titles: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  for (const row of rows) {
    titles[row.locale] = row.title;
    descriptions[row.locale] = row.description;
  }
  return { titles, descriptions };
}

async function categoryKind(categoryId: number | null, locale: string): Promise<string> {
  if (!categoryId) return "Artículo";
  const row = await env.DB.prepare(
    `SELECT COALESCE(
       (SELECT title FROM article_category_locales WHERE category_id = ? AND locale = ?),
       (SELECT title FROM article_category_locales WHERE category_id = ? AND locale = ?)
     ) AS title`,
  )
    .bind(categoryId, locale, categoryId, defaultLocale)
    .first<{ title: string | null }>();
  return row?.title ? `Artículo · ${row.title}` : "Artículo";
}

async function syncIndex(articleId: number, slug: string, categoryId: number | null, published: boolean) {
  const { titles, descriptions } = await loadLocales(articleId);
  const locales = new Set([...Object.keys(titles), ...Object.keys(descriptions), defaultLocale]);
  for (const locale of locales) {
    await applySearchDocument(env.DB, {
      moduleSlug: "articulos",
      recordId: articleId,
      locale,
      title: titles[locale] ?? "",
      description: descriptions[locale] ?? "",
      kind: await categoryKind(categoryId, locale),
      path: searchDocumentPath(locale, `articulo/${slug}`),
      published,
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
    if (!(await hasPermission(env.DB, actor.id, "articulos", "delete"))) return forbiddenJson();
    if (!Number.isFinite(id)) return json({ ok: false, error: "bad_id" }, 400);
    if (!(await canManageOwnedRecord(env.DB, actor.id, "articles", id, "articulos"))) return forbiddenJson();
    await removeSearchDocuments(env.DB, "articulos", id);
    await env.DB.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  const action = Number.isFinite(id) && id > 0 ? "update" : "create";
  if (!(await hasPermission(env.DB, actor.id, "articulos", action))) return forbiddenJson();
  if (action === "update" && !(await canManageOwnedRecord(env.DB, actor.id, "articles", id, "articulos"))) {
    return forbiddenJson();
  }

  const access = await translationAccess(env.DB, actor.id, "articulos", action);
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
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ ok: false, error: "slug_invalid" }, 400);
  const status = form.get("status") === "published" ? "published" : "draft";
  const categoryRaw = Number(form.get("categoryId"));
  const categoryId = Number.isFinite(categoryRaw) && categoryRaw > 0 ? categoryRaw : null;

  const taken = await env.DB.prepare("SELECT id FROM articles WHERE slug = ? AND id != ? LIMIT 1")
    .bind(slug, action === "update" ? id : 0)
    .first<{ id: number }>();
  if (taken) return json({ ok: false, error: "slug_taken" }, 409);

  let articleId = id;
  if (action === "create") {
    const created = await env.DB.prepare(
      `INSERT INTO articles (slug, category_id, created_by, status, published_at)
       VALUES (?, ?, ?, ?, CASE WHEN ? = 'published' THEN datetime('now') ELSE NULL END)
       RETURNING id`,
    )
      .bind(slug, categoryId, actor.id, status, status)
      .first<{ id: number }>();
    if (!created) return json({ ok: false, error: "insert_failed" }, 500);
    articleId = created.id;
  } else {
    await env.DB.prepare(
      `UPDATE articles
          SET slug = ?, category_id = ?, status = ?,
              published_at = CASE
                WHEN ? = 'published' THEN COALESCE(published_at, datetime('now'))
                ELSE NULL
              END,
              updated_at = datetime('now')
        WHERE id = ?`,
    )
      .bind(slug, categoryId, status, status, articleId)
      .run();
    await env.DB.prepare("DELETE FROM article_locales WHERE article_id = ?").bind(articleId).run();
  }

  const stmt = env.DB.prepare(
    "INSERT INTO article_locales (article_id, locale, title, description) VALUES (?, ?, ?, ?)",
  );
  await env.DB.batch(locales.map((row) => stmt.bind(articleId, row.locale, row.title, row.description)));
  await syncIndex(articleId, slug, categoryId, status === "published");
  return json({ ok: true, id: articleId });
};
