import type { D1Database } from "@cloudflare/workers-types";

const DEFAULT_LOCALE = "es";

export type SearchModuleSlug = "categorias" | "articulos" | "recursos";

export interface SearchDocumentInput {
  moduleSlug: SearchModuleSlug;
  recordId: number;
  locale: string;
  title: string;
  description: string;
  kind: string;
  path: string;
  published: boolean;
  tags?: string[];
  extra?: string | null;
}

export interface SearchDocument {
  moduleSlug: SearchModuleSlug;
  recordId: number;
  locale: string;
  title: string;
  summary: string;
  tags: string;
  kind: string;
  path: string;
  extra: string | null;
}

export type SearchDocumentPlan =
  | { action: "upsert"; document: SearchDocument }
  | { action: "delete"; moduleSlug: SearchModuleSlug; recordId: number; locale: string };

function clean(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function searchDocumentPath(locale: string, rest: string): string {
  const path = rest.replace(/^\/+/, "");
  if (!locale || locale === DEFAULT_LOCALE) return `/${path}`;
  return `/${locale}/${path}`;
}

export function planSearchDocument(input: SearchDocumentInput): SearchDocumentPlan {
  const title = clean(input.title);
  const summary = clean(input.description);
  const labelTags = (input.tags ?? []).map(clean).filter(Boolean);
  if (!input.published || !title) {
    return {
      action: "delete",
      moduleSlug: input.moduleSlug,
      recordId: input.recordId,
      locale: input.locale,
    };
  }
  return {
    action: "upsert",
    document: {
      moduleSlug: input.moduleSlug,
      recordId: input.recordId,
      locale: input.locale,
      title,
      summary,
      tags: [title, summary, ...labelTags].filter(Boolean).join(" "),
      kind: clean(input.kind),
      path: input.path,
      extra: input.extra ?? null,
    },
  };
}

export async function applySearchDocument(db: D1Database, input: SearchDocumentInput): Promise<void> {
  const plan = planSearchDocument(input);
  if (plan.action === "delete") {
    await db
      .prepare(
        `DELETE FROM search_documents
          WHERE module_slug = ? AND record_id = ? AND locale = ?`,
      )
      .bind(plan.moduleSlug, plan.recordId, plan.locale)
      .run();
    return;
  }
  const doc = plan.document;
  await db
    .prepare(
      `INSERT INTO search_documents
         (module_slug, record_id, locale, title, summary, tags, kind, path, extra, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(module_slug, record_id, locale) DO UPDATE SET
         title = excluded.title,
         summary = excluded.summary,
         tags = excluded.tags,
         kind = excluded.kind,
         path = excluded.path,
         extra = excluded.extra,
         published_at = excluded.published_at`,
    )
    .bind(
      doc.moduleSlug,
      doc.recordId,
      doc.locale,
      doc.title,
      doc.summary,
      doc.tags,
      doc.kind,
      doc.path,
      doc.extra,
    )
    .run();
}

export async function removeSearchDocuments(
  db: D1Database,
  moduleSlug: SearchModuleSlug,
  recordId: number,
): Promise<void> {
  await db
    .prepare("DELETE FROM search_documents WHERE module_slug = ? AND record_id = ?")
    .bind(moduleSlug, recordId)
    .run();
}
