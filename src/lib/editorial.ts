import type { D1Database } from "@cloudflare/workers-types";
import { hasSharedRecord } from "./admin-scope";
import { plannedBioWrites, type BioTranslationAccess } from "./bio-writes";
import { defaultLocale } from "./i18n";
import { effectiveGrant } from "./permission-grants";
import type { PermissionAction } from "./rbac";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseLocaleFields(form: FormData, field: "title" | "description"): Record<string, string> {
  const values: Record<string, string> = {};
  const prefix = `${field}[`;
  for (const [key, value] of form.entries()) {
    if (!key.startsWith(prefix) || !key.endsWith("]")) continue;
    const locale = key.slice(prefix.length, -1).trim().toLowerCase();
    if (/^[a-z]{2}$/.test(locale)) values[locale] = String(value ?? "");
  }
  return values;
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
  if (row.created_by === actorId) return true;
  return hasSharedRecord(db, actorId, moduleSlug, recordId);
}

export function visibleOwnerClause(ownerColumn = "created_by", idColumn = "id"): string {
  return `(${ownerColumn} = ? OR ${idColumn} IN (SELECT record_id FROM record_shares WHERE module_slug = ? AND shared_with_id = ?))`;
}
