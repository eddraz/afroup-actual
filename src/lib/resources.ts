import type { D1Database } from "@cloudflare/workers-types";
import { parseOgMetadata, type OpenGraphMetadata } from "./og-metadata";
import { applySearchDocument, removeSearchDocuments, searchDocumentPath } from "./search-documents";

export interface ResourceRow {
  id: number;
  slug: string;
  resource_type: string; // pdf | web | mapa | lectura | audio | doc
  category_tag: string; // Guía PDF · Para docentes | Guía PDF | Glosario | Mapa | Lecturas
  file_url: string | null;
  external_url: string | null;
  cover_image_url: string | null;
  format_label: string; // PDF | Web | Lista | Audio
  pages_count: string | null;
  languages_label: string | null;
  status: "published" | "draft";
  featured: number;
  sort_order: number;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceLocaleRow {
  resource_id: number;
  locale: string;
  title: string;
  dek: string;
  content_html: string | null;
  og_json: string | null;
  updated_at: string;
}

export interface ResourceItem {
  id: number;
  slug: string;
  resource_type: string;
  category_tag: string;
  file_url: string | null;
  external_url: string | null;
  cover_image_url: string | null;
  format_label: string;
  pages_count: string | null;
  languages_label: string | null;
  status: "published" | "draft";
  featured: boolean;
  sort_order: number;
  locale: string;
  title: string;
  dek: string;
  content_html: string | null;
  og: OpenGraphMetadata;
  created_at: string;
  updated_at: string;
}

export interface ResourcesPageData {
  eyebrow: string;
  title: string;
  lead: string;
  band_title: string;
  band_dek: string;
  band_cta_label: string;
  band_cta_url: string;
  og: OpenGraphMetadata;
}

export interface ResourceStats {
  total: number;
  published: number;
  drafts: number;
  featured: number;
}

export function slugifyResource(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "recurso";
}

export async function loadResources(
  db: D1Database,
  locale: string,
  options?: { status?: string; category?: string; search?: string }
): Promise<ResourceItem[]> {
  let query = `
    SELECT r.*,
           COALESCE(rl.title, rles.title, 'Sin título') AS title,
           COALESCE(rl.dek, rles.dek, '') AS dek,
           COALESCE(rl.content_html, rles.content_html, '') AS content_html,
           COALESCE(rl.og_json, rles.og_json) AS og_json
      FROM resources r
      LEFT JOIN resource_locales rl ON rl.resource_id = r.id AND rl.locale = ?
      LEFT JOIN resource_locales rles ON rles.resource_id = r.id AND rles.locale = 'es'
     WHERE 1=1
  `;
  const params: any[] = [locale];

  if (options?.status && options.status !== "all") {
    query += " AND r.status = ?";
    params.push(options.status);
  }

  if (options?.category && options.category !== "all") {
    query += " AND (LOWER(r.category_tag) LIKE ? OR r.resource_type = ?)";
    params.push(`%${options.category.toLowerCase()}%`, options.category.toLowerCase());
  }

  if (options?.search) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query += " AND (LOWER(r.slug) LIKE ? OR LOWER(COALESCE(rl.title, rles.title, '')) LIKE ? OR LOWER(COALESCE(rl.dek, rles.dek, '')) LIKE ?)";
    params.push(term, term, term);
  }

  query += " ORDER BY r.featured DESC, r.sort_order ASC, r.created_at DESC";

  const rows = (await db.prepare(query).bind(...params).all<any>()).results ?? [];

  return rows.map((row) => ({
    id: Number(row.id),
    slug: row.slug,
    resource_type: row.resource_type,
    category_tag: row.category_tag,
    file_url: row.file_url,
    external_url: row.external_url,
    cover_image_url: row.cover_image_url,
    format_label: row.format_label,
    pages_count: row.pages_count,
    languages_label: row.languages_label,
    status: row.status as "published" | "draft",
    featured: Boolean(row.featured),
    sort_order: Number(row.sort_order) || 0,
    locale,
    title: row.title,
    dek: row.dek,
    content_html: row.content_html,
    og: parseOgMetadata(row.og_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function loadResourceBySlug(
  db: D1Database,
  slug: string,
  locale: string
): Promise<ResourceItem | null> {
  const query = `
    SELECT r.*,
           COALESCE(rl.title, rles.title, 'Sin título') AS title,
           COALESCE(rl.dek, rles.dek, '') AS dek,
           COALESCE(rl.content_html, rles.content_html, '') AS content_html,
           COALESCE(rl.og_json, rles.og_json) AS og_json
      FROM resources r
      LEFT JOIN resource_locales rl ON rl.resource_id = r.id AND rl.locale = ?
      LEFT JOIN resource_locales rles ON rles.resource_id = r.id AND rles.locale = 'es'
     WHERE r.slug = ?
     LIMIT 1
  `;
  const row = await db.prepare(query).bind(locale, slug).first<any>();
  if (!row) return null;

  return {
    id: Number(row.id),
    slug: row.slug,
    resource_type: row.resource_type,
    category_tag: row.category_tag,
    file_url: row.file_url,
    external_url: row.external_url,
    cover_image_url: row.cover_image_url,
    format_label: row.format_label,
    pages_count: row.pages_count,
    languages_label: row.languages_label,
    status: row.status as "published" | "draft",
    featured: Boolean(row.featured),
    sort_order: Number(row.sort_order) || 0,
    locale,
    title: row.title,
    dek: row.dek,
    content_html: row.content_html,
    og: parseOgMetadata(row.og_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function loadResourceById(
  db: D1Database,
  id: number
): Promise<{ resource: ResourceRow; locales: Record<string, ResourceLocaleRow> } | null> {
  const resource = await db.prepare("SELECT * FROM resources WHERE id = ?").bind(id).first<ResourceRow>();
  if (!resource) return null;

  const localeRows = (await db.prepare("SELECT * FROM resource_locales WHERE resource_id = ?").bind(id).all<ResourceLocaleRow>()).results ?? [];
  const locales: Record<string, ResourceLocaleRow> = {};
  for (const l of localeRows) {
    locales[l.locale] = l;
  }

  return { resource, locales };
}

export async function loadAllResourcesWithLocales(
  db: D1Database
): Promise<{ resource: ResourceRow; locales: Record<string, ResourceLocaleRow> }[]> {
  const resources = (await db.prepare("SELECT * FROM resources ORDER BY featured DESC, sort_order ASC, created_at DESC").all<ResourceRow>()).results ?? [];
  const locales = (await db.prepare("SELECT * FROM resource_locales").all<ResourceLocaleRow>()).results ?? [];

  const localesMap = new Map<number, Record<string, ResourceLocaleRow>>();
  for (const l of locales) {
    if (!localesMap.has(l.resource_id)) {
      localesMap.set(l.resource_id, {});
    }
    localesMap.get(l.resource_id)![l.locale] = l;
  }

  return resources.map((r) => ({
    resource: r,
    locales: localesMap.get(r.id) ?? {},
  }));
}

export async function loadResourcesPageConfig(db: D1Database, locale: string): Promise<ResourcesPageData> {
  const row = await db
    .prepare("SELECT * FROM resources_page_locales WHERE locale = ?")
    .bind(locale)
    .first<any>();

  if (row) {
    return {
      eyebrow: row.eyebrow,
      title: row.title,
      lead: row.lead,
      band_title: row.band_title,
      band_dek: row.band_dek,
      band_cta_label: row.band_cta_label,
      band_cta_url: row.band_cta_url,
      og: parseOgMetadata(row.og_json),
    };
  }

  if (locale !== "es") {
    const fallback = await db
      .prepare("SELECT * FROM resources_page_locales WHERE locale = 'es'")
      .first<any>();
    if (fallback) {
      return {
        eyebrow: fallback.eyebrow,
        title: fallback.title,
        lead: fallback.lead,
        band_title: fallback.band_title,
        band_dek: fallback.band_dek,
        band_cta_label: fallback.band_cta_label,
        band_cta_url: fallback.band_cta_url,
        og: parseOgMetadata(fallback.og_json),
      };
    }
  }

  return {
    eyebrow: "Biblioteca libre",
    title: "Recursos para aprender y enseñar",
    lead: "Guías, lecturas y materiales descargables — gratuitos y listos para el aula, el círculo de lectura o el autoestudio.",
    band_title: "¿Tienes un recurso para compartir?",
    band_dek: "Súmalo a la biblioteca libre de AfroUp.",
    band_cta_label: "Colabora",
    band_cta_url: "/colabora",
    og: parseOgMetadata(null),
  };
}

export async function loadAllResourcesPageConfigs(db: D1Database): Promise<Record<string, ResourcesPageData>> {
  const rows = (await db.prepare("SELECT * FROM resources_page_locales").all<any>()).results ?? [];
  const map: Record<string, ResourcesPageData> = {};
  for (const row of rows) {
    map[row.locale] = {
      eyebrow: row.eyebrow,
      title: row.title,
      lead: row.lead,
      band_title: row.band_title,
      band_dek: row.band_dek,
      band_cta_label: row.band_cta_label,
      band_cta_url: row.band_cta_url,
      og: parseOgMetadata(row.og_json),
    };
  }
  return map;
}

export async function getResourceStats(db: D1Database): Promise<ResourceStats> {
  const totalRow = await db.prepare("SELECT COUNT(*) as total FROM resources").first<{ total: number }>();
  const pubRow = await db.prepare("SELECT COUNT(*) as published FROM resources WHERE status = 'published'").first<{ published: number }>();
  const draftRow = await db.prepare("SELECT COUNT(*) as drafts FROM resources WHERE status = 'draft'").first<{ drafts: number }>();
  const featRow = await db.prepare("SELECT COUNT(*) as featured FROM resources WHERE featured = 1").first<{ featured: number }>();

  return {
    total: Number(totalRow?.total) || 0,
    published: Number(pubRow?.published) || 0,
    drafts: Number(draftRow?.drafts) || 0,
    featured: Number(featRow?.featured) || 0,
  };
}

export async function deleteResource(db: D1Database, id: number): Promise<boolean> {
  const res = await db.prepare("DELETE FROM resources WHERE id = ?").bind(id).run();
  await removeSearchDocuments(db, "recursos", id);
  return Boolean(res.success);
}
