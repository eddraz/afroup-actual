import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";
import { applySearchDocument, searchDocumentPath } from "../../../lib/search-documents";
import { listSiteLanguages } from "../../../lib/site-languages";

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

  const canUpdate = (await hasPermission(env.DB, actor.id, "recursos", "update")) || (await hasPermission(env.DB, actor.id, "recursos", "create"));
  if (!canUpdate) {
    return json({ ok: false, message: "No tienes permisos para editar la configuración de la página de Recursos." }, 403);
  }

  const form = await request.formData();
  const languages = await listSiteLanguages(env.DB);
  const locales = languages.map((l) => l.code);

  const upsertStmt = env.DB.prepare(`
    INSERT INTO resources_page_locales (
      locale, eyebrow, title, lead,
      band_title, band_dek, band_cta_label, band_cta_url,
      og_json, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, datetime('now')
    )
    ON CONFLICT(locale) DO UPDATE SET
      eyebrow = excluded.eyebrow,
      title = excluded.title,
      lead = excluded.lead,
      band_title = excluded.band_title,
      band_dek = excluded.band_dek,
      band_cta_label = excluded.band_cta_label,
      band_cta_url = excluded.band_cta_url,
      og_json = excluded.og_json,
      updated_at = excluded.updated_at
  `);

  const tasks = locales.map((locale) => {
    const eyebrow = String(form.get(`page_eyebrow_${locale}`) ?? form.get("page_eyebrow") ?? "").trim() || "Biblioteca libre";
    const title = String(form.get(`page_title_${locale}`) ?? form.get("page_title") ?? "").trim() || "Recursos para aprender y enseñar";
    const lead = String(form.get(`page_lead_${locale}`) ?? form.get("page_lead") ?? "").trim() || "Guías, lecturas y materiales descargables — gratuitos y listos para el aula, el círculo de lectura o el autoestudio.";
    const band_title = String(form.get(`band_title_${locale}`) ?? form.get("band_title") ?? "").trim() || "¿Tienes un recurso para compartir?";
    const band_dek = String(form.get(`band_dek_${locale}`) ?? form.get("band_dek") ?? "").trim() || "Súmalo a la biblioteca libre de AfroUp.";
    const band_cta_label = String(form.get(`band_cta_label_${locale}`) ?? form.get("band_cta_label") ?? "").trim() || "Colabora";
    const band_cta_url = String(form.get(`band_cta_url_${locale}`) ?? form.get("band_cta_url") ?? "").trim() || "/colabora";
    const og_json = serializeOgMetadata(parseOgFromForm(form, locale));

    return upsertStmt.bind(
      locale,
      eyebrow,
      title,
      lead,
      band_title,
      band_dek,
      band_cta_label,
      band_cta_url,
      og_json
    );
  });

  await env.DB.batch(tasks);

  // Sync with search_documents
  for (const locale of locales) {
    const title = String(form.get(`page_title_${locale}`) ?? form.get("page_title") ?? "").trim() || "Recursos · AfroUp";
    const lead = String(form.get(`page_lead_${locale}`) ?? form.get("page_lead") ?? "").trim();

    await applySearchDocument(env.DB, {
      moduleSlug: "recursos",
      recordId: 9997, // synthetic unique record ID for resources landing
      locale,
      title,
      description: lead,
      kind: "Biblioteca · Recursos",
      path: searchDocumentPath(locale, "recursos"),
      published: true,
      tags: ["recursos", "biblioteca", "guias", "pdf", "lecturas", "docentes", "glosario", "mapas"],
    });
  }

  return json({ ok: true, message: "Página de Recursos actualizada con éxito." });
};
