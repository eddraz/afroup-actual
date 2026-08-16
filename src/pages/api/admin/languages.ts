import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentAdmin, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { addSiteLanguage, setLanguageVisibility } from "../../../lib/site-languages";
import { dictionaryAsJson, translateUiDictionary } from "../../../lib/translate-dictionary";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentAdmin(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const intent = String(form.get("_intent") ?? "");

  if (intent === "toggle") {
    const code = String(form.get("code") ?? "").trim().toLowerCase();
    const visible = form.get("visible") === "1";
    const result = await setLanguageVisibility(env.DB, code, visible);
    if (!result.ok) return json({ ok: false, error: result.error }, 400);
    return json({ ok: true });
  }

  if (intent === "create") {
    const code = String(form.get("code") ?? "").trim().toLowerCase();
    const name = String(form.get("name") ?? "").trim();
    const nativeName = String(form.get("nativeName") ?? "").trim() || name;
    if (!code || !name) return json({ ok: false, error: "missing_fields" }, 400);

    let dictionary: string | undefined;
    try {
      const translated = await translateUiDictionary(env.AI, code, nativeName || name);
      dictionary = dictionaryAsJson(translated);
    } catch (error) {
      console.error("language translate failed", error);
      return json({ ok: false, error: "translate_failed" }, 502);
    }

    const result = await addSiteLanguage(env.DB, { code, name, nativeName, dictionary });
    if (!result.ok) return json({ ok: false, error: result.error }, 400);
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown_intent" }, 400);
};
