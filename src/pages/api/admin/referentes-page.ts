import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { listSiteLanguages } from "../../../lib/site-languages";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";

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

  const canUpdate = await hasPermission(env.DB, actor.id, "referentes", "update");
  if (!canUpdate) {
    return json({ ok: false, message: "No tienes permisos para modificar la configuración de referentes." }, 403);
  }

  const form = await request.formData();
  const siteLanguages = await listSiteLanguages(env.DB);

  for (const lang of siteLanguages) {
    const loc = lang.code;
    const eyebrow = String(form.get(`eyebrow_${loc}`) || "Comunidad").trim();
    const title = String(form.get(`title_${loc}`) || "Referentes").trim();
    const lead = String(form.get(`lead_${loc}`) || "").trim();
    const band_title = String(form.get(`band_title_${loc}`) || "¿Falta alguien?").trim();
    const band_dek = String(form.get(`band_dek_${loc}`) || "Propón un referente para la colección.").trim();
    const band_cta_label = String(form.get(`band_cta_label_${loc}`) || "Proponer").trim();
    const band_cta_url = String(form.get(`band_cta_url_${loc}`) || (loc === "en" ? "/en/colabora" : "/colabora")).trim();

    const ogData = parseOgFromForm(form, loc);
    const ogJson = serializeOgMetadata(ogData);

    await env.DB.prepare(`
      INSERT INTO referentes_page_locales (
        locale, eyebrow, title, lead, band_title, band_dek, band_cta_label, band_cta_url, og_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(locale) DO UPDATE SET
        eyebrow = excluded.eyebrow,
        title = excluded.title,
        lead = excluded.lead,
        band_title = excluded.band_title,
        band_dek = excluded.band_dek,
        band_cta_label = excluded.band_cta_label,
        band_cta_url = excluded.band_cta_url,
        og_json = excluded.og_json,
        updated_at = datetime('now')
    `).bind(
      loc,
      eyebrow,
      title,
      lead,
      band_title,
      band_dek,
      band_cta_label,
      band_cta_url,
      ogJson
    ).run();
  }

  return json({ ok: true, message: "Configuración de la página de Referentes guardada con éxito." });
};
