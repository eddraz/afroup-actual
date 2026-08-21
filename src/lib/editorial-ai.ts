import {
  OG_FIELD_KEYS,
  OG_FORM_NAMES,
  emptyOgMetadata,
  mergeOgMetadata,
  parseOgMetadata,
  type OpenGraphMetadata,
} from "./og-metadata";
import { slugify } from "./slugs";

export const EDITORIAL_AI_MODEL = "@cf/deepseek-ai/deepseek-v4-flash-0731";

export type EditorialAiKind = "article" | "category";

export type EditorialAiExisting = {
  title?: string;
  description?: string;
  content?: string;
  tags?: string;
  slug?: string;
};

export type EditorialAiResult = {
  title: string;
  description: string;
  slug: string;
  tags?: string;
  content?: string;
  og: OpenGraphMetadata;
};

const EDITORIAL_AI_KEYS = new Set([
  "title",
  "description",
  "slug",
  "tags",
  "content",
  "og",
  ...Object.values(OG_FORM_NAMES),
]);

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function missingEditorialAiPrompt(prompt: string | null | undefined): boolean {
  return !asText(prompt);
}

export function parseEditorialAiJson(raw: string): Record<string, unknown> | null {
  const trimmed = String(raw ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  if (!trimmed) return null;
  try {
    const parsed = asRecord(JSON.parse(trimmed) as unknown);
    if (!parsed) return null;
    const picked: Record<string, unknown> = {};
    for (const key of EDITORIAL_AI_KEYS) {
      if (key in parsed) picked[key] = parsed[key];
    }
    return picked;
  } catch {
    return null;
  }
}

function normalizeTags(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).filter(Boolean).join(", ");
  }
  return asText(value);
}

function ogFromParsed(parsed: Record<string, unknown>): OpenGraphMetadata {
  const fromFlat: Partial<OpenGraphMetadata> = {};
  for (const key of OG_FIELD_KEYS) {
    const value = asText(parsed[OG_FORM_NAMES[key]]);
    if (value) fromFlat[key] = value;
  }
  const nested = parseOgMetadata(parsed.og);
  return mergeOgMetadata(mergeOgMetadata(emptyOgMetadata(), fromFlat), nested);
}

export function normalizeEditorialAiResult(
  kind: EditorialAiKind,
  parsed: Record<string, unknown> | null | undefined,
): EditorialAiResult {
  const record = asRecord(parsed) ?? {};
  const titleLimit = kind === "category" ? 160 : 180;
  const descriptionLimit = kind === "category" ? 400 : 500;
  const title = asText(record.title).slice(0, titleLimit);
  const description = asText(record.description).slice(0, descriptionLimit);
  const slug = slugify(asText(record.slug) || title);
  const og = ogFromParsed(record);
  if (kind === "category") {
    return { title, description, slug, og };
  }
  return {
    title,
    description,
    slug,
    tags: normalizeTags(record.tags),
    content: asText(record.content),
    og,
  };
}

export function buildEditorialAiMessages(input: {
  kind: EditorialAiKind;
  locale: string;
  prompt: string;
  existing?: EditorialAiExisting;
}): Array<{ role: string; content: string }> {
  const kind = input.kind === "category" ? "category" : "article";
  const locale = asText(input.locale) || "es";
  const prompt = asText(input.prompt);
  const existing = input.existing ?? {};
  const existingTitle = asText(existing.title);
  const existingDescription = asText(existing.description);
  const existingContent = asText(existing.content);
  const existingTags = asText(existing.tags);
  const existingSlug = asText(existing.slug);
  const keys =
    kind === "article"
      ? "title, description, slug, tags, content, plus Open Graph fields"
      : "title, description, slug, plus Open Graph fields. Do not include content or tags";
  return [
    {
      role: "system",
      content: [
        "You write editorial content for AfroUp, an Afro-descendant editorial site.",
        "Keep AfroUp untranslated.",
        "Write all generated text in the requested locale.",
        "When the locale is es, use neutral professional Spanish, never Rioplatense voseo.",
        "Return ONLY a JSON object. No markdown.",
        `JSON keys: ${keys}.`,
        "Open Graph fields may be nested under `og` with keys url, type, title, description, image, imageAlt, twitterCard, twitterTitle, twitterDescription, twitterImage, or flattened as og_url, og_type, og_title, og_description, og_image, og_image_alt, og_twitter_card, og_twitter_title, og_twitter_description, og_twitter_image.",
        "content HTML may use only h2, h3, p, blockquote, ul, ol, li, strong, and em. No scripts, images, or iframes.",
        "Article body must be a real editorial piece with several paragraphs and at least one heading, not a tweet.",
        "Category description <= 400 chars. Article description/dek <= 500 chars.",
        "Category titles <= 160 chars. Article titles <= 180 chars.",
        "slug must be lowercase hyphenated.",
        "If existing title, description, or content are provided, treat the user prompt as a rewrite brief. Otherwise generate from scratch.",
        "Do not generate cover images.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Kind: ${kind}`,
        `Locale: ${locale}`,
        `Prompt: ${prompt || "(none)"}`,
        `Existing title: ${existingTitle || "(none)"}`,
        `Existing description: ${existingDescription || "(none)"}`,
        `Existing content: ${existingContent || "(none)"}`,
        `Existing tags: ${existingTags || "(none)"}`,
        `Existing slug: ${existingSlug || "(none)"}`,
      ].join("\n"),
    },
  ];
}
