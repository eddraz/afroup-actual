import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { parseOgFromForm, serializeOgMetadata } from "../../../lib/og-metadata";
import { applySearchDocument, searchDocumentPath } from "../../../lib/search-documents";
import { defaultLocale } from "../../../lib/i18n";
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

  const canUpdate = (await hasPermission(env.DB, actor.id, "nosotros", "update")) || (await hasPermission(env.DB, actor.id, "nosotros", "create"));
  if (!canUpdate) {
    return json({ ok: false, message: "No tienes permisos para editar la página Nosotros." }, 403);
  }

  const form = await request.formData();
  const languages = await listSiteLanguages(env.DB);
  const locales = languages.map((l) => l.code);

  const upsertStmt = env.DB.prepare(`
    INSERT INTO about_page_locales (
      locale, eyebrow, title, lead,
      story_title, story_body, values_json,
      mission_title, mission_body,
      vision_title, vision_body,
      stats_json, team_json,
      cta_title, cta_body,
      collaborate_label, collaborate_url,
      donate_label, donate_url,
      og_json, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, datetime('now')
    )
    ON CONFLICT(locale) DO UPDATE SET
      eyebrow = excluded.eyebrow,
      title = excluded.title,
      lead = excluded.lead,
      story_title = excluded.story_title,
      story_body = excluded.story_body,
      values_json = excluded.values_json,
      mission_title = excluded.mission_title,
      mission_body = excluded.mission_body,
      vision_title = excluded.vision_title,
      vision_body = excluded.vision_body,
      stats_json = excluded.stats_json,
      team_json = excluded.team_json,
      cta_title = excluded.cta_title,
      cta_body = excluded.cta_body,
      collaborate_label = excluded.collaborate_label,
      collaborate_url = excluded.collaborate_url,
      donate_label = excluded.donate_label,
      donate_url = excluded.donate_url,
      og_json = excluded.og_json,
      updated_at = excluded.updated_at
  `);

  const tasks = locales.map((locale) => {
    const eyebrow = String(form.get(`eyebrow_${locale}`) ?? form.get("eyebrow") ?? "").trim() || "CONOCE AFROUP";
    const title = String(form.get(`title_${locale}`) ?? form.get("title") ?? "").trim() || "Una plataforma para amplificar la voz, cultura y memoria afro";
    const lead = String(form.get(`lead_${locale}`) ?? form.get("lead") ?? "").trim();
    const story_title = String(form.get(`story_title_${locale}`) ?? form.get("story_title") ?? "").trim() || "Nuestra historia";
    const story_body = String(form.get(`story_body_${locale}`) ?? form.get("story_body") ?? "").trim();

    // Values chips
    const rawValues = String(form.get(`values_${locale}`) ?? form.get("values") ?? "").trim();
    const values = rawValues ? rawValues.split(/[\n,]+/).map((v) => v.trim()).filter(Boolean) : [];
    const values_json = JSON.stringify(values);

    const mission_title = String(form.get(`mission_title_${locale}`) ?? form.get("mission_title") ?? "").trim() || "Nuestra misión";
    const mission_body = String(form.get(`mission_body_${locale}`) ?? form.get("mission_body") ?? "").trim();
    const vision_title = String(form.get(`vision_title_${locale}`) ?? form.get("vision_title") ?? "").trim() || "Nuestra visión";
    const vision_body = String(form.get(`vision_body_${locale}`) ?? form.get("vision_body") ?? "").trim();

    // Stats
    const s1_v = String(form.get(`stat_val_1_${locale}`) ?? "+200").trim();
    const s1_l = String(form.get(`stat_lbl_1_${locale}`) ?? "Artículos y guías publicados").trim();
    const s2_v = String(form.get(`stat_val_2_${locale}`) ?? "14").trim();
    const s2_l = String(form.get(`stat_lbl_2_${locale}`) ?? "Países alcanzados").trim();
    const s3_v = String(form.get(`stat_val_3_${locale}`) ?? "+80K").trim();
    const s3_l = String(form.get(`stat_lbl_3_${locale}`) ?? "Comunidad en redes").trim();
    const stats_json = JSON.stringify([
      { value: s1_v, label: s1_l },
      { value: s2_v, label: s2_l },
      { value: s3_v, label: s3_l },
    ]);

    // Team members JSON from form
    const rawTeam = String(form.get(`team_json_${locale}`) ?? form.get("team_json") ?? "").trim();
    let team_json = rawTeam;
    if (!team_json || team_json === "[]") {
      team_json = JSON.stringify([
        { name: "Jenniffer M.", role: "Fundadora · Editora", avatar_url: "", figure: "bg-secondary/30" },
        { name: "Equipo editorial", role: "Investigación y redacción", avatar_url: "", figure: "bg-accent/30" },
        { name: "Diseño", role: "Identidad y contenido visual", avatar_url: "", figure: "bg-primary/20" },
        { name: "Comunidad", role: "Colaboradores de la diáspora", avatar_url: "", figure: "bg-[url('/assets/pattern.png')] bg-cover bg-center" },
      ]);
    }

    const cta_title = String(form.get(`cta_title_${locale}`) ?? form.get("cta_title") ?? "").trim() || "¿Quieres apoyar este proyecto?";
    const cta_body = String(form.get(`cta_body_${locale}`) ?? form.get("cta_body") ?? "").trim();
    const collaborate_label = String(form.get(`collaborate_label_${locale}`) ?? form.get("collaborate_label") ?? "").trim() || "Colabora con nosotros";
    const collaborate_url = String(form.get(`collaborate_url_${locale}`) ?? form.get("collaborate_url") ?? "").trim() || (locale === "es" ? "/colabora" : `/${locale}/colabora`);
    const donate_label = String(form.get(`donate_label_${locale}`) ?? form.get("donate_label") ?? "").trim() || "Haz una donación";
    const donate_url = String(form.get(`donate_url_${locale}`) ?? form.get("donate_url") ?? "").trim() || (locale === "es" ? "/donacion" : `/${locale}/donacion`);
    const og_json = serializeOgMetadata(parseOgFromForm(form, locale));

    return upsertStmt.bind(
      locale,
      eyebrow,
      title,
      lead,
      story_title,
      story_body,
      values_json,
      mission_title,
      mission_body,
      vision_title,
      vision_body,
      stats_json,
      team_json,
      cta_title,
      cta_body,
      collaborate_label,
      collaborate_url,
      donate_label,
      donate_url,
      og_json
    );
  });

  await env.DB.batch(tasks);

  // Sync with search_documents
  for (const locale of locales) {
    const title = String(form.get(`title_${locale}`) ?? form.get("title") ?? "").trim() || "Nosotros · AfroUp";
    const lead = String(form.get(`lead_${locale}`) ?? form.get("lead") ?? "").trim();
    const story_body = String(form.get(`story_body_${locale}`) ?? form.get("story_body") ?? "").trim();

    await applySearchDocument(env.DB, {
      moduleSlug: "categorias", // indexed in public search
      recordId: 9999, // synthetic unique record ID for nosotros page
      locale,
      title,
      description: lead || story_body,
      kind: "Institucional · Nosotros",
      path: searchDocumentPath(locale, "nosotros"),
      published: true,
      tags: ["nosotros", "mision", "vision", "equipo", "historia", "afroup", "sobre nosotros"],
    });
  }

  return json({ ok: true, message: "Página Nosotros guardada y actualizada con éxito." });
};
