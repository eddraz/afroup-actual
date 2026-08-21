import { extractAiText } from "./og-metadata";

export const IMAGE_PROMPT_MODEL = "@cf/deepseek-ai/deepseek-v4-flash-0731";
export const IMAGE_GENERATE_MODEL = "xai/grok-imagine-image-2.0";
export const VIDEO_GENERATE_MODEL = "bytedance/seedance-2.5";
export const MUSIC_GENERATE_MODEL = "minimax/music-2.6";
export const TEXT_GENERATE_MODEL = IMAGE_PROMPT_MODEL;

export const ALLOWED_IMAGE_PROMPT_MODELS = [IMAGE_PROMPT_MODEL] as const;
export const ALLOWED_IMAGE_GENERATE_MODELS = [
  IMAGE_GENERATE_MODEL,
  "xai/grok-imagine-image",
] as const;
export const ALLOWED_VIDEO_MODELS = [VIDEO_GENERATE_MODEL] as const;
export const ALLOWED_MUSIC_MODELS = [MUSIC_GENERATE_MODEL] as const;

export type AiFileKind = "image" | "video" | "music" | "text";
export type AiTextFormat = "txt" | "csv" | "pdf" | "code";

export function parseAiFileKind(value: string | null | undefined): AiFileKind {
  const kind = asText(value);
  if (kind === "video" || kind === "music" || kind === "text") return kind;
  return "image";
}

export function parseAiTextFormat(value: string | null | undefined): AiTextFormat {
  const format = asText(value);
  if (format === "csv" || format === "pdf" || format === "code") return format;
  return "txt";
}

export type CoverImageSource = "custom" | "form";
export type CoverFormField = "title" | "description" | "tags" | "categories" | "content";

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function pickAllowedModel(value: string | null | undefined, allowed: readonly string[], fallback: string): string {
  const model = asText(value);
  return allowed.includes(model) ? model : fallback;
}

export function buildCoverImageContext(input: {
  source: CoverImageSource;
  customText?: string;
  selected?: CoverFormField[];
  fields?: Partial<Record<CoverFormField, string>>;
}): { ok: true; context: string } | { ok: false; error: "custom_required" | "fields_required" } {
  const custom = asText(input.customText);
  const selected = input.selected?.length ? input.selected : [];
  const parts: string[] = [];
  if (custom) parts.push(custom);
  for (const field of selected) {
    const value = stripHtml(asText(input.fields?.[field]));
    if (!value) continue;
    parts.push(`${field}: ${value}`);
  }
  if (parts.length) return { ok: true, context: parts.join("\n") };
  if (input.source === "form" || selected.length) return { ok: false, error: "fields_required" };
  return { ok: false, error: "custom_required" };
}

export function buildImprovePromptMessages(
  kind: AiFileKind,
  context: string,
  format: AiTextFormat = "txt",
): Array<{ role: string; content: string }> {
  const systems: Record<AiFileKind, string> = {
    image:
      "You write a single English image-generation prompt for AfroUp. Output ONLY the prompt. Cinematic, respectful Afro-descendant scene. No letters, logos, or UI. Under 80 words.",
    video:
      "You write a single English video-generation prompt for AfroUp. Output ONLY the prompt. Short cinematic shot, respectful Afro-descendant scene, no on-screen text. Under 80 words.",
    music:
      "You write a single English music-generation prompt for AfroUp. Output ONLY the prompt. Describe genre, mood, instruments, and tempo. Under 60 words.",
    text:
      format === "csv"
        ? "You write CSV data for AfroUp. Output ONLY the CSV, with a header row. No markdown."
        : format === "code"
          ? "You write a single source file for AfroUp. Output ONLY the code, no markdown fences."
          : "You write a plain-text document for AfroUp. Output ONLY the document body, no markdown fences.",
  };
  return [
    { role: "system", content: systems[kind] },
    { role: "user", content: `Source notes (may be Spanish):\n${asText(context)}` },
  ];
}

export function buildImproveImagePromptMessages(context: string): Array<{ role: string; content: string }> {
  return buildImprovePromptMessages("image", context);
}

export function parseImprovedPrompt(payload: unknown): string | null {
  const text = extractAiText(payload)?.replace(/^["'`]+|["'`]+$/g, "").trim() || "";
  return text || null;
}

export function extractGeneratedMediaRef(
  payload: unknown,
  kind: AiFileKind = "image",
): { url?: string; base64?: string; text?: string } | null {
  if (!payload) return null;
  if (typeof payload === "string") {
    const value = payload.trim();
    if (value.startsWith("http")) return { url: value };
    if (kind === "text") return { text: value };
    if (value.startsWith("data:")) return { base64: value };
    return null;
  }
  if (typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const result = record.result && typeof record.result === "object" ? (record.result as Record<string, unknown>) : {};
  const key = kind === "video" ? "video" : kind === "music" ? "audio" : "image";
  const media = record[key] ?? result[key] ?? record.image ?? result.image;
  if (typeof media === "string" && media.startsWith("http")) return { url: media };
  if (typeof media === "string" && media.startsWith("data:")) return { base64: media };
  if (kind === "text") {
    const text = extractAiText(payload);
    return text ? { text } : null;
  }
  if (typeof media === "string" && media.length > 80) return { base64: `data:application/octet-stream;base64,${media}` };
  return null;
}

export function extractGeneratedImageRef(payload: unknown): { url?: string; base64?: string } | null {
  const ref = extractGeneratedMediaRef(payload, "image");
  if (!ref) return null;
  return { url: ref.url, base64: ref.base64 };
}

export function encodeTextFile(
  body: string,
  format: AiTextFormat,
): { bytes: Uint8Array; contentType: string; ext: string } {
  const text = body.trim();
  if (format === "csv") {
    return { bytes: new TextEncoder().encode(text), contentType: "text/csv; charset=utf-8", ext: "csv" };
  }
  if (format === "code") {
    return { bytes: new TextEncoder().encode(text), contentType: "text/plain; charset=utf-8", ext: "txt" };
  }
  if (format === "pdf") {
    return { bytes: textToPdf(text), contentType: "application/pdf", ext: "pdf" };
  }
  return { bytes: new TextEncoder().encode(text), contentType: "text/plain; charset=utf-8", ext: "txt" };
}

function textToPdf(text: string): Uint8Array {
  const lines = text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .split("\n")
    .slice(0, 48)
    .map((line) => line.slice(0, 90));
  const ops = lines
    .map((line, index) => `BT /F1 11 Tf 48 ${760 - index * 14} Td (${line}) Tj ET`)
    .join("\n");
  const stream = ops + "\n";
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}endstream endobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];
  let offset = "%PDF-1.4\n".length;
  const offsets = [0];
  for (const object of objects) {
    offsets.push(offset);
    offset += object.length + 1;
  }
  const xrefPos = offset;
  const xref =
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((value) => `${String(value).padStart(10, "0")} 00000 n \n`)
      .join("");
  const pdf = `%PDF-1.4\n${objects.join("\n")}\n${xref}trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
