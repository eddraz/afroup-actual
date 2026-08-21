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
  parseTagList,
  plannedArticleLocales,
  slugify,
  translationAccess,
  validateArticleInput,
} from "../../../lib/editorial";
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

function parseCategoryIds(form: FormData): number[] {
  const ids = form
    .getAll("categoryIds")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  return Array.from(new Set(ids));
}

async function loadLocales(articleId: number) {
  const rows = (await env.DB.prepare(
    "SELECT locale, title, description, content_html, og_json FROM article_locales WHERE article_id = ?",
  )
    .bind(articleId)
    .all<{ locale: string; title: string; description: string; content_html: string }>()).results ?? [];
  const titles: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  const contents: Record<string, string> = {};
  for (const row of rows) {
    titles[row.locale] = row.title;
    descriptions[row.locale] = row.description;
    contents[row.locale] = row.content_html ?? "";
  }
  return { titles, descriptions, contents };
}

async function loadMappedCategories(articleId: number) {
  return (
    (
      await env.DB.prepare(
        `SELECT c.slug,
                COALESCE(
                  (SELECT title FROM article_category_locales WHERE category_id = c.id AND locale = ?),
                  (SELECT title FROM article_category_locales WHERE category_id = c.id AND locale = ?)
                ) AS title
           FROM article_category_map m
           JOIN article_categories c ON c.id = m.category_id
          WHERE m.article_id = ?
          ORDER BY m.sort_order, c.id`,
      )
        .bind(defaultLocale, defaultLocale, articleId)
        .all<{ slug: string; title: string | null }>()
    ).results ?? []
  );
}

async function loadTags(articleId: number) {
  return (
    (await env.DB.prepare("SELECT tag FROM article_tags WHERE article_id = ? ORDER BY tag").bind(articleId).all<{ tag: string }>())
      .results ?? []
  ).map((row) => row.tag);
}

async function syncIndex(articleId: number, slug: string, published: boolean) {
  const { titles, descriptions } = await loadLocales(articleId);
  const categories = await loadMappedCategories(articleId);
  const tags = await loadTags(articleId);
  const primarySlug = categories[0]?.slug;
  const kind = categories[0]?.title ? `Artículo · ${categories[0].title}` : "Artículo";
  const locales = new Set([...Object.keys(titles), ...Object.keys(descriptions), defaultLocale]);
  for (const locale of locales) {
    await applySearchDocument(env.DB, {
      moduleSlug: "articulos",
      recordId: articleId,
      locale,
      title: titles[locale] ?? "",
      description: descriptions[locale] ?? "",
      kind,
      path: searchDocumentPath(locale, primarySlug ? `${primarySlug}/${slug}` : slug),
      published: published && Boolean(primarySlug),
      tags,
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
  const existing = action === "update" ? await loadLocales(id) : { titles: {}, descriptions: {}, contents: {} };
  const locales = plannedArticleLocales(
    parseLocaleFields(form, "title"),
    parseLocaleFields(form, "description"),
    parseLocaleFields(form, "content_html"),
    existing.titles,
    existing.descriptions,
    existing.contents,
    access,
  );
  const primary = locales.find((row) => row.locale === defaultLocale);
  const status = form.get("status") === "published" ? "published" : "draft";
  const categoryIds = parseCategoryIds(form);
  const tags = parseTagList(String(form.get("tags") ?? ""));
  const coverImageUrl = String(form.get("cover_image_url") ?? "").trim() || null;

  const requestedSlug = String(form.get("slug") ?? "").trim().toLowerCase();
  let slug = requestedSlug || (primary?.title ? slugify(primary.title) : "");
  if (!slug && status === "draft") {
    slug = `borrador-${action === "update" ? id : Date.now()}`;
  }

  const validation = validateArticleInput({
    status,
    primaryTitle: primary?.title,
    primaryDescription: primary?.description,
    primaryContent: primary?.content_html,
    categoryIds,
    tags,
    coverImageUrl,
    slug,
  });

  if (!validation.ok) {
    return json({ ok: false, error: validation.error, message: validation.message }, 400);
  }

  const rawReadingTime = Number(form.get("reading_time_minutes"));
  const readingTimeMinutes =
    Number.isFinite(rawReadingTime) && rawReadingTime > 0
      ? Math.round(rawReadingTime)
      : Math.max(1, Math.ceil(((primary?.content_html || primary?.description || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length) / 200));

  const taken = await env.DB.prepare("SELECT id FROM articles WHERE slug = ? AND id != ? LIMIT 1")
    .bind(slug, action === "update" ? id : 0)
    .first<{ id: number }>();
  if (taken) return json({ ok: false, error: "slug_taken", message: "El slug URL ya está en uso por otro artículo." }, 409);

  let articleId = id;
  if (action === "create") {
    const created = await env.DB.prepare(
      `INSERT INTO articles (slug, created_by, status, published_at, cover_image_url, reading_time_minutes)
       VALUES (?, ?, ?, CASE WHEN ? = 'published' THEN datetime('now') ELSE NULL END, ?, ?)
       RETURNING id`,
    )
      .bind(slug, actor.id, status, status, coverImageUrl, readingTimeMinutes)
      .first<{ id: number }>();
    if (!created) return json({ ok: false, error: "insert_failed" }, 500);
    articleId = created.id;
  } else {
    await env.DB.prepare(
      `UPDATE articles
          SET slug = ?, status = ?,
              published_at = CASE
                WHEN ? = 'published' THEN COALESCE(published_at, datetime('now'))
                ELSE NULL
              END,
              cover_image_url = ?,
              reading_time_minutes = ?,
              updated_at = datetime('now')
        WHERE id = ?`,
    )
      .bind(slug, status, status, coverImageUrl, readingTimeMinutes, articleId)
      .run();
    await env.DB.prepare("DELETE FROM article_locales WHERE article_id = ?").bind(articleId).run();
    await env.DB.prepare("DELETE FROM article_category_map WHERE article_id = ?").bind(articleId).run();
    await env.DB.prepare("DELETE FROM article_tags WHERE article_id = ?").bind(articleId).run();
  }

  const localeStmt = env.DB.prepare(
    "INSERT INTO article_locales (article_id, locale, title, description, content_html, og_json) VALUES (?, ?, ?, ?, ?, ?)",
  );
  await env.DB.batch(
    locales.map((row) =>
      localeStmt.bind(
        articleId,
        row.locale,
        row.title,
        row.description,
        row.content_html,
        serializeOgMetadata(parseOgFromForm(form, row.locale)),
      ),
    ),
  );
  if (categoryIds.length) {
    const mapStmt = env.DB.prepare(
      "INSERT INTO article_category_map (article_id, category_id, sort_order) VALUES (?, ?, ?)",
    );
    await env.DB.batch(categoryIds.map((categoryId, index) => mapStmt.bind(articleId, categoryId, index)));
  }
  if (tags.length) {
    const tagStmt = env.DB.prepare("INSERT INTO article_tags (article_id, tag) VALUES (?, ?)");
    await env.DB.batch(tags.map((tag) => tagStmt.bind(articleId, tag)));
  }
  await syncIndex(articleId, slug, status === "published");
  let categorySlug = "cultura";
  if (categoryIds.length) {
    const cat = await env.DB.prepare("SELECT slug FROM article_categories WHERE id = ?").bind(categoryIds[0]).first<{ slug: string }>();
    if (cat?.slug) categorySlug = cat.slug;
  }
  return json({ ok: true, id: articleId, slug, category_slug: categorySlug });
};
