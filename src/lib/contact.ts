import type { D1Database } from "@cloudflare/workers-types";
import { parseOgMetadata, type OpenGraphMetadata } from "./og-metadata";

export interface ContactPageLocaleRow {
  locale: string;
  eyebrow: string;
  title: string;
  lead: string;
  email: string;
  whatsapp: string;
  base_location: string;
  social_channels: string;
  response_time: string;
  og_json: string | null;
  updated_at: string;
}

export interface ContactPageData {
  eyebrow: string;
  title: string;
  lead: string;
  email: string;
  whatsapp: string;
  base_location: string;
  social_channels: string;
  response_time: string;
  og: OpenGraphMetadata;
}

export type ContactSubmissionStatus = "unread" | "read" | "replied" | "archived";

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: string;
  status: ContactSubmissionStatus;
  ip_address?: string | null;
  user_agent?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmissionStats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  archived: number;
}

export function parseContactPageRow(row?: Partial<ContactPageLocaleRow> | null): ContactPageData {
  return {
    eyebrow: row?.eyebrow || "Contáctanos",
    title: row?.title || "Hablemos",
    lead: row?.lead || "Prensa, alianzas, talleres o simplemente saludar — te respondemos en menos de 72 horas.",
    email: row?.email || "hello@afroup.org",
    whatsapp: row?.whatsapp || "+57 320 7146 · +31 20 211 7146",
    base_location: row?.base_location || "Colombia · trabajamos con toda la diáspora",
    social_channels: row?.social_channels || "@afroup en Instagram, TikTok, YouTube y Facebook",
    response_time: row?.response_time || "Menos de 72 horas",
    og: parseOgMetadata(row?.og_json),
  };
}

export async function loadContactPageLocale(db: D1Database, locale: string): Promise<ContactPageData> {
  const row = await db
    .prepare("SELECT * FROM contact_page_locales WHERE locale = ?")
    .bind(locale)
    .first<ContactPageLocaleRow>();

  if (row) return parseContactPageRow(row);

  if (locale !== "es") {
    const fallbackRow = await db
      .prepare("SELECT * FROM contact_page_locales WHERE locale = 'es'")
      .first<ContactPageLocaleRow>();
    if (fallbackRow) return parseContactPageRow(fallbackRow);
  }

  return parseContactPageRow(null);
}

export async function loadAllContactPageLocales(db: D1Database): Promise<Record<string, ContactPageData>> {
  const rows = (await db.prepare("SELECT * FROM contact_page_locales").all<ContactPageLocaleRow>()).results ?? [];
  const map: Record<string, ContactPageData> = {};
  for (const row of rows) {
    map[row.locale] = parseContactPageRow(row);
  }
  return map;
}

export async function listContactSubmissions(
  db: D1Database,
  filter?: { status?: string; search?: string }
): Promise<ContactSubmission[]> {
  let query = "SELECT * FROM contact_submissions WHERE 1=1";
  const params: any[] = [];

  if (filter?.status && filter.status !== "all") {
    query += " AND status = ?";
    params.push(filter.status);
  }

  if (filter?.search) {
    const term = `%${filter.search.trim().toLowerCase()}%`;
    query += " AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(message) LIKE ?)";
    params.push(term, term, term, term);
  }

  query += " ORDER BY created_at DESC LIMIT 100";

  const stmt = db.prepare(query);
  const rows = (await (params.length > 0 ? stmt.bind(...params) : stmt).all<ContactSubmission>()).results ?? [];
  return rows;
}

export async function getContactSubmissionStats(db: D1Database): Promise<ContactSubmissionStats> {
  const rows = (await db.prepare(`
    SELECT status, COUNT(*) as count
      FROM contact_submissions
     GROUP BY status
  `).all<{ status: string; count: number }>()).results ?? [];

  const stats: ContactSubmissionStats = {
    total: 0,
    unread: 0,
    read: 0,
    replied: 0,
    archived: 0,
  };

  for (const row of rows) {
    const cnt = Number(row.count) || 0;
    stats.total += cnt;
    if (row.status === "unread") stats.unread += cnt;
    else if (row.status === "read") stats.read += cnt;
    else if (row.status === "replied") stats.replied += cnt;
    else if (row.status === "archived") stats.archived += cnt;
  }

  return stats;
}

export function validateContactSubmissionInput(input: {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}): { valid: boolean; error?: string } {
  const name = (input.name || "").trim();
  const email = (input.email || "").trim();
  const subject = (input.subject || "").trim();
  const message = (input.message || "").trim();

  if (!name || name.length < 2) {
    return { valid: false, error: "El nombre es obligatorio y debe tener al menos 2 caracteres." };
  }
  if (!email || !email.includes("@") || !email.includes(".")) {
    return { valid: false, error: "El correo electrónico no es válido." };
  }
  if (!subject) {
    return { valid: false, error: "El asunto es obligatorio." };
  }
  if (!message || message.length < 5) {
    return { valid: false, error: "El mensaje debe tener al menos 5 caracteres." };
  }

  return { valid: true };
}

export async function createContactSubmission(
  db: D1Database,
  input: {
    name: string;
    email: string;
    subject: string;
    message: string;
    locale?: string;
    ip?: string;
    userAgent?: string;
  }
): Promise<{ ok: boolean; id?: number; error?: string }> {
  const validation = validateContactSubmissionInput(input);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const res = await db
    .prepare(`
      INSERT INTO contact_submissions (
        name, email, subject, message, locale, ip_address, user_agent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
    .bind(
      input.name.trim(),
      input.email.trim().toLowerCase(),
      input.subject.trim(),
      input.message.trim(),
      input.locale || "es",
      input.ip || null,
      input.userAgent || null
    )
    .run();

  const id = res.meta?.last_row_id;
  return { ok: true, id: id ? Number(id) : undefined };
}
