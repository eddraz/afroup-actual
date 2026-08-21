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

  const canUpdate = (await hasPermission(env.DB, actor.id, "colabora", "update")) || (await hasPermission(env.DB, actor.id, "colabora", "create"));
  if (!canUpdate) {
    return json({ ok: false, message: "No tienes permisos para editar la configuración de la página Colabora." }, 403);
  }

  const form = await request.formData();
  const languages = await listSiteLanguages(env.DB);
  const locales = languages.map((l) => l.code);

  const upsertStmt = env.DB.prepare(`
    INSERT INTO collaborate_page_locales (
      locale, eyebrow, title, lead, form_title, form_note, og_json, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, datetime('now')
    )
    ON CONFLICT(locale) DO UPDATE SET
      eyebrow = excluded.eyebrow,
      title = excluded.title,
      lead = excluded.lead,
      form_title = excluded.form_title,
      form_note = excluded.form_note,
      og_json = excluded.og_json,
      updated_at = excluded.updated_at
  `);

  const tasks = locales.map((locale) => {
    const eyebrow = String(form.get(`page_eyebrow_${locale}`) ?? form.get("page_eyebrow") ?? "").trim() || "Colabora";
    const title = String(form.get(`page_title_${locale}`) ?? form.get("page_title") ?? "").trim() || "AfroUp se construye en comunidad";
    const lead = String(form.get(`page_lead_${locale}`) ?? form.get("page_lead") ?? "").trim() || "Aporta tu talento: cada artículo, traducción o ilustración amplía el acceso al conocimiento afro.";
    const form_title = String(form.get(`form_title_${locale}`) ?? form.get("form_title") ?? "").trim() || "Cuéntanos de ti";
    const form_note = String(form.get(`form_note_${locale}`) ?? form.get("form_note") ?? "").trim() || "Te respondemos en menos de 72 horas. Las colaboraciones publicadas se remuneran.";
    const og_json = serializeOgMetadata(parseOgFromForm(form, locale));

    return upsertStmt.bind(
      locale,
      eyebrow,
      title,
      lead,
      form_title,
      form_note,
      og_json
    );
  });

  await env.DB.batch(tasks);

  return json({ ok: true, message: "Página Colabora actualizada con éxito." });
};
