import type { D1Database } from "@cloudflare/workers-types";
import { isBlankBio, plannedBioWrites } from "./bio-writes";
import { defaultLocale } from "./i18n";
import { effectiveGrant } from "./permission-grants";

export const BIO_MAX = 280;

export interface TranslationAccess {
  canWrite: boolean;
  canUseAi: boolean;
}

export async function loadUserBios(db: D1Database, userId: number): Promise<Record<string, string>> {
  const result = await db
    .prepare("SELECT locale, body FROM afroup_user_bios WHERE user_id = ?")
    .bind(userId)
    .all<{ locale: string; body: string }>();
  const bios: Record<string, string> = {};
  for (const row of result.results ?? []) bios[row.locale] = row.body;
  return bios;
}

export async function saveUserBios(
  db: D1Database,
  userId: number,
  bios: Record<string, string>,
  access: TranslationAccess,
): Promise<void> {
  const submitted = Object.fromEntries(
    Object.entries(bios).map(([locale, body]) => [locale.trim().toLowerCase(), body.trim()]),
  );
  const existing = await loadUserBios(db, userId);
  const planned = plannedBioWrites(submitted, existing, access, defaultLocale);
  const spanish = planned[defaultLocale] ?? "";

  await db
    .prepare("UPDATE users SET bio = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(spanish || null, userId)
    .run();

  await db.prepare("DELETE FROM afroup_user_bios WHERE user_id = ?").bind(userId).run();
  const toInsert = Object.entries(planned).filter(([, body]) => !isBlankBio(body));
  if (toInsert.length === 0) return;
  const stmt = db.prepare(
    "INSERT INTO afroup_user_bios (user_id, locale, body, updated_at) VALUES (?, ?, ?, datetime('now'))",
  );
  await db.batch(toInsert.map(([locale, body]) => stmt.bind(userId, locale, body)));
}

export async function translationAccessForEmail(
  db: D1Database,
  email: string,
): Promise<TranslationAccess> {
  const user = await db
    .prepare(
      `SELECT id FROM users
        WHERE email = ? AND is_active = 1 AND invite_pending = 0
        LIMIT 1`,
    )
    .bind(email.trim().toLowerCase())
    .first<{ id: number }>();
  if (!user) return { canWrite: false, canUseAi: false };
  const grant = await effectiveGrant(db, user.id, "users", "update");
  return {
    canUseAi: grant.translateAi,
    canWrite: grant.translateManual,
  };
}

export function parseBioFields(form: FormData): Record<string, string> {
  const bios: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    const match = /^bio\[([a-z]{2})\]$/.exec(key);
    if (!match) continue;
    bios[match[1]] = String(value ?? "");
  }
  if (!Object.keys(bios).length && form.has("bio")) {
    bios[defaultLocale] = String(form.get("bio") ?? "");
  }
  return bios;
}
