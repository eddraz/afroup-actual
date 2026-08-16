import type { D1Database } from "@cloudflare/workers-types";
import type { PermissionAction } from "./rbac";

export type TranslateMode = "none" | "manual" | "ai";

export interface PermissionGrant {
  permissionId: number;
  parent: boolean;
  quota: number | null;
  translate: TranslateMode;
}

export interface EffectiveGrant {
  allowed: boolean;
  parent: boolean;
  quota: number | null;
  translate: TranslateMode;
}

function isTranslateMode(value: string): value is TranslateMode {
  return value === "none" || value === "manual" || value === "ai";
}

function emptyGrant(permissionId: number): PermissionGrant {
  return { permissionId, parent: false, quota: null, translate: "none" };
}

export function parsePermissionGrants(form: FormData): PermissionGrant[] {
  const parentIds = new Set(
    form
      .getAll("parentIds")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0),
  );
  const grants = new Map<number, PermissionGrant>();

  for (const permissionId of parentIds) {
    grants.set(permissionId, { ...emptyGrant(permissionId), parent: true });
  }

  for (const [key, value] of form.entries()) {
    const quotaMatch = /^quota-(\d+)$/.exec(key);
    if (quotaMatch) {
      const permissionId = Number(quotaMatch[1]);
      const raw = String(value).trim();
      if (raw === "") continue;
      const quota = Number(raw);
      if (!Number.isFinite(quota) || quota < 0) continue;
      const current = grants.get(permissionId) ?? emptyGrant(permissionId);
      current.quota = Math.floor(quota);
      grants.set(permissionId, current);
      continue;
    }

    const translateMatch = /^translate-(\d+)$/.exec(key);
    if (!translateMatch) continue;
    const permissionId = Number(translateMatch[1]);
    const mode = String(value);
    if (!isTranslateMode(mode) || mode === "none") continue;
    const current = grants.get(permissionId) ?? emptyGrant(permissionId);
    current.translate = mode;
    grants.set(permissionId, current);
  }

  return Array.from(grants.values());
}

export async function setPermissionGrants(
  db: D1Database,
  table: "admin_user_permissions" | "admin_role_permissions",
  fk: "user_id" | "role_id",
  ownerId: number,
  grants: PermissionGrant[],
): Promise<void> {
  await db.prepare(`DELETE FROM ${table} WHERE ${fk} = ?`).bind(ownerId).run();
  if (grants.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO ${table} (${fk}, permission_id, parent, quota, translate) VALUES (?, ?, ?, ?, ?)`,
  );
  await db.batch(
    grants.map((grant) =>
      stmt.bind(ownerId, grant.permissionId, grant.parent ? 1 : 0, grant.quota, grant.translate),
    ),
  );
}

export async function loadUserGrants(db: D1Database, userId: number): Promise<Map<number, PermissionGrant>> {
  const result = await db
    .prepare(
      "SELECT permission_id, parent, quota, translate FROM admin_user_permissions WHERE user_id = ?",
    )
    .bind(userId)
    .all<{ permission_id: number; parent: number; quota: number | null; translate: TranslateMode }>();
  return toGrantMap(result.results ?? []);
}

export async function loadRoleGrants(db: D1Database, roleId: number): Promise<Map<number, PermissionGrant>> {
  const result = await db
    .prepare(
      "SELECT permission_id, parent, quota, translate FROM admin_role_permissions WHERE role_id = ?",
    )
    .bind(roleId)
    .all<{ permission_id: number; parent: number; quota: number | null; translate: TranslateMode }>();
  return toGrantMap(result.results ?? []);
}

export async function loadAllUserGrants(db: D1Database): Promise<Map<number, Map<number, PermissionGrant>>> {
  const result = await db
    .prepare("SELECT user_id, permission_id, parent, quota, translate FROM admin_user_permissions")
    .all<{ user_id: number; permission_id: number; parent: number; quota: number | null; translate: TranslateMode }>();
  const map = new Map<number, Map<number, PermissionGrant>>();
  for (const row of result.results ?? []) {
    if (!map.has(row.user_id)) map.set(row.user_id, new Map());
    map.get(row.user_id)!.set(row.permission_id, fromRow(row));
  }
  return map;
}

export async function loadAllRoleGrants(db: D1Database): Promise<Map<number, Map<number, PermissionGrant>>> {
  const result = await db
    .prepare("SELECT role_id, permission_id, parent, quota, translate FROM admin_role_permissions")
    .all<{ role_id: number; permission_id: number; parent: number; quota: number | null; translate: TranslateMode }>();
  const map = new Map<number, Map<number, PermissionGrant>>();
  for (const row of result.results ?? []) {
    if (!map.has(row.role_id)) map.set(row.role_id, new Map());
    map.get(row.role_id)!.set(row.permission_id, fromRow(row));
  }
  return map;
}

export async function effectiveGrant(
  db: D1Database,
  userId: number,
  moduleSlug: string,
  action: PermissionAction,
): Promise<EffectiveGrant> {
  const row = await db
    .prepare(
      `SELECT
          COALESCE(up.parent, rp.parent, 0) AS parent,
          CASE
            WHEN up.user_id IS NOT NULL THEN up.quota
            ELSE rp.quota
          END AS quota,
          CASE
            WHEN up.user_id IS NOT NULL THEN up.translate
            ELSE COALESCE(rp.translate, 'none')
          END AS translate,
          CASE
            WHEN up.user_id IS NOT NULL OR rp.role_id IS NOT NULL THEN 1
            ELSE 0
          END AS allowed
         FROM admin_permissions p
         JOIN admin_modules m ON m.id = p.module_id
         JOIN admin_users u ON u.id = ?
         LEFT JOIN admin_user_permissions up
           ON up.permission_id = p.id AND up.user_id = u.id
         LEFT JOIN admin_role_permissions rp
           ON rp.permission_id = p.id AND rp.role_id = u.role_id
        WHERE m.slug = ? AND p.action = ?
        LIMIT 1`,
    )
    .bind(userId, moduleSlug, action)
    .first<{ parent: number; quota: number | null; translate: string; allowed: number }>();

  if (!row || !row.allowed) {
    return { allowed: false, parent: false, quota: null, translate: "none" };
  }
  return {
    allowed: true,
    parent: row.parent === 1,
    quota: row.quota,
    translate: isTranslateMode(row.translate) ? row.translate : "none",
  };
}

function toGrantMap(
  rows: Array<{ permission_id: number; parent: number; quota: number | null; translate: TranslateMode }>,
): Map<number, PermissionGrant> {
  return new Map(rows.map((row) => [row.permission_id, fromRow(row)]));
}

function fromRow(row: {
  permission_id: number;
  parent: number;
  quota: number | null;
  translate: TranslateMode;
}): PermissionGrant {
  return {
    permissionId: row.permission_id,
    parent: row.parent === 1,
    quota: row.quota,
    translate: isTranslateMode(row.translate) ? row.translate : "none",
  };
}

export function grantsToJson(map: Map<number, Map<number, PermissionGrant>>): string {
  const object: Record<string, Record<string, { parent: boolean; quota: number | null; translate: TranslateMode }>> = {};
  for (const [ownerId, grants] of map) {
    object[ownerId] = {};
    for (const [permissionId, grant] of grants) {
      object[ownerId][permissionId] = {
        parent: grant.parent,
        quota: grant.quota,
        translate: grant.translate,
      };
    }
  }
  return JSON.stringify(object);
}
