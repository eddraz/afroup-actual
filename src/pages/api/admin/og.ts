import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { forbiddenJson, getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { translationAccess } from "../../../lib/editorial";
import {
  OG_METADATA_MODEL,
  buildOgGenerateMessages,
  extractAiText,
  mergeOgMetadata,
  missingOgGenerateSources,
  parseOgAiJson,
  seedOgMetadata,
} from "../../../lib/og-metadata";
import type { PermissionAction } from "../../../lib/rbac";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const moduleSlug = String(form.get("module") ?? "articulos").trim().toLowerCase();
  const kind = form.get("kind") === "category" ? "category" : "article";
  const locale = String(form.get("locale") ?? "es").trim().toLowerCase();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "");
  const content = String(form.get("content") ?? "");
  const url = String(form.get("url") ?? "").trim();
  const image = String(form.get("image") ?? "").trim();
  const tags = String(form.get("tags") ?? "");
  const categories = String(form.get("categories") ?? "");
  if (moduleSlug !== "articulos" && moduleSlug !== "categorias") {
    return json({ ok: false, error: "module_invalid" }, 400);
  }
  const updateAccess = await translationAccess(env.DB, actor.id, moduleSlug, "update" as PermissionAction);
  const createAccess = await translationAccess(env.DB, actor.id, moduleSlug, "create" as PermissionAction);
  if (!updateAccess.canUseAi && !createAccess.canUseAi) return forbiddenJson();
  const missing = missingOgGenerateSources(kind, {
    title,
    description,
    content,
    tags,
    categories: categories.split(",").map((value) => value.trim()).filter(Boolean),
  });
  if (missing.length) return json({ ok: false, error: "sources_required", missing }, 400);

  const seeded = seedOgMetadata({
    title,
    description,
    image,
    url,
    type: kind === "category" ? "website" : "article",
  });

  try {
    const payload = await env.AI.run(OG_METADATA_MODEL, {
      messages: buildOgGenerateMessages({
        title,
        description,
        content,
        tags,
        categories,
        url,
        image,
        locale,
        kind,
      }),
    });
    const text = extractAiText(payload);
    const parsed = text ? parseOgAiJson(text) : null;
    if (!parsed) throw new Error("og_parse_failed");
    return json({ ok: true, metadata: mergeOgMetadata(seeded, parsed) });
  } catch (error) {
    console.error("admin og generate failed", error);
    return json({ ok: false, error: "generate_failed" }, 502);
  }
};
