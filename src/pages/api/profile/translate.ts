import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { defaultLocale } from "../../../lib/i18n";
import { getPublicUser, PUBLIC_SESSION_COOKIE } from "../../../lib/public-session";
import { listSiteLanguages } from "../../../lib/site-languages";
import { translatePlainText } from "../../../lib/translate-dictionary";
import { BIO_MAX, translationAccessForEmail } from "../../../lib/user-bios";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);

  const access = await translationAccessForEmail(env.DB, user.email);
  if (!access.canUseAi) return json({ ok: false, error: "forbidden" }, 403);

  const form = await request.formData();
  const source = String(form.get("source") ?? "").trim();
  const target = String(form.get("target") ?? "").trim().toLowerCase();
  if (!source) return json({ ok: false, error: "source_required" }, 400);
  if (!/^[a-z]{2}$/.test(target) || target === defaultLocale) {
    return json({ ok: false, error: "target_invalid" }, 400);
  }

  const languages = await listSiteLanguages(env.DB);
  const sourceLang = languages.find((language) => language.code === defaultLocale);
  const targetLang = languages.find((language) => language.code === target);
  if (!targetLang) return json({ ok: false, error: "target_invalid" }, 400);

  try {
    const translated = await translatePlainText(
      env.AI,
      source.slice(0, BIO_MAX),
      sourceLang?.native_name || "Spanish",
      target,
      targetLang.native_name || targetLang.name,
    );
    return json({ ok: true, text: translated.slice(0, BIO_MAX) });
  } catch (error) {
    console.error("bio translate failed", error);
    return json({ ok: false, error: "translate_failed" }, 502);
  }
};
