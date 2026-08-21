import type { D1Database } from "@cloudflare/workers-types";
import { parseOgMetadata, type OpenGraphMetadata } from "./og-metadata";

export interface AboutTeamMember {
  name: string;
  role: string;
  avatar_url?: string | null;
  figure?: string | null;
}

export interface AboutStatItem {
  value: string;
  label: string;
}

export interface AboutPageLocaleRow {
  locale: string;
  eyebrow: string;
  title: string;
  lead: string;
  story_title: string;
  story_body: string;
  values_json: string;
  mission_title: string;
  mission_body: string;
  vision_title: string;
  vision_body: string;
  stats_json: string;
  team_json: string;
  cta_title: string;
  cta_body: string;
  collaborate_label: string;
  donate_label: string;
  og_json: string | null;
  updated_at: string;
}

export interface AboutPageData {
  eyebrow: string;
  title: string;
  lead: string;
  story_title: string;
  story_body: string;
  values: string[];
  mission_title: string;
  mission_body: string;
  vision_title: string;
  vision_body: string;
  stats: AboutStatItem[];
  team: AboutTeamMember[];
  cta_title: string;
  cta_body: string;
  collaborate_label: string;
  donate_label: string;
  og: OpenGraphMetadata;
}

export function parseAboutPageRow(row?: Partial<AboutPageLocaleRow> | null): AboutPageData {
  let values: string[] = [];
  try {
    values = JSON.parse(row?.values_json || '["Orgullosamente afrocéntrico", "Educación comunitaria", "Cultura viva", "En red"]');
  } catch {
    values = ["Orgullosamente afrocéntrico", "Educación comunitaria", "Cultura viva", "En red"];
  }

  let stats: AboutStatItem[] = [];
  try {
    stats = JSON.parse(row?.stats_json || '[{"value":"+200","label":"Artículos y guías publicados"},{"value":"14","label":"Países alcanzados"},{"value":"+80K","label":"Comunidad en redes"}]');
  } catch {
    stats = [
      { value: "+200", label: "Artículos y guías publicados" },
      { value: "14", label: "Países alcanzados" },
      { value: "+80K", label: "Comunidad en redes" },
    ];
  }

  let team: AboutTeamMember[] = [];
  try {
    team = JSON.parse(row?.team_json || '[{"name":"Jenniffer M.","role":"Fundadora · Editora","avatar_url":"","figure":"bg-secondary/30"},{"name":"Equipo editorial","role":"Investigación y redacción","avatar_url":"","figure":"bg-accent/30"},{"name":"Diseño","role":"Identidad y contenido visual","avatar_url":"","figure":"bg-primary/20"},{"name":"Comunidad","role":"Colaboradores de la diáspora","avatar_url":"","figure":"bg-[url(\"/assets/pattern.png\")] bg-cover bg-center"}]');
  } catch {
    team = [
      { name: "Jenniffer M.", role: "Fundadora · Editora", avatar_url: "", figure: "bg-secondary/30" },
      { name: "Equipo editorial", role: "Investigación y redacción", avatar_url: "", figure: "bg-accent/30" },
      { name: "Diseño", role: "Identidad y contenido visual", avatar_url: "", figure: "bg-primary/20" },
      { name: "Comunidad", role: "Colaboradores de la diáspora", avatar_url: "", figure: "bg-[url('/assets/pattern.png')] bg-cover bg-center" },
    ];
  }

  return {
    eyebrow: row?.eyebrow || "CONOCE AFROUP",
    title: row?.title || "Una plataforma para amplificar la voz, cultura y memoria afro",
    lead: row?.lead || "Investigamos, creamos y compartimos contenidos educativos, culturales y de memoria histórica afrodiaspórica.",
    story_title: row?.story_title || "Nuestra historia",
    story_body: row?.story_body || "AfroUp nace como una cuenta educativa en redes sociales y crece hasta convertirse en una plataforma digital activista, educativa y cultural afrocéntrica.",
    values,
    mission_title: row?.mission_title || "Nuestra misión",
    mission_body: row?.mission_body || "Educar y empoderar a través del conocimiento afrocéntrico, accesible y riguroso.",
    vision_title: row?.vision_title || "Nuestra visión",
    vision_body: row?.vision_body || "Una comunidad global que reconoce, valora y vive su legado afro.",
    stats,
    team,
    cta_title: row?.cta_title || "¿Quieres apoyar este proyecto?",
    cta_body: row?.cta_body || "Únete como colaborador o haz una donación para que sigamos creando contenido libre y accesible.",
    collaborate_label: row?.collaborate_label || "Colabora con nosotros",
    donate_label: row?.donate_label || "Haz una donación",
    og: parseOgMetadata(row?.og_json),
  };
}

export async function loadAboutPageLocale(db: D1Database, locale: string): Promise<AboutPageData> {
  const row = await db
    .prepare("SELECT * FROM about_page_locales WHERE locale = ?")
    .bind(locale)
    .first<AboutPageLocaleRow>();

  if (row) return parseAboutPageRow(row);

  if (locale !== "es") {
    const fallbackRow = await db
      .prepare("SELECT * FROM about_page_locales WHERE locale = 'es'")
      .first<AboutPageLocaleRow>();
    if (fallbackRow) return parseAboutPageRow(fallbackRow);
  }

  return parseAboutPageRow(null);
}

export async function loadAllAboutPageLocales(db: D1Database): Promise<Record<string, AboutPageData>> {
  const rows = (await db.prepare("SELECT * FROM about_page_locales").all<AboutPageLocaleRow>()).results ?? [];
  const map: Record<string, AboutPageData> = {};
  for (const row of rows) {
    map[row.locale] = parseAboutPageRow(row);
  }
  return map;
}
