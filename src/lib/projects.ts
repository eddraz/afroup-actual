import type { D1Database } from "@cloudflare/workers-types";
import { parseOgMetadata, type OpenGraphMetadata } from "./og-metadata";

export type ProjectStage = "borrador" | "en_revision" | "aprobado";

export interface ProjectRow {
  id: number;
  slug: string;
  organization: string;
  stage: ProjectStage;
  budget_currency: string;
  budget_amount: number | null;
  start_date: string | null;
  status: "published" | "draft";
  featured: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectLocaleRow {
  project_id: number;
  locale: string;
  name: string;
  dek: string;
  description_html: string;
  og_json: string | null;
}

export interface ProjectItem {
  id: number;
  slug: string;
  organization: string;
  stage: ProjectStage;
  budget_currency: string;
  budget_amount: number | null;
  start_date: string | null;
  status: "published" | "draft";
  featured: boolean;
  sort_order: number;
  locale: string;
  name: string;
  dek: string;
  description_html: string;
  og: OpenGraphMetadata;
  created_at: string;
  updated_at: string;
}

export interface ProjectsPageData {
  eyebrow: string;
  title: string;
  lead: string;
  band_title: string;
  band_dek: string;
  band_cta_label: string;
  band_cta_url: string;
  og?: OpenGraphMetadata;
}

export interface ProjectsStats {
  total: number;
  published: number;
  approvedCount: number;
  draftCount: number;
}

export const PROJECT_STAGES = [
  { value: "borrador", es: "Borrador", en: "Draft" },
  { value: "en_revision", es: "En revisión", en: "In review" },
  { value: "aprobado", es: "Aprobado", en: "Approved" },
] as const;

export function slugifyProject(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "proyecto"
  );
}

export function formatBudget(currency: string | null | undefined, amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return `${currency || "USD"} ${Math.trunc(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

const PROJECT_SELECT = `
  SELECT p.*,
         COALESCE(pl.name, ples.name, 'Sin nombre') AS name,
         COALESCE(pl.dek, ples.dek, '') AS dek,
         COALESCE(pl.description_html, ples.description_html, '') AS description_html,
         COALESCE(pl.og_json, ples.og_json) AS og_json
    FROM projects p
    LEFT JOIN project_locales pl ON pl.project_id = p.id AND pl.locale = ?
    LEFT JOIN project_locales ples ON ples.project_id = p.id AND ples.locale = 'es'
`;

function mapProjectItem(row: any, locale: string): ProjectItem {
  return {
    id: Number(row.id),
    slug: row.slug,
    organization: row.organization,
    stage: row.stage as ProjectStage,
    budget_currency: row.budget_currency || "USD",
    budget_amount: row.budget_amount === null || row.budget_amount === undefined ? null : Number(row.budget_amount),
    start_date: row.start_date,
    status: row.status as "published" | "draft",
    featured: Boolean(row.featured),
    sort_order: Number(row.sort_order) || 0,
    locale,
    name: row.name,
    dek: row.dek,
    description_html: row.description_html,
    og: parseOgMetadata(row.og_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function loadProjects(
  db: D1Database,
  locale: string,
  options?: { status?: string; stage?: string; search?: string; limit?: number }
): Promise<ProjectItem[]> {
  let query = `${PROJECT_SELECT} WHERE 1=1`;
  const params: any[] = [locale];

  if (options?.status && options.status !== "all") {
    query += " AND p.status = ?";
    params.push(options.status);
  }

  if (options?.stage && options.stage !== "all") {
    query += " AND p.stage = ?";
    params.push(options.stage);
  }

  if (options?.search) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query +=
      " AND (LOWER(p.slug) LIKE ? OR LOWER(COALESCE(pl.name, ples.name, '')) LIKE ? OR LOWER(COALESCE(pl.dek, ples.dek, '')) LIKE ? OR LOWER(p.organization) LIKE ?)";
    params.push(term, term, term, term);
  }

  query += " ORDER BY p.featured DESC, p.sort_order ASC, p.created_at DESC";

  if (options?.limit && options.limit > 0) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const rows = (await db.prepare(query).bind(...params).all<any>()).results ?? [];
  return rows.map((row) => mapProjectItem(row, locale));
}

export async function loadProjectBySlug(
  db: D1Database,
  slug: string,
  locale: string
): Promise<ProjectItem | null> {
  const query = `${PROJECT_SELECT} WHERE p.slug = ? LIMIT 1`;

  const row = await db.prepare(query).bind(locale, slug).first<any>();
  if (!row) return null;

  return mapProjectItem(row, locale);
}

export async function loadProjectById(
  db: D1Database,
  id: number
): Promise<{ row: ProjectRow; locales: Record<string, ProjectLocaleRow> } | null> {
  const row = await db.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first<ProjectRow>();
  if (!row) return null;

  const localeRows =
    (await db.prepare("SELECT * FROM project_locales WHERE project_id = ?").bind(id).all<ProjectLocaleRow>())
      .results ?? [];
  const locales: Record<string, ProjectLocaleRow> = {};
  for (const l of localeRows) {
    locales[l.locale] = l;
  }

  return { row, locales };
}

export async function loadAllProjectsPageConfigs(db: D1Database): Promise<Record<string, ProjectsPageData>> {
  const rows = (await db.prepare("SELECT * FROM projects_page_locales").all<any>()).results ?? [];
  const configs: Record<string, ProjectsPageData> = {};
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

export async function getProjectsStats(db: D1Database): Promise<ProjectsStats> {
  const totalRow = await db.prepare("SELECT COUNT(*) AS c FROM projects").first<{ c: number }>();
  const pubRow = await db.prepare("SELECT COUNT(*) AS c FROM projects WHERE status = 'published'").first<{ c: number }>();
  const approvedRow = await db.prepare("SELECT COUNT(*) AS c FROM projects WHERE stage = 'aprobado'").first<{ c: number }>();
  const draftRow = await db.prepare("SELECT COUNT(*) AS c FROM projects WHERE stage = 'borrador'").first<{ c: number }>();

  return {
    total: totalRow?.c ?? 0,
    published: pubRow?.c ?? 0,
    approvedCount: approvedRow?.c ?? 0,
    draftCount: draftRow?.c ?? 0,
  };
}
