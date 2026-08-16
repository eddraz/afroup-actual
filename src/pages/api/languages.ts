import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { listSiteLanguages, listVisibleLanguages } from "../../lib/site-languages";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const languages = url.searchParams.get("scope") === "all"
    ? await listSiteLanguages(env.DB)
    : await listVisibleLanguages(env.DB);
  return new Response(
    JSON.stringify({
      ok: true,
      languages: languages.map((language) => ({
        code: language.code,
        name: language.name,
        nativeName: language.native_name,
      })),
    }),
    { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
  );
};
