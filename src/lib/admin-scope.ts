import type { D1Database } from "@cloudflare/workers-types";
import { getPublicUser, PUBLIC_SESSION_COOKIE } from "./public-session";
import { effectiveGrant } from "./permission-grants";
import type { PermissionAction } from "./rbac";

export interface AdminActor {
  id: number;
  name: string;
  email: string;
  created_by: number | null;
}

export interface VisibleAdminUser {
  id: number;
  name: string;
  email: string;
  role_id: number | null;
  role_name: string | null;
  is_active: number;
  invite_pending: number;
  created_by: number | null;
}

export async function getCurrentAdmin(
  db: D1Database,
  token: string | undefined,
): Promise<AdminActor | null> {
  const publicUser = await getPublicUser(db, token);
  if (!publicUser) return null;
  return db
    .prepare(
      `SELECT id, name, email, created_by
         FROM admin_users
        WHERE email = ? AND is_active = 1 AND invite_pending = 0
        LIMIT 1`,
    )
    .bind(publicUser.email)
    .first<AdminActor>();
}

export function sessionTokenFrom(cookies: { get(name: string): { value: string } | undefined }) {
  return cookies.get(PUBLIC_SESSION_COOKIE)?.value;
}

export function unauthorizedJson() {
  return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function forbiddenJson() {
  return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
    status: 403,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function listVisibleAdminUsers(
  db: D1Database,
  actorId: number,
): Promise<VisibleAdminUser[]> {
  const grant = await effectiveGrant(db, actorId, "usuarios", "read");
  const result = await db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.invite_pending, u.created_by, r.name AS role_name
         FROM admin_users u
         LEFT JOIN admin_roles r ON r.id = u.role_id
        WHERE u.id = ?
           OR u.created_by = ?
           OR (? = 1 AND u.id = (SELECT created_by FROM admin_users WHERE id = ?))
        ORDER BY CASE WHEN u.id = ? THEN 0 ELSE 1 END, u.created_at, u.id`,
    )
    .bind(actorId, actorId, grant.parent ? 1 : 0, actorId, actorId)
    .all<VisibleAdminUser>();
  const rows = result.results ?? [];
  const self = rows.filter((row) => row.id === actorId);
  const parent = grant.parent ? rows.filter((row) => row.id !== actorId && row.created_by !== actorId) : [];
  let owned = rows.filter((row) => row.created_by === actorId);
  if (grant.quota !== null) owned = owned.slice(0, grant.quota);
  return [...self, ...owned, ...parent];
}

export async function hasParentGrant(
  db: D1Database,
  childId: number,
  _parentId: number,
  action: PermissionAction,
): Promise<boolean> {
  const grant = await effectiveGrant(db, childId, "usuarios", action);
  return grant.parent;
}

export async function countOwnedAdminUsers(db: D1Database, actorId: number): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS total FROM admin_users WHERE created_by = ?")
    .bind(actorId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function assertUserQuota(
  db: D1Database,
  actorId: number,
  action: PermissionAction,
): Promise<boolean> {
  const grant = await effectiveGrant(db, actorId, "usuarios", action);
  if (!grant.allowed && action !== "read") return action === "create" ? true : false;
  if (grant.quota === null) return true;
  if (action === "create") return (await countOwnedAdminUsers(db, actorId)) < grant.quota;
  return true;
}

export async function canManageAdminUser(
  db: D1Database,
  actorId: number,
  targetId: number,
  action: PermissionAction,
): Promise<boolean> {
  if (actorId === targetId) return action !== "delete";
  const target = await db
    .prepare("SELECT id, created_by FROM admin_users WHERE id = ? LIMIT 1")
    .bind(targetId)
    .first<{ id: number; created_by: number | null }>();
  if (!target) return false;
  if (target.created_by === actorId) return true;
  return hasParentGrant(db, actorId, targetId, action);
}

export async function setParentGrants(
  db: D1Database,
  parentId: number,
  childId: number,
  actions: PermissionAction[],
): Promise<void> {
  const child = await db
    .prepare("SELECT id, created_by FROM admin_users WHERE id = ? LIMIT 1")
    .bind(childId)
    .first<{ id: number; created_by: number | null }>();
  if (!child || child.created_by !== parentId) {
    throw new Error("not_child");
  }

  const unique = Array.from(new Set(actions));
  await db
    .prepare("DELETE FROM admin_parent_grants WHERE child_id = ? AND parent_id = ?")
    .bind(childId, parentId)
    .run();
  if (unique.length === 0) return;
  const stmt = db.prepare(
    "INSERT INTO admin_parent_grants (child_id, parent_id, action) VALUES (?, ?, ?)",
  );
  await db.batch(unique.map((action) => stmt.bind(childId, parentId, action)));
}
