import type { D1Database } from "@cloudflare/workers-types";
import { parseOgMetadata, type OpenGraphMetadata } from "./og-metadata";

export type StoreCategory = "ebook" | "lamina" | "merch" | "descargable";

export interface StoreSpec {
  label: string;
  value: string;
}

export const STORE_CATEGORIES = [
  { value: "ebook", es: "eBook", en: "eBook" },
  { value: "lamina", es: "Lámina", en: "Print" },
  { value: "merch", es: "Merch", en: "Merch" },
  { value: "descargable", es: "Descargable", en: "Downloadable" },
] as const;

export interface StoreProductRow {
  id: number;
  slug: string;
  category: StoreCategory;
  image_url: string;
  image_label: string;
  price_currency: string;
  price_amount: number | null;
  compare_at_price: number | null;
  is_downloadable: number;
  status: "published" | "draft";
  featured: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StoreProductLocaleRow {
  product_id: number;
  locale: string;
  name: string;
  dek: string;
  description_html: string;
  specs_json: string;
  og_json: string | null;
}

export interface StoreProductItem {
  id: number;
  slug: string;
  category: StoreCategory;
  image_url: string;
  image_label: string;
  price_currency: string;
  price_amount: number | null;
  compare_at_price: number | null;
  is_downloadable: boolean;
  status: "published" | "draft";
  featured: boolean;
  sort_order: number;
  locale: string;
  name: string;
  dek: string;
  description_html: string;
  specs: StoreSpec[];
  og: OpenGraphMetadata;
  created_at: string;
  updated_at: string;
}

export interface StorePageData {
  eyebrow: string;
  title: string;
  lead: string;
  band_title: string;
  band_dek: string;
  band_cta_label: string;
  band_cta_url: string;
  og?: OpenGraphMetadata;
}

export interface StoreStats {
  total: number;
  published: number;
  featuredCount: number;
  freeCount: number;
}

export function slugifyStoreProduct(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "producto"
  );
}

function normalizeStoreSpecList(input: unknown): StoreSpec[] {
  if (!Array.isArray(input)) return [];
  const specs: StoreSpec[] = [];
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

export function parseStoreSpecs(raw: string | null | undefined): StoreSpec[] {
  if (!raw) return [];
  try {
    return normalizeStoreSpecList(JSON.parse(String(raw)));
  } catch {
    return [];
  }
}

export function serializeStoreSpecs(input: unknown): string {
  return JSON.stringify(normalizeStoreSpecList(input));
}

export function formatStorePrice(currency: string | null | undefined, amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return `${currency || "USD"} ${Math.trunc(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

const STORE_PRODUCT_SELECT = `
  SELECT sp.*,
         COALESCE(spl.name, sples.name, 'Sin nombre') AS name,
         COALESCE(spl.dek, sples.dek, '') AS dek,
         COALESCE(spl.description_html, sples.description_html, '') AS description_html,
         COALESCE(spl.specs_json, sples.specs_json, '[]') AS specs_json,
         COALESCE(spl.og_json, sples.og_json) AS og_json
    FROM store_products sp
    LEFT JOIN store_product_locales spl ON spl.product_id = sp.id AND spl.locale = ?
    LEFT JOIN store_product_locales sples ON sples.product_id = sp.id AND sples.locale = 'es'
`;

function mapStoreProductItem(row: any, locale: string): StoreProductItem {
  return {
    id: Number(row.id),
    slug: row.slug,
    category: row.category as StoreCategory,
    image_url: row.image_url || "",
    image_label: row.image_label || "",
    price_currency: row.price_currency || "USD",
    price_amount: row.price_amount === null || row.price_amount === undefined ? null : Number(row.price_amount),
    compare_at_price:
      row.compare_at_price === null || row.compare_at_price === undefined ? null : Number(row.compare_at_price),
    is_downloadable: Boolean(row.is_downloadable),
    status: row.status as "published" | "draft",
    featured: Boolean(row.featured),
    sort_order: Number(row.sort_order) || 0,
    locale,
    name: row.name,
    dek: row.dek,
    description_html: row.description_html,
    specs: parseStoreSpecs(row.specs_json),
    og: parseOgMetadata(row.og_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function loadStoreProducts(
  db: D1Database,
  locale: string,
  options?: { status?: string; category?: string; search?: string; limit?: number }
): Promise<StoreProductItem[]> {
  let query = `${STORE_PRODUCT_SELECT} WHERE 1=1`;
  const params: any[] = [locale];

  if (options?.status && options.status !== "all") {
    query += " AND sp.status = ?";
    params.push(options.status);
  }

  if (options?.category && options.category !== "all") {
    query += " AND sp.category = ?";
    params.push(options.category);
  }

  if (options?.search) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query +=
      " AND (LOWER(sp.slug) LIKE ? OR LOWER(COALESCE(spl.name, sples.name, '')) LIKE ? OR LOWER(COALESCE(spl.dek, sples.dek, '')) LIKE ?)";
    params.push(term, term, term);
  }

  query += " ORDER BY sp.featured DESC, sp.sort_order ASC, sp.created_at DESC";

  if (options?.limit && options.limit > 0) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const rows = (await db.prepare(query).bind(...params).all<any>()).results ?? [];
  return rows.map((row) => mapStoreProductItem(row, locale));
}

export async function loadStoreProductBySlug(
  db: D1Database,
  slug: string,
  locale: string
): Promise<StoreProductItem | null> {
  const row = await db.prepare(`${STORE_PRODUCT_SELECT} WHERE sp.slug = ? LIMIT 1`).bind(locale, slug).first<any>();
  if (!row) return null;

  return mapStoreProductItem(row, locale);
}

export async function loadStoreProductById(
  db: D1Database,
  id: number
): Promise<{ row: StoreProductRow; locales: Record<string, StoreProductLocaleRow> } | null> {
  const row = await db.prepare("SELECT * FROM store_products WHERE id = ?").bind(id).first<StoreProductRow>();
  if (!row) return null;

  const localeRows =
    (
      await db.prepare("SELECT * FROM store_product_locales WHERE product_id = ?").bind(id).all<StoreProductLocaleRow>()
    ).results ?? [];
  const locales: Record<string, StoreProductLocaleRow> = {};
  for (const l of localeRows) {
    locales[l.locale] = l;
  }

  return { row, locales };
}

export async function loadAllStorePageConfigs(db: D1Database): Promise<Record<string, StorePageData>> {
  const rows = (await db.prepare("SELECT * FROM store_page_locales").all<any>()).results ?? [];
  const configs: Record<string, StorePageData> = {};
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

export async function getStoreStats(db: D1Database): Promise<StoreStats> {
  const totalRow = await db.prepare("SELECT COUNT(*) AS c FROM store_products").first<{ c: number }>();
  const pubRow =
    await db.prepare("SELECT COUNT(*) AS c FROM store_products WHERE status = 'published'").first<{ c: number }>();
  const featuredRow =
    await db.prepare("SELECT COUNT(*) AS c FROM store_products WHERE featured = 1").first<{ c: number }>();
  const freeRow =
    await db.prepare("SELECT COUNT(*) AS c FROM store_products WHERE price_amount IS NULL").first<{ c: number }>();

  return {
    total: totalRow?.c ?? 0,
    published: pubRow?.c ?? 0,
    featuredCount: featuredRow?.c ?? 0,
    freeCount: freeRow?.c ?? 0,
  };
}
