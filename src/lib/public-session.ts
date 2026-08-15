import type { D1Database } from "@cloudflare/workers-types";

export const PUBLIC_SESSION_COOKIE = "afroup_session";
export const PUBLIC_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  verified_at: string | null;
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export async function createPublicSession(db: D1Database, userId: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + PUBLIC_SESSION_TTL_MS).toISOString();
  await db
    .prepare("INSERT INTO afroup_sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, userId, expiresAt)
    .run();
  return { token, expiresAt };
}

export async function getPublicUser(db: D1Database, token: string | undefined): Promise<PublicUser | null> {
  if (!token) return null;
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, u.bio, u.avatar_url, u.verified_at
         FROM afroup_sessions s
         JOIN afroup_users u ON u.id = s.user_id
        WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
        LIMIT 1`,
    )
    .bind(token)
    .first<PublicUser>();
}

export async function destroyPublicSession(db: D1Database, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.prepare("DELETE FROM afroup_sessions WHERE token = ?").bind(token).run();
}

export function sessionCookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}