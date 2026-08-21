export const OG_METADATA_MODEL = "@cf/deepseek-ai/deepseek-v4-flash-0731";

export const OG_FIELD_KEYS = [
  "url",
  "type",
  "title",
  "description",
  "image",
  "imageAlt",
  "twitterCard",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
] as const;

export type OgFieldKey = (typeof OG_FIELD_KEYS)[number];

export type OpenGraphMetadata = Record<OgFieldKey, string>;

export const OG_FORM_NAMES: Record<OgFieldKey, string> = {
  url: "og_url",
  type: "og_type",
  title: "og_title",
  description: "og_description",
  image: "og_image",
  imageAlt: "og_image_alt",
  twitterCard: "og_twitter_card",
  twitterTitle: "og_twitter_title",
  twitterDescription: "og_twitter_description",
  twitterImage: "og_twitter_image",
};

export function emptyOgMetadata(): OpenGraphMetadata {
  return {
    url: "",
    type: "",
    title: "",
    description: "",
    image: "",
    imageAlt: "",
    twitterCard: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
  };
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function parseOgMetadata(raw: unknown): OpenGraphMetadata {
  const base = emptyOgMetadata();
  if (raw == null) return base;
  let record: Record<string, unknown> = {};
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return base;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return base;
      record = parsed as Record<string, unknown>;
    } catch {
      return base;
    }
  } else if (typeof raw === "object" && !Array.isArray(raw)) {
    record = raw as Record<string, unknown>;
  } else {
    return base;
  }
  for (const key of OG_FIELD_KEYS) {
    base[key] = asText(record[key]);
  }
  return base;
}

export function serializeOgMetadata(meta: OpenGraphMetadata): string {
  return JSON.stringify(parseOgMetadata(meta));
}

export function seedOgMetadata(input: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}): OpenGraphMetadata {
  const title = asText(input.title);
  const description = stripHtml(asText(input.description)).slice(0, 240);
  const image = asText(input.image);
  const url = asText(input.url);
  const type = asText(input.type) || (title ? "article" : "website");
  return {
    url,
    type,
    title,
    description,
    image,
    imageAlt: title,
    twitterCard: image ? "summary_large_image" : "summary",
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  };
}

export function parseOgFromForm(form: FormData, locale: string): OpenGraphMetadata {
  const meta = emptyOgMetadata();
  for (const key of OG_FIELD_KEYS) {
    meta[key] = asText(form.get(`${OG_FORM_NAMES[key]}[${locale}]`));
  }
  return meta;
}

export function parseOgAiJson(raw: string): OpenGraphMetadata | null {
  const trimmed = String(raw ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const meta = parseOgMetadata(parsed);
    return OG_FIELD_KEYS.some((key) => meta[key]) ? meta : null;
  } catch {
    return null;
  }
}

export type OgGenerateKind = "article" | "category";
export type OgSourceField = "title" | "description" | "content" | "tags" | "categories";

export function missingOgGenerateSources(
  kind: OgGenerateKind,
  input: {
    title?: string;
    description?: string;
    content?: string;
    tags?: string;
    categories?: string[] | string;
  },
): OgSourceField[] {
  const missing: OgSourceField[] = [];
  if (!asText(input.title)) missing.push("title");
  if (!stripHtml(asText(input.description))) missing.push("description");
  if (kind === "category") return missing;
  if (!stripHtml(asText(input.content))) missing.push("content");
  if (!asText(input.tags)) missing.push("tags");
  const categories = Array.isArray(input.categories)
    ? input.categories.map((value) => asText(value)).filter(Boolean)
    : asText(input.categories)
      ? [asText(input.categories)]
      : [];
  if (!categories.length) missing.push("categories");
  return missing;
}

export function withOgSourceFallback(
  current: {
    title?: string;
    description?: string;
    content?: string;
    tags?: string;
    categories?: string[] | string;
  },
  fallback: {
    title?: string;
    description?: string;
    content?: string;
    tags?: string;
    categories?: string[] | string;
  },
) {
  return {
    title: asText(current.title) || asText(fallback.title),
    description: asText(current.description) || asText(fallback.description),
    content: asText(current.content) || asText(fallback.content),
    tags: asText(current.tags) || asText(fallback.tags),
    categories: current.categories ?? fallback.categories,
  };
}

export function mergeOgMetadata(base: OpenGraphMetadata, patch: Partial<OpenGraphMetadata>): OpenGraphMetadata {
  const next = { ...base };
  for (const key of OG_FIELD_KEYS) {
    const value = asText(patch[key]);
    if (value) next[key] = value;
  }
  return next;
}

export function buildOgGenerateMessages(input: {
  title: string;
  description: string;
  content: string;
  tags?: string;
  categories?: string;
  url?: string;
  image?: string;
  locale: string;
  kind: OgGenerateKind;
}): Array<{ role: string; content: string }> {
  const title = asText(input.title);
  const description = stripHtml(asText(input.description));
  const content = stripHtml(asText(input.content)).slice(0, 4000);
  return [
    {
      role: "system",
      content:
        "You write Open Graph and Twitter Card metadata for AfroUp, an Afro-descendant editorial site. Return ONLY a JSON object with keys: url, type, title, description, image, imageAlt, twitterCard, twitterTitle, twitterDescription, twitterImage. No markdown. Keep AfroUp untranslated. Write title, description, imageAlt, twitterTitle, and twitterDescription in the requested locale. Titles <= 60 chars. Descriptions <= 160 chars. twitterCard must be summary or summary_large_image.",
    },
    {
      role: "user",
      content: [
        `Kind: ${input.kind}`,
        `Locale: ${input.locale}`,
        `Canonical URL: ${asText(input.url) || "(derive a plausible path if missing)"}`,
        `Image URL: ${asText(input.image) || "(leave empty if unknown)"}`,
        `Title: ${title || "(none)"}`,
        `Description: ${description || "(none)"}`,
        `Tags: ${asText(input.tags) || "(none)"}`,
        `Categories: ${asText(input.categories) || "(none)"}`,
        `Content: ${content || "(none)"}`,
        "Fill every key. Prefer the provided title and description. type is article for articles and website for categories.",
      ].join("\n"),
    },
  ];
}

export function extractAiText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const choices = record.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const message = (choices[0] as { message?: { content?: unknown } }).message;
    if (typeof message?.content === "string") return message.content;
  }
  if (typeof record.response === "string") return record.response;
  return null;
}
