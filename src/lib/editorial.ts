import type { D1Database } from "@cloudflare/workers-types";
import { hasSharedRecord } from "./record-scope";
import { plannedBioWrites, PRIMARY_BIO_LOCALE as defaultLocale, type BioTranslationAccess } from "./bio-writes";
import { effectiveGrant } from "./permission-grants";
import type { PermissionAction } from "./rbac";

export { parseTagList, slugify } from "./slugs";

export function parseLocaleFields(form: FormData, field: string): Record<string, string> {
  const values: Record<string, string> = {};
  const prefix = `${field}[`;
  for (const [key, value] of form.entries()) {
    if (!key.startsWith(prefix) || !key.endsWith("]")) continue;
    const locale = key.slice(prefix.length, -1).trim().toLowerCase();
    if (/^[a-z]{2}$/.test(locale)) values[locale] = String(value ?? "");
  }
  return values;
}

export function calculateReadingTimeMinutes(textOrHtml: string, wordsPerMinute = 200): number {
  const cleanText = String(textOrHtml ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleanText) return 1;
  const words = cleanText.split(" ").length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function plannedLocales(
  titles: Record<string, string>,
  descriptions: Record<string, string>,
  existingTitles: Record<string, string>,
  existingDescriptions: Record<string, string>,
  access: BioTranslationAccess,
): Array<{ locale: string; title: string; description: string }> {
  const plannedTitles = plannedBioWrites(titles, existingTitles, access, defaultLocale);
  const plannedDescriptions = plannedBioWrites(descriptions, existingDescriptions, access, defaultLocale);
  const locales = new Set([...Object.keys(plannedTitles), ...Object.keys(plannedDescriptions)]);
  const rows: Array<{ locale: string; title: string; description: string }> = [];
  for (const locale of locales) {
    const title = plannedTitles[locale] ?? "";
    if (!title) continue;
    rows.push({
      locale,
      title,
      description: plannedDescriptions[locale] ?? "",
    });
  }
  return rows;
}

function isBlankContent(value: string | null | undefined): boolean {
  return !value || String(value).trim().length === 0;
}

export function plannedContentWrites(
  submitted: Record<string, string>,
  existing: Record<string, string>,
  access: BioTranslationAccess,
  primaryLocale = defaultLocale,
): Record<string, string> {
  const planned: Record<string, string> = {};
  const locales = new Set([...Object.keys(existing), ...Object.keys(submitted)]);

  for (const locale of locales) {
    const submittedBody = String(submitted[locale] ?? "").trim();
    const existingBody = String(existing[locale] ?? "").trim();

    if (locale === primaryLocale) {
      if (!isBlankContent(submittedBody)) planned[locale] = submittedBody;
      continue;
    }

    if (access.canWrite || access.canUseAi) {
      if (!isBlankContent(submittedBody)) planned[locale] = submittedBody;
      continue;
    }

    if (!isBlankContent(existingBody)) planned[locale] = existingBody;
  }

  return planned;
}

export function plannedArticleLocales(
  titles: Record<string, string>,
  descriptions: Record<string, string>,
  contents: Record<string, string>,
  existingTitles: Record<string, string>,
  existingDescriptions: Record<string, string>,
  existingContents: Record<string, string>,
  access: BioTranslationAccess,
): Array<{ locale: string; title: string; description: string; content_html: string }> {
  const plannedTitles = plannedBioWrites(titles, existingTitles, access, defaultLocale);
  const plannedDescriptions = plannedBioWrites(descriptions, existingDescriptions, access, defaultLocale);
  const plannedContents = plannedContentWrites(contents, existingContents, access, defaultLocale);
  const locales = new Set([
    ...Object.keys(plannedTitles),
    ...Object.keys(plannedDescriptions),
    ...Object.keys(plannedContents),
  ]);
  const rows: Array<{ locale: string; title: string; description: string; content_html: string }> = [];
  for (const locale of locales) {
    const title = plannedTitles[locale] ?? "";
    if (!title) continue;
    rows.push({
      locale,
      title,
      description: plannedDescriptions[locale] ?? "",
      content_html: plannedContents[locale] ?? "",
    });
  }
  return rows;
}

export async function translationAccess(
  db: D1Database,
  userId: number,
  moduleSlug: string,
  action: PermissionAction = "update",
): Promise<BioTranslationAccess> {
  const grant = await effectiveGrant(db, userId, moduleSlug, action);
  return { canWrite: grant.translateManual, canUseAi: grant.translateAi };
}

export async function canManageOwnedRecord(
  db: D1Database,
  actorId: number,
  table: "article_categories" | "articles",
  recordId: number,
  moduleSlug: "categorias" | "articulos",
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT created_by FROM ${table} WHERE id = ? LIMIT 1`)
    .bind(recordId)
    .first<{ created_by: number | null }>();
  if (!row) return false;
  if (row.created_by === null) return true;
  if (row.created_by === actorId) return true;
  return hasSharedRecord(db, actorId, moduleSlug, recordId);
}

export function visibleOwnerClause(ownerColumn = "created_by", idColumn?: string): string {
  const tableAlias = ownerColumn.includes(".") ? ownerColumn.split(".")[0] : "";
  const resolvedId = idColumn ?? (tableAlias ? `${tableAlias}.id` : "id");
  return `(${ownerColumn} = ? OR ${ownerColumn} IS NULL OR ${resolvedId} IN (SELECT record_id FROM record_shares WHERE module_slug = ? AND shared_with_id = ?))`;
}

export interface ArticleValidationInput {
  status: "draft" | "published" | string;
  primaryTitle?: string | null;
  primaryDescription?: string | null;
  primaryContent?: string | null;
  categoryIds?: number[];
  tags?: string[];
  coverImageUrl?: string | null;
  slug?: string | null;
}

export type ArticleValidationError =
  | "title_required"
  | "description_required"
  | "content_required"
  | "category_required"
  | "tags_required"
  | "cover_image_required"
  | "slug_required"
  | "slug_invalid";

export interface ArticleValidationResult {
  ok: boolean;
  error?: ArticleValidationError;
  message?: string;
}

export function validateArticleInput(input: ArticleValidationInput): ArticleValidationResult {
  const isPublished = input.status === "published";
  const title = String(input.primaryTitle ?? "").trim();

  // Both draft and published require at least a title
  if (!title) {
    return {
      ok: false,
      error: "title_required",
      message: isPublished
        ? "El título es obligatorio para publicar el artículo."
        : "El título es obligatorio para guardar el borrador.",
    };
  }

  // If saving as draft, only the title is required
  if (!isPublished) {
    return { ok: true };
  }

  // Publishing requires ALL fields to be filled
  const description = String(input.primaryDescription ?? "").trim();
  if (!description) {
    return {
      ok: false,
      error: "description_required",
      message: "La bajada o resumen es obligatoria para publicar el artículo.",
    };
  }

  const cleanContent = String(input.primaryContent ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!cleanContent) {
    return {
      ok: false,
      error: "content_required",
      message: "El cuerpo del artículo es obligatorio para publicar el artículo.",
    };
  }

  const categoryIds = Array.isArray(input.categoryIds) ? input.categoryIds : [];
  if (categoryIds.length === 0) {
    return {
      ok: false,
      error: "category_required",
      message: "Debes seleccionar al menos una categoría para publicar el artículo.",
    };
  }

  const tags = Array.isArray(input.tags) ? input.tags : [];
  if (tags.length === 0) {
    return {
      ok: false,
      error: "tags_required",
      message: "Debes incluir al menos una etiqueta para publicar el artículo.",
    };
  }

  const coverImageUrl = String(input.coverImageUrl ?? "").trim();
  if (!coverImageUrl) {
    return {
      ok: false,
      error: "cover_image_required",
      message: "La imagen de portada es obligatoria para publicar el artículo.",
    };
  }

  const slug = String(input.slug ?? "").trim().toLowerCase();
  if (!slug) {
    return {
      ok: false,
      error: "slug_required",
      message: "El slug URL es obligatorio para publicar el artículo.",
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      error: "slug_invalid",
      message: "El slug URL contiene caracteres no válidos.",
    };
  }

  return { ok: true };
}

