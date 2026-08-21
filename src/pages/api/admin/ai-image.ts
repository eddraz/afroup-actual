import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom } from "../../../lib/admin-scope";
import { translationAccess } from "../../../lib/editorial";
import { hasPermission } from "../../../lib/rbac";
import { resolveR2Bucket } from "../../../lib/r2-storage";
import {
  ALLOWED_IMAGE_GENERATE_MODELS,
  ALLOWED_IMAGE_PROMPT_MODELS,
  ALLOWED_MUSIC_MODELS,
  ALLOWED_VIDEO_MODELS,
  IMAGE_GENERATE_MODEL,
  IMAGE_PROMPT_MODEL,
  MUSIC_GENERATE_MODEL,
  TEXT_GENERATE_MODEL,
  VIDEO_GENERATE_MODEL,
  buildCoverImageContext,
  buildImprovePromptMessages,
  encodeTextFile,
  extractGeneratedMediaRef,
  parseAiFileKind,
  parseAiTextFormat,
  parseImprovedPrompt,
  pickAllowedModel,
  type CoverFormField,
  type CoverImageSource,
} from "../../../lib/ai-media";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function asSource(value: string): CoverImageSource {
  return value === "form" ? "form" : "custom";
}

async function bytesFromRef(ref: { url?: string; base64?: string }, fallbackType: string) {
  if (ref.url) {
    const response = await fetch(ref.url);
    if (!response.ok) throw new Error("media_fetch_failed");
    return {
      bytes: await response.arrayBuffer(),
      contentType: response.headers.get("content-type") || fallbackType,
    };
  }
  const data = ref.base64!.replace(/^data:[^;]+;base64,/, "");
  const binary = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  return { bytes: binary.buffer, contentType: fallbackType };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return json({ ok: false, error: "unauthorized" }, 401);
  if (!(await hasPermission(env.DB, actor.id, "almacenamiento", "create"))) {
    return json({ ok: false, error: "forbidden" }, 403);
  }
  const storageAi = await translationAccess(env.DB, actor.id, "almacenamiento", "create");
  const articleAi = await translationAccess(env.DB, actor.id, "articulos", "update");
  if (!storageAi.canUseAi && !articleAi.canUseAi) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const form = await request.formData();
  const kind = parseAiFileKind(String(form.get("kind") ?? "image"));
  const format = parseAiTextFormat(String(form.get("format") ?? "txt"));
  const source = asSource(String(form.get("source") ?? "custom"));
  const selected = form
    .getAll("fields")
    .map((value) => String(value))
    .filter((value): value is CoverFormField =>
      ["title", "description", "tags", "categories", "content"].includes(value),
    );
  const context = buildCoverImageContext({
    source,
    customText: String(form.get("customText") ?? ""),
    selected,
    fields: {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      tags: String(form.get("tags") ?? ""),
      categories: String(form.get("categories") ?? ""),
      content: String(form.get("content") ?? ""),
    },
  });
  if (!context.ok) return json({ ok: false, error: context.error }, 400);

  const promptModel = pickAllowedModel(
    String(form.get("promptModel") ?? ""),
    ALLOWED_IMAGE_PROMPT_MODELS,
    IMAGE_PROMPT_MODEL,
  );
  const textModel = pickAllowedModel(
    String(form.get("textModel") ?? ""),
    ALLOWED_IMAGE_PROMPT_MODELS,
    TEXT_GENERATE_MODEL,
  );
  const writerModel = kind === "text" ? textModel : promptModel;
  const bucketId = String(form.get("bucket") || "media");
  const prefix = String(form.get("prefix") || "ai").trim().replace(/^\/+|\/+$/g, "") || "ai";
  const resolved = resolveR2Bucket(env as any, bucketId);
  if (!resolved) return json({ ok: false, error: "bucket_not_found" }, 404);

  try {
    const improvedPayload = await env.AI.run(writerModel as any, {
      messages: buildImprovePromptMessages(kind, context.context, format),
    });
    const prompt = parseImprovedPrompt(improvedPayload);
    if (!prompt) return json({ ok: false, error: "prompt_failed" }, 502);

    let bytes: ArrayBuffer | Uint8Array;
    let contentType = "application/octet-stream";
    let ext = "bin";
    let mediaModel = promptModel;

    if (kind === "text") {
      const file = encodeTextFile(prompt, format);
      bytes = file.bytes;
      contentType = file.contentType;
      ext = file.ext;
    } else if (kind === "video") {
      mediaModel = pickAllowedModel(String(form.get("videoModel") ?? ""), ALLOWED_VIDEO_MODELS, VIDEO_GENERATE_MODEL);
      const payload = await env.AI.run(mediaModel as any, { prompt, duration: 5, resolution: "720p" });
      const ref = extractGeneratedMediaRef(payload, "video");
      if (!ref) return json({ ok: false, error: "video_failed" }, 502);
      const media = await bytesFromRef(ref, "video/mp4");
      bytes = media.bytes;
      contentType = media.contentType;
      ext = contentType.includes("webm") ? "webm" : "mp4";
    } else if (kind === "music") {
      mediaModel = pickAllowedModel(String(form.get("musicModel") ?? ""), ALLOWED_MUSIC_MODELS, MUSIC_GENERATE_MODEL);
      const payload = await env.AI.run(mediaModel as any, {
        prompt,
        is_instrumental: true,
        lyrics_optimizer: false,
      });
      const ref = extractGeneratedMediaRef(payload, "music");
      if (!ref) return json({ ok: false, error: "music_failed" }, 502);
      const media = await bytesFromRef(ref, "audio/mpeg");
      bytes = media.bytes;
      contentType = media.contentType;
      ext = contentType.includes("wav") ? "wav" : "mp3";
    } else {
      mediaModel = pickAllowedModel(
        String(form.get("imageModel") ?? ""),
        ALLOWED_IMAGE_GENERATE_MODELS,
        IMAGE_GENERATE_MODEL,
      );
      const payload = await env.AI.run(mediaModel as any, {
        prompt,
        aspect_ratio: "16:9",
        resolution: "1k",
      });
      const ref = extractGeneratedMediaRef(payload, "image");
      if (!ref) return json({ ok: false, error: "image_failed" }, 502);
      const media = await bytesFromRef(ref, "image/png");
      bytes = media.bytes;
      contentType = media.contentType;
      ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    }

    const key = `${prefix}/ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await resolved.bucket.put(key, bytes, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        uploaded_by: String(actor.id),
        generated: "1",
        kind,
        prompt_model: promptModel,
        media_model: mediaModel,
      },
    });

    return json({
      ok: true,
      key,
      prompt,
      kind,
      contentType,
      streamUrl: `/api/admin/r2/stream?bucket=${encodeURIComponent(resolved.definition.id)}&key=${encodeURIComponent(key)}`,
    });
  } catch (error) {
    console.error("ai generate failed", error);
    return json({ ok: false, error: "generate_failed" }, 502);
  }
};
