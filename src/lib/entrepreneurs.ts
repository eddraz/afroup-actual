import type { D1Database } from "@cloudflare/workers-types";
import { parseOgMetadata, type OpenGraphMetadata } from "./og-metadata";

export type EntrepreneurCategory = "moda" | "alimentos" | "belleza" | "editorial" | "arte";

export type OfferingKind = "producto" | "servicio";

export const ENTREPRENEUR_CATEGORIES = [
  { value: "moda", es: "Moda", en: "Fashion" },
  { value: "alimentos", es: "Alimentos", en: "Food" },
  { value: "belleza", es: "Belleza", en: "Beauty" },
  { value: "editorial", es: "Editorial", en: "Publishing" },
  { value: "arte", es: "Arte", en: "Art" },
] as const;

export const OFFERING_KINDS = [
  { value: "producto", es: "Producto", en: "Product" },
  { value: "servicio", es: "Servicio", en: "Service" },
] as const;

export interface EntrepreneurRow {
  id: number;
  slug: string;
  category: EntrepreneurCategory;
  city: string;
  country: string;
  founded_year: number | null;
  logo_url: string;
  instagram_handle: string;
  website_url: string;
  contact_email: string;
  team_size: number | null;
  status: "published" | "draft";
  featured: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EntrepreneurLocaleRow {
  entrepreneur_id: number;
  locale: string;
  name: string;
  dek: string;
  story_html: string;
  quote: string;
  rubro_label: string;
  team_label: string;
  shipping_label: string;
  og_json: string | null;
}

export interface OfferingRow {
  id: number;
  entrepreneur_id: number;
  slug: string;
  kind: OfferingKind;
  image_url: string;
  price_currency: string;
  price_amount: number | null;
  sort_order: number;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
}

export interface OfferingLocaleRow {
  offering_id: number;
  locale: string;
  name: string;
  dek: string;
  description_html: string;
  specs_json: string;
  og_json: string | null;
}

export interface OfferingSpec {
  label: string;
  value: string;
}

export interface EntrepreneurItem {
  id: number;
  slug: string;
  category: EntrepreneurCategory;
  city: string;
  country: string;
  founded_year: number | null;
  logo_url: string;
  instagram_handle: string;
  website_url: string;
  contact_email: string;
  team_size: number | null;
  status: "published" | "draft";
  featured: boolean;
  sort_order: number;
  locale: string;
  name: string;
  dek: string;
  story_html: string;
  quote: string;
  rubro_label: string;
  team_label: string;
  shipping_label: string;
  og: OpenGraphMetadata;
  created_at: string;
  updated_at: string;
}

export interface EntrepreneurOfferingItem {
  id: number;
  entrepreneur_id: number;
  slug: string;
  kind: OfferingKind;
  image_url: string;
  price_currency: string;
  price_amount: number | null;
  sort_order: number;
  status: "published" | "draft";
  locale: string;
  name: string;
  dek: string;
  description_html: string;
  specs: OfferingSpec[];
  og: OpenGraphMetadata;
  created_at: string;
  updated_at: string;
}

export interface EntrepreneursPageData {
  eyebrow: string;
  title: string;
  lead: string;
  band_title: string;
  band_dek: string;
  band_cta_label: string;
  band_cta_url: string;
  og?: OpenGraphMetadata;
}

export interface EntrepreneursStats {
  total: number;
  published: number;
  productsCount: number;
  servicesCount: number;
}

export function slugifyEntrepreneur(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "emprendimiento"
  );
}

function normalizeSpecList(input: unknown): OfferingSpec[] {
  if (!Array.isArray(input)) return [];
  const specs: OfferingSpec[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const label = String((item as Record<string, unknown>).label ?? "").trim();
    if (!label) continue;
    const valueRaw = (item as Record<string, unknown>).value;
    const value = valueRaw === null || valueRaw === undefined ? "" : String(valueRaw);
    specs.push({ label, value });
  }
  return specs;
}

export function parseSpecs(raw: string | null | undefined): OfferingSpec[] {
  if (!raw) return [];
  try {
    return normalizeSpecList(JSON.parse(String(raw)));
  } catch {
    return [];
  }
}

export function serializeSpecs(input: unknown): string {
  return JSON.stringify(normalizeSpecList(input));
}

export function formatPrice(currency: string | null | undefined, amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return `${currency || "USD"} ${Math.trunc(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

const ENTREPRENEUR_SELECT = `
  SELECT e.*,
         COALESCE(el.name, eles.name, 'Sin nombre') AS name,
         COALESCE(el.dek, eles.dek, '') AS dek,
         COALESCE(el.story_html, eles.story_html, '') AS story_html,
         COALESCE(el.quote, eles.quote, '') AS quote,
         COALESCE(el.rubro_label, eles.rubro_label, '') AS rubro_label,
         COALESCE(el.team_label, eles.team_label, '') AS team_label,
         COALESCE(el.shipping_label, eles.shipping_label, '') AS shipping_label,
         COALESCE(el.og_json, eles.og_json) AS og_json
    FROM entrepreneurs e
    LEFT JOIN entrepreneur_locales el ON el.entrepreneur_id = e.id AND el.locale = ?
    LEFT JOIN entrepreneur_locales eles ON eles.entrepreneur_id = e.id AND eles.locale = 'es'
`;

const OFFERING_SELECT = `
  SELECT oe.*,
         COALESCE(oel.name, oeles.name, 'Sin nombre') AS name,
         COALESCE(oel.dek, oeles.dek, '') AS dek,
         COALESCE(oel.description_html, oeles.description_html, '') AS description_html,
         COALESCE(oel.specs_json, oeles.specs_json, '[]') AS specs_json,
         COALESCE(oel.og_json, oeles.og_json) AS og_json
    FROM entrepreneur_offerings oe
    LEFT JOIN entrepreneur_offering_locales oel ON oel.offering_id = oe.id AND oel.locale = ?
    LEFT JOIN entrepreneur_offering_locales oeles ON oeles.offering_id = oe.id AND oeles.locale = 'es'
`;

function mapEntrepreneurItem(row: any, locale: string): EntrepreneurItem {
  return {
    id: Number(row.id),
    slug: row.slug,
    category: row.category as EntrepreneurCategory,
    city: row.city || "",
    country: row.country || "",
    founded_year: row.founded_year === null || row.founded_year === undefined ? null : Number(row.founded_year),
    logo_url: row.logo_url || "",
    instagram_handle: row.instagram_handle || "",
    website_url: row.website_url || "",
    contact_email: row.contact_email || "",
    team_size: row.team_size === null || row.team_size === undefined ? null : Number(row.team_size),
    status: row.status as "published" | "draft",
    featured: Boolean(row.featured),
    sort_order: Number(row.sort_order) || 0,
    locale,
    name: row.name,
    dek: row.dek,
    story_html: row.story_html,
    quote: row.quote,
    rubro_label: row.rubro_label,
    team_label: row.team_label,
    shipping_label: row.shipping_label,
    og: parseOgMetadata(row.og_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapOfferingItem(row: any, locale: string): EntrepreneurOfferingItem {
  return {
    id: Number(row.id),
    entrepreneur_id: Number(row.entrepreneur_id),
    slug: row.slug,
    kind: row.kind as OfferingKind,
    image_url: row.image_url || "",
    price_currency: row.price_currency || "USD",
    price_amount: row.price_amount === null || row.price_amount === undefined ? null : Number(row.price_amount),
    sort_order: Number(row.sort_order) || 0,
    status: row.status as "published" | "draft",
    locale,
    name: row.name,
    dek: row.dek,
    description_html: row.description_html,
    specs: parseSpecs(row.specs_json),
    og: parseOgMetadata(row.og_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function loadEntrepreneurs(
  db: D1Database,
  locale: string,
  options?: { status?: string; category?: string; search?: string; limit?: number }
): Promise<EntrepreneurItem[]> {
  let query = `${ENTREPRENEUR_SELECT} WHERE 1=1`;
  const params: any[] = [locale];

  if (options?.status && options.status !== "all") {
    query += " AND e.status = ?";
    params.push(options.status);
  }

  if (options?.category && options.category !== "all") {
    query += " AND e.category = ?";
    params.push(options.category);
  }

  if (options?.search) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query +=
      " AND (LOWER(e.slug) LIKE ? OR LOWER(COALESCE(el.name, eles.name, '')) LIKE ? OR LOWER(COALESCE(el.dek, eles.dek, '')) LIKE ? OR LOWER(e.city) LIKE ? OR LOWER(e.country) LIKE ?)";
    params.push(term, term, term, term, term);
  }

  query += " ORDER BY e.featured DESC, e.sort_order ASC, e.created_at DESC";

  if (options?.limit && options.limit > 0) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const rows = (await db.prepare(query).bind(...params).all<any>()).results ?? [];
  return rows.map((row) => mapEntrepreneurItem(row, locale));
}

export async function loadEntrepreneurBySlug(
  db: D1Database,
  slug: string,
  locale: string
): Promise<EntrepreneurItem | null> {
  const query = `${ENTREPRENEUR_SELECT} WHERE e.slug = ? LIMIT 1`;

  const row = await db.prepare(query).bind(locale, slug).first<any>();
  if (!row) return null;

  return mapEntrepreneurItem(row, locale);
}

export async function loadOfferings(
  db: D1Database,
  entrepreneurId: number,
  locale: string
): Promise<EntrepreneurOfferingItem[]> {
  const query = `${OFFERING_SELECT} WHERE oe.entrepreneur_id = ? ORDER BY oe.sort_order ASC, oe.id ASC`;
  const rows = (await db.prepare(query).bind(locale, entrepreneurId).all<any>()).results ?? [];
  return rows.map((row) => mapOfferingItem(row, locale));
}

export async function loadEntrepreneurById(
  db: D1Database,
  id: number
): Promise<{
  row: EntrepreneurRow;
  locales: Record<string, EntrepreneurLocaleRow>;
  offerings: { row: OfferingRow; locales: Record<string, OfferingLocaleRow> }[];
} | null> {
  const row = await db.prepare("SELECT * FROM entrepreneurs WHERE id = ?").bind(id).first<EntrepreneurRow>();
  if (!row) return null;

  const localeRows =
    (
      await db
        .prepare("SELECT * FROM entrepreneur_locales WHERE entrepreneur_id = ?")
        .bind(id)
        .all<EntrepreneurLocaleRow>()
    ).results ?? [];
  const locales: Record<string, EntrepreneurLocaleRow> = {};
  for (const l of localeRows) {
    locales[l.locale] = l;
  }

  const offeringRows =
    (
      await db
        .prepare("SELECT * FROM entrepreneur_offerings WHERE entrepreneur_id = ? ORDER BY sort_order ASC, id ASC")
        .bind(id)
        .all<OfferingRow>()
    ).results ?? [];

  const offerings: { row: OfferingRow; locales: Record<string, OfferingLocaleRow> }[] = [];
  for (const offering of offeringRows) {
    const offeringLocaleRows =
      (
        await db
          .prepare("SELECT * FROM entrepreneur_offering_locales WHERE offering_id = ?")
          .bind(offering.id)
          .all<OfferingLocaleRow>()
      ).results ?? [];
    const offeringLocales: Record<string, OfferingLocaleRow> = {};
    for (const l of offeringLocaleRows) {
      offeringLocales[l.locale] = l;
    }
    offerings.push({ row: offering, locales: offeringLocales });
  }

  return { row, locales, offerings };
}

export async function loadAllEntrepreneursPageConfigs(db: D1Database): Promise<Record<string, EntrepreneursPageData>> {
  const rows = (await db.prepare("SELECT * FROM entrepreneurs_page_locales").all<any>()).results ?? [];
  const configs: Record<string, EntrepreneursPageData> = {};
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

export async function getEntrepreneursStats(db: D1Database): Promise<EntrepreneursStats> {
  const totalRow = await db.prepare("SELECT COUNT(*) AS c FROM entrepreneurs").first<{ c: number }>();
  const pubRow = await db
    .prepare("SELECT COUNT(*) AS c FROM entrepreneurs WHERE status = 'published'")
    .first<{ c: number }>();
  const productsRow = await db
    .prepare("SELECT COUNT(*) AS c FROM entrepreneur_offerings WHERE kind = 'producto'")
    .first<{ c: number }>();
  const servicesRow = await db
    .prepare("SELECT COUNT(*) AS c FROM entrepreneur_offerings WHERE kind = 'servicio'")
    .first<{ c: number }>();

  return {
    total: totalRow?.c ?? 0,
    published: pubRow?.c ?? 0,
    productsCount: productsRow?.c ?? 0,
    servicesCount: servicesRow?.c ?? 0,
  };
}
