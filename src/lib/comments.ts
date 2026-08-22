import type { D1Database } from "@cloudflare/workers-types";

export type CommentStatus = "pending" | "approved" | "reported" | "rejected";

export const COMMENT_STATUSES = [
  { value: "pending", es: "Pendiente", en: "Pending" },
  { value: "approved", es: "Aprobado", en: "Approved" },
  { value: "reported", es: "Reportado", en: "Reported" },
  { value: "rejected", es: "Descartado", en: "Rejected" },
] as const;

export interface UserCommentRow {
  id: number;
  article_id: number | null;
  article_title: string;
  user_id: number | null;
  author_name: string;
  body: string;
  status: CommentStatus;
  admin_reply: string;
  created_at: string;
  updated_at: string;
}

export type UserCommentItem = UserCommentRow;

export interface CommentsStats {
  total: number;
  pending: number;
  reported: number;
  approved: number;
}

export interface LoadCommentsOptions {
  status?: string;
  search?: string;
  limit?: number;
}

const COMMENT_STATUS_VALUES: readonly string[] = COMMENT_STATUSES.map((s) => s.value);

export function isCommentStatus(value: unknown): value is CommentStatus {
  return typeof value === "string" && COMMENT_STATUS_VALUES.includes(value);
}

/** Trims any input into a plain comment/reply string; empty or whitespace-only input becomes "". */
export function normalizeCommentBody(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function diffParts(fromMs: number, toMs: number) {
  const totalSeconds = Math.max(0, Math.floor((toMs - fromMs) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return { totalSeconds, minutes, hours, days };
}

/** Compact relative age ("hace 4 min" / "4 min ago"). Pass `now` for deterministic output. */
export function formatCommentAge(iso: string, locale: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const es = String(locale).toLowerCase().startsWith("es");
  const { totalSeconds, minutes, hours, days } = diffParts(date.getTime(), now.getTime());

  if (totalSeconds < 60) return es ? "hace un instante" : "just now";
  if (minutes < 60) return es ? `hace ${minutes} min` : `${minutes} min ago`;
  if (hours < 24) return es ? `hace ${hours} h` : `${hours} h ago`;

  if (days < 30) return es ? `hace ${days} d` : `${days} d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return es ? `hace ${months} ${months === 1 ? "mes" : "meses"}` : `${months} mo ago`;
  const years = Math.floor(days / 365);
  return es ? `hace ${years} ${years === 1 ? "año" : "años"}` : `${years} yr ago`;
}

function mapUserComment(row: any): UserCommentItem {
  return {
    id: Number(row.id),
    article_id: row.article_id === null || row.article_id === undefined ? null : Number(row.article_id),
    article_title: row.article_title ?? "",
    user_id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    author_name: row.author_name || "Anónimo",
    body: row.body ?? "",
    status: row.status as CommentStatus,
    admin_reply: row.admin_reply ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function loadComments(db: D1Database, options?: LoadCommentsOptions): Promise<UserCommentItem[]> {
  let query = "SELECT * FROM user_comments WHERE 1=1";
  const params: any[] = [];

  if (options?.status && isCommentStatus(options.status)) {
    query += " AND status = ?";
    params.push(options.status);
  }

  if (options?.search) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    query +=
      " AND (LOWER(author_name) LIKE ? OR LOWER(article_title) LIKE ? OR LOWER(body) LIKE ? OR LOWER(admin_reply) LIKE ?)";
    params.push(term, term, term, term);
  }

  query += " ORDER BY created_at DESC";

  if (options?.limit && options.limit > 0) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const rows = (await db.prepare(query).bind(...params).all<any>()).results ?? [];
  return rows.map(mapUserComment);
}

export async function loadCommentById(db: D1Database, id: number): Promise<UserCommentItem | null> {
  const row = await db.prepare("SELECT * FROM user_comments WHERE id = ? LIMIT 1").bind(id).first<any>();
  if (!row) return null;
  return mapUserComment(row);
}

export async function getCommentsStats(db: D1Database): Promise<CommentsStats> {
  const totalRow = await db.prepare("SELECT COUNT(*) AS c FROM user_comments").first<{ c: number }>();
  const pendingRow =
    await db.prepare("SELECT COUNT(*) AS c FROM user_comments WHERE status = 'pending'").first<{ c: number }>();
  const reportedRow =
    await db.prepare("SELECT COUNT(*) AS c FROM user_comments WHERE status = 'reported'").first<{ c: number }>();
  const approvedRow =
    await db.prepare("SELECT COUNT(*) AS c FROM user_comments WHERE status = 'approved'").first<{ c: number }>();

  return {
    total: totalRow?.c ?? 0,
    pending: pendingRow?.c ?? 0,
    reported: reportedRow?.c ?? 0,
    approved: approvedRow?.c ?? 0,
  };
}
