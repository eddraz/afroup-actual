import type { D1Database } from "@cloudflare/workers-types";
import { defaultLocale, localeFromPath, mergeDictionary, type Dictionary } from "./i18n";
import { listSiteLanguages, loadLanguageDictionary } from "./site-languages";

export async function resolveRequestCopy(
  db: D1Database,
  url: URL,
): Promise<{ locale: string; copy: Dictionary }> {
  const requested = localeFromPath(url.pathname);
  const languages = await listSiteLanguages(db);
  const known = languages.some((language) => language.code === requested);
  const locale = known ? requested : defaultLocale;
  const extra = locale === defaultLocale || locale === "en" ? null : await loadLanguageDictionary(db, locale);
  return { locale, copy: mergeDictionary(locale, extra) };
}
