import type { D1Database } from "@cloudflare/workers-types";
import { parseOgMetadata, type OpenGraphMetadata } from "./og-metadata";

export interface CollaborateSkillRow {
  id: number;
  slug: string;
  icon: string;
  badge_color: string;
  status: "active" | "hidden";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CollaborateSkillLocaleRow {
  skill_id: number;
  locale: string;
  title: string;
  dek: string;
  updated_at: string;
}

export interface CollaborateSkillItem {
  id: number;
  slug: string;
  icon: string;
  badge_color: string;
  status: "active" | "hidden";
  sort_order: number;
  locale: string;
  title: string;
  dek: string;
  created_at: string;
  updated_at: string;
}

export interface CollaboratePageData {
  eyebrow: string;
  title: string;
  lead: string;
  form_title: string;
  form_note: string;
  og: OpenGraphMetadata;
}

export type CollaborateSubmissionStatus = "unread" | "read" | "contacted" | "archived";

export interface CollaborateSubmissionRow {
  id: number;
  name: string;
  email: string;
  role_wanted: string;
  skill_id: number | null;
  message: string;
  portfolio_url: string | null;
  status: CollaborateSubmissionStatus;
  notes: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollaborateSubmissionStats {
  total: number;
  unread: number;
  read: number;
  contacted: number;
  archived: number;
}

export function slugifySkill(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "skill";
}

export async function loadCollaborateSkills(
  db: D1Database,
  locale: string,
  options?: { status?: string }
): Promise<CollaborateSkillItem[]> {
  let query = `
    SELECT s.*,
           COALESCE(sl.title, sles.title, s.slug) AS title,
           COALESCE(sl.dek, sles.dek, '') AS dek
      FROM collaborate_skills s
      LEFT JOIN collaborate_skill_locales sl ON sl.skill_id = s.id AND sl.locale = ?
      LEFT JOIN collaborate_skill_locales sles ON sles.skill_id = s.id AND sles.locale = 'es'
     WHERE 1=1
  `;
  const params: any[] = [locale];

  if (options?.status && options.status !== "all") {
    query += " AND s.status = ?";
    params.push(options.status);
  }

  query += " ORDER BY s.sort_order ASC, s.id ASC";

  const rows = (await db.prepare(query).bind(...params).all<any>()).results ?? [];

  return rows.map((row) => ({
    id: Number(row.id),
    slug: row.slug,
    icon: row.icon || "ic-book2",
    badge_color: row.badge_color || "accent",
    status: row.status as "active" | "hidden",
    sort_order: Number(row.sort_order) || 0,
    locale,
    title: row.title,
    dek: row.dek,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function loadAllCollaborateSkills(
  db: D1Database
): Promise<{ skill: CollaborateSkillRow; locales: Record<string, CollaborateSkillLocaleRow> }[]> {
  const skills = (await db.prepare("SELECT * FROM collaborate_skills ORDER BY sort_order ASC, id ASC").all<CollaborateSkillRow>()).results ?? [];
  const skillLocales = (await db.prepare("SELECT * FROM collaborate_skill_locales").all<CollaborateSkillLocaleRow>()).results ?? [];

  const localesBySkillId = new Map<number, Record<string, CollaborateSkillLocaleRow>>();
  for (const sl of skillLocales) {
    if (!localesBySkillId.has(sl.skill_id)) {
      localesBySkillId.set(sl.skill_id, {});
    }
    localesBySkillId.get(sl.skill_id)![sl.locale] = sl;
  }

  return skills.map((s) => ({
    skill: s,
    locales: localesBySkillId.get(s.id) ?? {},
  }));
}

export async function loadCollaboratePageConfig(
  db: D1Database,
  locale: string
): Promise<CollaboratePageData> {
  const row = await db
    .prepare("SELECT * FROM collaborate_page_locales WHERE locale = ?")
    .bind(locale)
    .first<any>();

  if (row) {
    return {
      eyebrow: row.eyebrow,
      title: row.title,
      lead: row.lead,
      form_title: row.form_title,
      form_note: row.form_note,
      og: parseOgMetadata(row.og_json),
    };
  }

  if (locale !== "es") {
    const fallback = await db
      .prepare("SELECT * FROM collaborate_page_locales WHERE locale = 'es'")
      .first<any>();
    if (fallback) {
      return {
        eyebrow: fallback.eyebrow,
        title: fallback.title,
        lead: fallback.lead,
        form_title: fallback.form_title,
        form_note: fallback.form_note,
        og: parseOgMetadata(fallback.og_json),
      };
    }
  }

  return {
    eyebrow: "Colabora",
    title: "AfroUp se construye en comunidad",
    lead: "Aporta tu talento: cada artículo, traducción o ilustración amplía el acceso al conocimiento afro.",
    form_title: "Cuéntanos de ti",
    form_note: "Te respondemos en menos de 72 horas. Las colaboraciones publicadas se remuneran.",
    og: parseOgMetadata(null),
  };
}

export async function loadAllCollaboratePageConfigs(
  db: D1Database
): Promise<Record<string, CollaboratePageData>> {
  const rows = (await db.prepare("SELECT * FROM collaborate_page_locales").all<any>()).results ?? [];
  const map: Record<string, CollaboratePageData> = {};
  for (const row of rows) {
    map[row.locale] = {
      eyebrow: row.eyebrow,
      title: row.title,
      lead: row.lead,
      form_title: row.form_title,
      form_note: row.form_note,
      og: parseOgMetadata(row.og_json),
    };
  }
  return map;
}

export async function listCollaborateSubmissions(
  db: D1Database,
  options?: { status?: string; search?: string }
): Promise<CollaborateSubmissionRow[]> {
  let query = "SELECT * FROM collaborate_submissions WHERE 1=1";
  const params: any[] = [];

  if (options?.status && options.status !== "all") {
    query += " AND status = ?";
    params.push(options.status);
  }

  if (options?.search) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query += " AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(role_wanted) LIKE ? OR LOWER(message) LIKE ?)";
    params.push(term, term, term, term);
  }

  query += " ORDER BY created_at DESC";

  const rows = (await db.prepare(query).bind(...params).all<CollaborateSubmissionRow>()).results ?? [];
  return rows;
}

export async function getCollaborateSubmissionStats(
  db: D1Database
): Promise<CollaborateSubmissionStats> {
  const rows = (await db.prepare(`
    SELECT status, COUNT(*) as count
      FROM collaborate_submissions
     GROUP BY status
  `).all<{ status: string; count: number }>()).results ?? [];

  let total = 0;
  let unread = 0;
  let read = 0;
  let contacted = 0;
  let archived = 0;

  for (const r of rows) {
    const count = Number(r.count) || 0;
    total += count;
    if (r.status === "unread") unread = count;
    else if (r.status === "read") read = count;
    else if (r.status === "contacted") contacted = count;
    else if (r.status === "archived") archived = count;
  }

  return { total, unread, read, contacted, archived };
}

export function validateCollaborateInput(input: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim();
  const role_wanted = String(input.role ?? input.role_wanted ?? "").trim();
  const message = String(input.message ?? "").trim();

  if (!name || name.length < 2) {
    errors.name = "Por favor ingresa tu nombre completo.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Por favor ingresa un correo electrónico válido.";
  }

  if (!role_wanted) {
    errors.role_wanted = "Selecciona en qué rol o área deseas colaborar.";
  }

  if (!message || message.length < 10) {
    errors.message = "Por favor comparte una breve descripción de tu experiencia o idea (mínimo 10 caracteres).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function createCollaborateSubmission(
  db: D1Database,
  input: any,
  ip?: string
): Promise<{ ok: boolean; id?: number; error?: string }> {
  const validation = validateCollaborateInput(input);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    return { ok: false, error: firstError };
  }

  const name = String(input.name).trim();
  const email = String(input.email).trim().toLowerCase();
  const role_wanted = String(input.role ?? input.role_wanted).trim();
  const skill_id = input.skill_id ? Number(input.skill_id) : null;
  const message = String(input.message).trim();
  const portfolio_url = String(input.portfolio_url ?? "").trim() || null;

  const res = await db.prepare(`
    INSERT INTO collaborate_submissions (
      name, email, role_wanted, skill_id, message, portfolio_url, status, ip_address, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'unread', ?, datetime('now'), datetime('now'))
  `).bind(
    name,
    email,
    role_wanted,
    skill_id,
    message,
    portfolio_url,
    ip || null
  ).run();

  const id = Number(res.meta?.last_row_id);
  return { ok: Boolean(res.success), id };
}

export async function updateCollaborateSubmissionStatus(
  db: D1Database,
  id: number,
  status: string,
  notes?: string
): Promise<boolean> {
  let query = "UPDATE collaborate_submissions SET status = ?, updated_at = datetime('now')";
  const params: any[] = [status];

  if (typeof notes === "string") {
    query += ", notes = ?";
    params.push(notes.trim());
  }

  query += " WHERE id = ?";
  params.push(id);

  const res = await db.prepare(query).bind(...params).run();
  return Boolean(res.success);
}

export async function deleteCollaborateSubmission(
  db: D1Database,
  id: number
): Promise<boolean> {
  const res = await db.prepare("DELETE FROM collaborate_submissions WHERE id = ?").bind(id).run();
  return Boolean(res.success);
}

export async function deleteCollaborateSkill(
  db: D1Database,
  id: number
): Promise<boolean> {
  const res = await db.prepare("DELETE FROM collaborate_skills WHERE id = ?").bind(id).run();
  return Boolean(res.success);
}
