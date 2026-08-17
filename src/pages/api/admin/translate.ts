import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson, forbiddenJson } from "../../../lib/admin-scope";
import { defaultLocale } from "../../../lib/i18n";
import { listSiteLanguages } from "../../../lib/site-languages";
import { translationAccess } from "../../../lib/editorial";
import { TRANSLATION_MODEL } from "../../../lib/translate-dictionary";
import type { PermissionAction } from "../../../lib/rbac";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function extractContent(payload: unknown): string | null {
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

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const moduleSlug = String(form.get("module") ?? "articulos").trim().toLowerCase();
  const action = (String(form.get("action") ?? "update").trim().toLowerCase()) as PermissionAction;
  
  const access = await translationAccess(env.DB, actor.id, moduleSlug, action);
  if (!access.canUseAi) return forbiddenJson();

  const source = String(form.get("source") ?? "").trim();
  const current = String(form.get("current") ?? "");
  const target = String(form.get("target") ?? "").trim().toLowerCase();
  const isHtml = form.get("is_html") === "1" || form.get("is_html") === "true";

  if (!source) return json({ ok: false, error: "source_required" }, 400);
  if (!/^[a-z]{2}$/.test(target) || target === defaultLocale) {
    return json({ ok: false, error: "target_invalid" }, 400);
  }

  const languages = await listSiteLanguages(env.DB);
  const sourceLang = languages.find((l) => l.code === defaultLocale);
  const targetLang = languages.find((l) => l.code === target);
  if (!targetLang) return json({ ok: false, error: "target_invalid" }, 400);

  const sourceName = sourceLang?.native_name || "Spanish";
  const targetName = targetLang.native_name || targetLang.name;

  try {
    const messages = isHtml
      ? [
          {
            role: "system",
            content: `You translate HTML content from ${sourceName} into ${targetName} (${targetCodeName(target, targetName)}). Preserve all HTML tags, classes, attributes, and formatting structure exactly. Return ONLY the translated HTML content without markdown code blocks. Keep proper names like AfroUp.`,
          },
          {
            role: "user",
            content: current.trim()
              ? `Original ${sourceName} HTML:\n${source}\n\nCurrent ${targetName} draft to improve:\n${current}`
              : `Translate this ${sourceName} HTML into ${targetName}:\n${source}`,
          },
        ]
      : [
          {
            role: "system",
            content: `You translate editorial text from ${sourceName} into ${targetName}. Return only the translated text without quotes or explanations. Keep brand names like AfroUp.`,
          },
          {
            role: "user",
            content: current.trim()
              ? `Original ${sourceName} text:\n${source}\n\nCurrent ${targetName} draft to improve:\n${current}`
              : `Translate this ${sourceName} text into ${targetName}:\n${source}`,
          },
        ];

    const payload = await env.AI.run(TRANSLATION_MODEL, { messages });
    const content = extractContent(payload)?.trim();
    if (!content) throw new Error("translate_failed");

    const cleaned = isHtml
      ? content.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "").trim()
      : content.replace(/^['"“”]+|['"“”]+$/g, "").trim();

    return json({ ok: true, text: cleaned });
  } catch (error) {
    console.error("admin translate failed", error);
    return json({ ok: false, error: "translate_failed" }, 502);
  }
};

function targetCodeName(code: string, name: string): string {
  return `${name} (${code})`;
}
