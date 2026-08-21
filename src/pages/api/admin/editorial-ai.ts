import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { forbiddenJson, getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import {
  EDITORIAL_AI_MODEL,
  buildEditorialAiMessages,
  missingEditorialAiPrompt,
  normalizeEditorialAiResult,
  parseEditorialAiJson,
} from "../../../lib/editorial-ai";
import { translationAccess } from "../../../lib/editorial";
import { extractAiText } from "../../../lib/og-metadata";
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
  const moduleSlug = String(form.get("module") ?? "").trim().toLowerCase();
  const kind = form.get("kind") === "category" ? "category" : "article";
  const locale = String(form.get("locale") ?? "es").trim().toLowerCase();
  const prompt = String(form.get("prompt") ?? "");
  const title = String(form.get("title") ?? "");
  const description = String(form.get("description") ?? "");
  const content = String(form.get("content") ?? "");
  const tags = String(form.get("tags") ?? "");
  const slug = String(form.get("slug") ?? "");
  if (moduleSlug !== "articulos" && moduleSlug !== "categorias") {
    return json({ ok: false, error: "module_invalid" }, 400);
  }
  const updateAccess = await translationAccess(env.DB, actor.id, moduleSlug, "update" as PermissionAction);
  const createAccess = await translationAccess(env.DB, actor.id, moduleSlug, "create" as PermissionAction);
  if (!updateAccess.canUseAi && !createAccess.canUseAi) return forbiddenJson();
  if (missingEditorialAiPrompt(prompt)) return json({ ok: false, error: "prompt_required" }, 400);

  try {
    const payload = await env.AI.run(EDITORIAL_AI_MODEL, {
      messages: buildEditorialAiMessages({
        kind,
        locale,
        prompt,
        existing: { title, description, content, tags, slug },
      }),
    });
    const text = extractAiText(payload);
    const parsed = text ? parseEditorialAiJson(text) : null;
    if (!parsed) throw new Error("editorial_ai_parse_failed");
    return json({ ok: true, result: normalizeEditorialAiResult(kind, parsed) });
  } catch (error) {
    console.error("admin editorial ai generate failed", error);
    return json({ ok: false, error: "generate_failed" }, 502);
  }
};
