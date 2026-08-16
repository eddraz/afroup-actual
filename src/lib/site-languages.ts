import type { D1Database } from "@cloudflare/workers-types";
import { defaultLocale, isLocale, localizedPath, type Locale } from "./i18n";

export interface SiteLanguage {
  code: string;
  name: string;
  native_name: string;
  is_visible: number;
  is_pillar: number;
  sort_order: number;
}

export const PILLAR_CODES = ["es", "en"] as const;

export async function listSiteLanguages(db: D1Database): Promise<SiteLanguage[]> {
  const result = await db
    .prepare(
      `SELECT code, name, native_name, is_visible, is_pillar, sort_order
         FROM site_languages
        ORDER BY sort_order, code`,
    )
    .all<SiteLanguage>();
  return result.results ?? [];
}

export async function listVisibleLanguages(db: D1Database): Promise<SiteLanguage[]> {
  const visible = (await listSiteLanguages(db)).filter((language) => language.is_visible === 1);
  if (visible.length > 0) return visible;
  return [
    {
      code: defaultLocale,
      name: "Spanish",
      native_name: "Español",
      is_visible: 1,
      is_pillar: 1,
      sort_order: 1,
    },
  ];
}

export function isSiteLanguageCode(value: string | undefined, languages: SiteLanguage[]): boolean {
  return Boolean(value && languages.some((language) => language.code === value));
}

export function publicLocaleFromPath(pathname: string, visible: SiteLanguage[]): string {
  const first = pathname.split("/").filter(Boolean)[0];
  if (first && visible.some((language) => language.code === first)) return first;
  if (visible.some((language) => language.code === defaultLocale)) return defaultLocale;
  return visible[0]?.code ?? defaultLocale;
}

export function switchPublicLocalePath(currentUrl: URL, nextCode: string): string {
  const segments = currentUrl.pathname.split("/").filter(Boolean);
  if (segments[0] && (isLocale(segments[0]) || segments[0].length === 2)) {
    segments.shift();
  }
  const rest = segments.join("/");
  if (nextCode === defaultLocale) {
    return `${rest ? `/${rest}` : "/"}${currentUrl.search}`;
  }
  if (isLocale(nextCode)) {
    return `${localizedPath(nextCode as Locale, rest ? `/${rest}` : "/")}${currentUrl.search}`;
  }
  return `/${nextCode}${rest ? `/${rest}` : ""}${currentUrl.search}`;
}

export function hiddenLocaleRedirect(pathname: string, visible: SiteLanguage[]): string | null {
  const first = pathname.split("/").filter(Boolean)[0];
  const visibleCodes = new Set(visible.map((language) => language.code));
  if (first && first.length === 2 && !visibleCodes.has(first)) {
    const fallback = visibleCodes.has(defaultLocale) ? defaultLocale : visible[0]?.code ?? defaultLocale;
    return switchPublicLocalePath(new URL(pathname, "https://afroup.local"), fallback);
  }
  return null;
}

export async function setLanguageVisibility(
  db: D1Database,
  code: string,
  visible: boolean,
): Promise<{ ok: true } | { ok: false; error: "not_found" | "need_pillar" }> {
  const languages = await listSiteLanguages(db);
  const current = languages.find((language) => language.code === code);
  if (!current) return { ok: false, error: "not_found" };

  if (visible) {
    await db.prepare("UPDATE site_languages SET is_visible = 1 WHERE code = ?").bind(code).run();
    return { ok: true };
  }

  const remaining = languages.filter((language) => language.code !== code && language.is_visible === 1);
  if (remaining.length > 0) {
    await db.prepare("UPDATE site_languages SET is_visible = 0 WHERE code = ?").bind(code).run();
    return { ok: true };
  }

  const fallback = code === "es" ? "en" : "es";
  const otherPillar = languages.find((language) => language.code === fallback);
  if (!otherPillar) return { ok: false, error: "need_pillar" };

  await db.batch([
    db.prepare("UPDATE site_languages SET is_visible = 0 WHERE code = ?").bind(code),
    db.prepare("UPDATE site_languages SET is_visible = 1 WHERE code = ?").bind(fallback),
  ]);
  return { ok: true };
}

export async function addSiteLanguage(
  db: D1Database,
  input: { code: string; name: string; nativeName: string; dictionary?: string },
): Promise<{ ok: true } | { ok: false; error: "code_invalid" | "code_taken" }> {
  const code = input.code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return { ok: false, error: "code_invalid" };
  const existing = await db.prepare("SELECT code FROM site_languages WHERE code = ? LIMIT 1").bind(code).first();
  if (existing) return { ok: false, error: "code_taken" };

  const maxOrder = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM site_languages")
    .first<{ max_order: number }>();
  await db
    .prepare(
      `INSERT INTO site_languages (code, name, native_name, is_visible, is_pillar, sort_order)
       VALUES (?, ?, ?, 0, 0, ?)`,
    )
    .bind(code, input.name.trim(), input.nativeName.trim(), (maxOrder?.max_order ?? 0) + 1)
    .run();

  if (input.dictionary) {
    await db
      .prepare(
        `INSERT INTO site_language_dictionaries (code, dictionary, updated_at)
         VALUES (?, ?, datetime('now'))`,
      )
      .bind(code, input.dictionary)
      .run();
  }
  return { ok: true };
}

export async function loadLanguageDictionary(db: D1Database, code: string): Promise<Record<string, string> | null> {
  const row = await db
    .prepare("SELECT dictionary FROM site_language_dictionaries WHERE code = ? LIMIT 1")
    .bind(code)
    .first<{ dictionary: string }>();
  if (!row?.dictionary) return null;
  try {
    const parsed = JSON.parse(row.dictionary) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Record<string, string>;
  } catch {
    return null;
  }
}
