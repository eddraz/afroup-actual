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

  const canUpdate = (await hasPermission(env.DB, actor.id, "contacto", "update")) || (await hasPermission(env.DB, actor.id, "contacto", "create"));
  if (!canUpdate) {
    return json({ ok: false, message: "No tienes permisos para editar la página de Contacto." }, 403);
  }

  const form = await request.formData();
  const languages = await listSiteLanguages(env.DB);
  const locales = languages.map((l) => l.code);

  const upsertStmt = env.DB.prepare(`
    INSERT INTO contact_page_locales (
      locale, eyebrow, title, lead,
      email, whatsapp, base_location, social_channels,
      response_time, og_json, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, datetime('now')
    )
    ON CONFLICT(locale) DO UPDATE SET
      eyebrow = excluded.eyebrow,
      title = excluded.title,
      lead = excluded.lead,
      email = excluded.email,
      whatsapp = excluded.whatsapp,
      base_location = excluded.base_location,
      social_channels = excluded.social_channels,
      response_time = excluded.response_time,
      og_json = excluded.og_json,
      updated_at = excluded.updated_at
  `);

  const tasks = locales.map((locale) => {
    const eyebrow = String(form.get(`eyebrow_${locale}`) ?? form.get("eyebrow") ?? "").trim() || "Contáctanos";
    const title = String(form.get(`title_${locale}`) ?? form.get("title") ?? "").trim() || "Hablemos";
    const lead = String(form.get(`lead_${locale}`) ?? form.get("lead") ?? "").trim() || "Prensa, alianzas, talleres o simplemente saludar — te respondemos en menos de 72 horas.";
    const email = String(form.get(`email_${locale}`) ?? form.get("email") ?? "").trim() || "hello@afroup.org";
    const whatsapp = String(form.get(`whatsapp_${locale}`) ?? form.get("whatsapp") ?? "").trim() || "+57 320 7146 · +31 20 211 7146";
    const base_location = String(form.get(`base_location_${locale}`) ?? form.get("base_location") ?? "").trim() || "Colombia · trabajamos con toda la diáspora";
    const social_channels = String(form.get(`social_channels_${locale}`) ?? form.get("social_channels") ?? "").trim() || "@afroup en Instagram, TikTok, YouTube y Facebook";
    const response_time = String(form.get(`response_time_${locale}`) ?? form.get("response_time") ?? "").trim() || "Menos de 72 horas";
    const og_json = serializeOgMetadata(parseOgFromForm(form, locale));

    return upsertStmt.bind(
      locale,
      eyebrow,
      title,
      lead,
      email,
      whatsapp,
      base_location,
      social_channels,
      response_time,
      og_json
    );
  });

  await env.DB.batch(tasks);

  // Sync with search_documents
  for (const locale of locales) {
    const title = String(form.get(`title_${locale}`) ?? form.get("title") ?? "").trim() || "Contacto · AfroUp";
    const lead = String(form.get(`lead_${locale}`) ?? form.get("lead") ?? "").trim();

    await applySearchDocument(env.DB, {
      moduleSlug: "categorias",
      recordId: 9998, // synthetic unique record ID for contact page
      locale,
      title,
      description: lead,
      kind: "Institucional · Contacto",
      path: searchDocumentPath(locale, "contacto"),
      published: true,
      tags: ["contacto", "correo", "email", "whatsapp", "alianzas", "prensa", "afroup", "hablemos"],
    });
  }

  return json({ ok: true, message: "Información de la página de Contacto actualizada con éxito." });
};
