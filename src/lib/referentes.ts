import type { D1Database } from "@cloudflare/workers-types";
import { parseOgMetadata, type OgMetadata } from "./og-metadata";
import { applySearchDocument, removeSearchDocuments, searchDocumentPath } from "./search-documents";

export interface ReferenteMilestone {
  year: string;
  event: string;
}

export interface ReferenteRow {
  id: number;
  slug: string;
  category_tag: string;
  badge_theme: string;
  photo_url: string | null;
  years_active: string | null;
  quote: string | null;
  milestones_json: string | null;
  status: "published" | "draft";
  featured: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReferenteLocaleRow {
  referente_id: number;
  locale: string;
  name: string;
  role_label: string | null;
  years_label: string | null;
  dek: string | null;
  bio_html: string | null;
  quote: string | null;
  milestones_json: string | null;
  og_json: string | null;
}

export interface ReferenteItem {
  id: number;
  slug: string;
  category_tag: string;
  badge_theme: string;
  photo_url: string | null;
  years_active: string | null;
  status: "published" | "draft";
  featured: boolean;
  sort_order: number;
  locale: string;
  name: string;
  role_label: string;
  years_label: string;
  dek: string;
  bio_html: string;
  quote: string;
  milestones: ReferenteMilestone[];
  og: OgMetadata;
  created_at: string;
  updated_at: string;
}

export interface ReferentesPageData {
  eyebrow: string;
  title: string;
  lead: string;
  band_title: string;
  band_dek: string;
  band_cta_label: string;
  band_cta_url: string;
  og?: OgMetadata;
}

export interface ReferentesStats {
  total: number;
  published: number;
  categoriesCount: number;
  featuredCount: number;
}

export const REFERENTES_CATEGORIES = [
  "Historia",
  "Activismo",
  "Pensamiento",
  "Arte",
  "Ciencia",
  "Deporte",
] as const;

export function slugifyReferente(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "referente"
  );
}

export function parseMilestones(json: string | null | undefined): ReferenteMilestone[] {
  if (!json || typeof json !== "string") return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any) => ({
        year: String(item.year || "").trim(),
        event: String(item.event || "").trim(),
      }))
      .filter((item) => item.year || item.event);
  } catch {
    return [];
  }
}

export function serializeMilestones(milestones: ReferenteMilestone[]): string {
  if (!Array.isArray(milestones)) return "[]";
  const clean = milestones
    .map((m) => ({
      year: String(m.year || "").trim(),
      event: String(m.event || "").trim(),
    }))
    .filter((m) => m.year || m.event);
  return JSON.stringify(clean);
}

export async function loadReferentes(
  db: D1Database,
  locale: string,
  options?: { status?: string; category?: string; search?: string; limit?: number }
): Promise<ReferenteItem[]> {
  let query = `
    SELECT r.*,
           COALESCE(rl.name, rles.name, 'Sin nombre') AS name,
           COALESCE(rl.role_label, rles.role_label, '') AS role_label,
           COALESCE(rl.years_label, rles.years_label, r.years_active, '') AS years_label,
           COALESCE(rl.dek, rles.dek, '') AS dek,
           COALESCE(rl.bio_html, rles.bio_html, '') AS bio_html,
           COALESCE(rl.quote, rles.quote, r.quote, '') AS quote,
           COALESCE(rl.milestones_json, rles.milestones_json, r.milestones_json, '[]') AS milestones_json,
           COALESCE(rl.og_json, rles.og_json) AS og_json
      FROM referentes r
      LEFT JOIN referente_locales rl ON rl.referente_id = r.id AND rl.locale = ?
      LEFT JOIN referente_locales rles ON rles.referente_id = r.id AND rles.locale = 'es'
     WHERE 1=1
  `;
  const params: any[] = [locale];

  if (options?.status && options.status !== "all") {
    query += " AND r.status = ?";
    params.push(options.status);
  }

  if (options?.category && options.category !== "all" && options.category !== "Todos" && options.category !== "All") {
    query += " AND (LOWER(r.category_tag) = LOWER(?) OR LOWER(r.category_tag) LIKE ?)";
    params.push(options.category, `%${options.category}%`);
  }

  if (options?.search) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query += " AND (LOWER(r.slug) LIKE ? OR LOWER(COALESCE(rl.name, rles.name, '')) LIKE ? OR LOWER(COALESCE(rl.dek, rles.dek, '')) LIKE ?)";
    params.push(term, term, term);
  }

  query += " ORDER BY r.featured DESC, r.sort_order ASC, r.created_at DESC";

  if (options?.limit && options.limit > 0) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const rows = (await db.prepare(query).bind(...params).all<any>()).results ?? [];

  return rows.map((row) => ({
    id: Number(row.id),
    slug: row.slug,
    category_tag: row.category_tag,
    badge_theme: row.badge_theme || "primary",
    photo_url: row.photo_url,
    years_active: row.years_active,
    status: row.status as "published" | "draft",
    featured: Boolean(row.featured),
    sort_order: Number(row.sort_order) || 0,
    locale,
    name: row.name,
    role_label: row.role_label,
    years_label: row.years_label,
    dek: row.dek,
    bio_html: row.bio_html,
    quote: row.quote,
    milestones: parseMilestones(row.milestones_json),
    og: parseOgMetadata(row.og_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function loadReferenteBySlug(
  db: D1Database,
  slug: string,
  locale: string
): Promise<ReferenteItem | null> {
  const query = `
    SELECT r.*,
           COALESCE(rl.name, rles.name, 'Sin nombre') AS name,
           COALESCE(rl.role_label, rles.role_label, '') AS role_label,
           COALESCE(rl.years_label, rles.years_label, r.years_active, '') AS years_label,
           COALESCE(rl.dek, rles.dek, '') AS dek,
           COALESCE(rl.bio_html, rles.bio_html, '') AS bio_html,
           COALESCE(rl.quote, rles.quote, r.quote, '') AS quote,
           COALESCE(rl.milestones_json, rles.milestones_json, r.milestones_json, '[]') AS milestones_json,
           COALESCE(rl.og_json, rles.og_json) AS og_json
      FROM referentes r
      LEFT JOIN referente_locales rl ON rl.referente_id = r.id AND rl.locale = ?
      LEFT JOIN referente_locales rles ON rles.referente_id = r.id AND rles.locale = 'es'
     WHERE r.slug = ?
     LIMIT 1
  `;

  const row = await db.prepare(query).bind(locale, slug).first<any>();
  if (!row) return null;

  return {
    id: Number(row.id),
    slug: row.slug,
    category_tag: row.category_tag,
    badge_theme: row.badge_theme || "primary",
    photo_url: row.photo_url,
    years_active: row.years_active,
    status: row.status as "published" | "draft",
    featured: Boolean(row.featured),
    sort_order: Number(row.sort_order) || 0,
    locale,
    name: row.name,
    role_label: row.role_label,
    years_label: row.years_label,
    dek: row.dek,
    bio_html: row.bio_html,
    quote: row.quote,
    milestones: parseMilestones(row.milestones_json),
    og: parseOgMetadata(row.og_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function loadReferenteById(
  db: D1Database,
  id: number
): Promise<{ referente: ReferenteRow; locales: Record<string, ReferenteLocaleRow> } | null> {
  const referente = await db.prepare("SELECT * FROM referentes WHERE id = ?").bind(id).first<ReferenteRow>();
  if (!referente) return null;

  const localeRows = (await db.prepare("SELECT * FROM referente_locales WHERE referente_id = ?").bind(id).all<ReferenteLocaleRow>()).results ?? [];
  const locales: Record<string, ReferenteLocaleRow> = {};
  for (const l of localeRows) {
    locales[l.locale] = l;
  }

  return { referente, locales };
}

export async function loadAllReferentesWithLocales(
  db: D1Database
): Promise<{ referente: ReferenteRow; locales: Record<string, ReferenteLocaleRow> }[]> {
  const referentes = (await db.prepare("SELECT * FROM referentes ORDER BY featured DESC, sort_order ASC, created_at DESC").all<ReferenteRow>()).results ?? [];
  const locales = (await db.prepare("SELECT * FROM referente_locales").all<ReferenteLocaleRow>()).results ?? [];

  const localesMap = new Map<number, Record<string, ReferenteLocaleRow>>();
  for (const l of locales) {
    if (!localesMap.has(l.referente_id)) {
      localesMap.set(l.referente_id, {});
    }
    localesMap.get(l.referente_id)![l.locale] = l;
  }

  return referentes.map((r) => ({
    referente: r,
    locales: localesMap.get(r.id) ?? {},
  }));
}

export async function loadReferentesPageConfig(db: D1Database, locale: string): Promise<ReferentesPageData> {
  const row = await db
    .prepare("SELECT * FROM referentes_page_locales WHERE locale = ?")
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

  return {
    eyebrow: locale === "en" ? "Community" : "Comunidad",
    title: locale === "en" ? "Role Models & Figures" : "Referentes",
    lead: locale === "en"
      ? "The people who paved the way — from history and the present. Knowing them is part of knowing ourselves."
      : "Las personas que abrieron camino — de la historia y del presente. Conocerlas es parte de conocernos.",
    band_title: locale === "en" ? "Is someone missing?" : "¿Falta alguien?",
    band_dek: locale === "en" ? "Propose a role model or historical figure for the collection." : "Propón un referente para la colección.",
    band_cta_label: locale === "en" ? "Propose" : "Proponer",
    band_cta_url: locale === "en" ? "/en/colabora" : "/colabora",
  };
}

export async function loadAllReferentesPageConfigs(db: D1Database): Promise<Record<string, ReferentesPageData>> {
  const rows = (await db.prepare("SELECT * FROM referentes_page_locales").all<any>()).results ?? [];
  const configs: Record<string, ReferentesPageData> = {};
  for (const row of rows) {
    configs[row.locale] = {
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
  return configs;
}

export async function getReferentesStats(db: D1Database): Promise<ReferentesStats> {
  const totalRow = await db.prepare("SELECT COUNT(*) AS c FROM referentes").first<{ c: number }>();
  const pubRow = await db.prepare("SELECT COUNT(*) AS c FROM referentes WHERE status = 'published'").first<{ c: number }>();
  const featRow = await db.prepare("SELECT COUNT(*) AS c FROM referentes WHERE featured = 1").first<{ c: number }>();
  const catRow = await db.prepare("SELECT COUNT(DISTINCT category_tag) AS c FROM referentes WHERE category_tag IS NOT NULL AND category_tag != ''").first<{ c: number }>();

  return {
    total: totalRow?.c ?? 0,
    published: pubRow?.c ?? 0,
    categoriesCount: catRow?.c ?? 0,
    featuredCount: featRow?.c ?? 0,
  };
}
