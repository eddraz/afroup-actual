import type { D1Database } from "@cloudflare/workers-types";

export type PermissionAction = "create" | "read" | "update" | "delete";

export interface PermissionRow {
  id: number;
  module_id: number;
  action: PermissionAction;
  name: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role_id: number | null;
  is_active: number;
}

export interface EffectivePermissions {
  viaRole: PermissionRow[];
  direct: PermissionRow[];
}

export async function loadAdminUser(db: D1Database, id: number): Promise<AdminUser | null> {
  return db
    .prepare(
      "SELECT id, name, email, role_id, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
    )
    .bind(id)
    .first<AdminUser>();
}

export async function loadPermissions(db: D1Database): Promise<PermissionRow[]> {
  const result = await db
    .prepare(
      "SELECT id, module_id, action, name FROM admin_permissions ORDER BY module_id, action",
    )
    .all<PermissionRow>();
  return result.results ?? [];
}

export async function effectivePermissions(
  db: D1Database,
  userId: number,
): Promise<EffectivePermissions> {
  const user = await loadAdminUser(db, userId);
  if (!user) return { viaRole: [], direct: [] };

  const [direct, viaRole] = await Promise.all([
    db
      .prepare(
        `SELECT p.id, p.module_id, p.action, p.name
           FROM admin_user_permissions up
           JOIN admin_permissions p ON p.id = up.permission_id
          WHERE up.user_id = ?
          ORDER BY p.module_id, p.action`,
      )
      .bind(userId)
      .all<PermissionRow>(),
    user.role_id
      ? db
          .prepare(
            `SELECT p.id, p.module_id, p.action, p.name
               FROM admin_role_permissions rp
               JOIN admin_permissions p ON p.id = rp.permission_id
              WHERE rp.role_id = ?
              ORDER BY p.module_id, p.action`,
          )
          .bind(user.role_id)
          .all<PermissionRow>()
      : Promise.resolve({ results: [] as PermissionRow[] }),
  ]);

  return { viaRole: viaRole.results ?? [], direct: direct.results ?? [] };
}

export function mergePermissions(parts: EffectivePermissions): PermissionRow[] {
  const map = new Map<number, PermissionRow>();
  for (const row of parts.viaRole) map.set(row.id, row);
  for (const row of parts.direct) map.set(row.id, row);
  return Array.from(map.values()).sort((a, b) =>
    a.module_id === b.module_id ? a.action.localeCompare(b.action) : a.module_id - b.module_id,
  );
}

export async function hasPermission(
  db: D1Database,
  userId: number,
  moduleSlug: string,
  action: PermissionAction,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1
         FROM admin_permissions p
         JOIN admin_modules m ON m.id = p.module_id
         LEFT JOIN admin_user_permissions up ON up.permission_id = p.id AND up.user_id = ?
         LEFT JOIN admin_role_permissions rp ON rp.permission_id = p.id
         LEFT JOIN users u ON u.id = ? AND u.role_id = rp.role_id
        WHERE m.slug = ? AND p.action = ?
          AND (up.user_id IS NOT NULL OR u.id IS NOT NULL)
        LIMIT 1`,
    )
    .bind(userId, userId, moduleSlug, action)
    .first();
  return row !== null;
}