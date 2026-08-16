export const PRIMARY_BIO_LOCALE = "es";

export interface BioTranslationAccess {
  canWrite: boolean;
  canUseAi: boolean;
}

export function plainBioText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function isBlankBio(value: string | null | undefined): boolean {
  return plainBioText(value).length === 0;
}

export function plannedBioWrites(
  submitted: Record<string, string>,
  existing: Record<string, string>,
  access: BioTranslationAccess,
  primaryLocale = PRIMARY_BIO_LOCALE,
): Record<string, string> {
  const planned: Record<string, string> = {};
  const locales = new Set([...Object.keys(existing), ...Object.keys(submitted)]);

  for (const locale of locales) {
    const submittedBody = String(submitted[locale] ?? "").trim();
    const existingBody = String(existing[locale] ?? "").trim();

    if (locale === primaryLocale) {
      if (!isBlankBio(submittedBody)) planned[locale] = submittedBody;
      continue;
    }

    if (access.canWrite) {
      if (!isBlankBio(submittedBody)) planned[locale] = submittedBody;
      continue;
    }

    if (access.canUseAi && !isBlankBio(submittedBody)) {
      planned[locale] = submittedBody;
      continue;
    }

    if (!isBlankBio(existingBody)) planned[locale] = existingBody;
  }

  return planned;
}
