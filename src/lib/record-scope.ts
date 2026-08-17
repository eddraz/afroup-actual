import type { D1Database } from "@cloudflare/workers-types";

export interface RecordScopeInput {
  actorId: number;
  ownedIds: number[];
  sharedIds: number[];
  creatorId?: number | null;
}

export function visibleRecordIds(input: RecordScopeInput): number[] {
  const ids = new Set<number>([input.actorId, ...input.ownedIds, ...input.sharedIds]);
  return Array.from(ids).sort((left, right) => left - right);
}

export async function hasSharedRecord(
  db: D1Database,
  actorId: number,
  moduleSlug: string,
  recordId: number,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 FROM record_shares
        WHERE module_slug = ? AND record_id = ? AND shared_with_id = ?
        LIMIT 1`,
    )
    .bind(moduleSlug, recordId, actorId)
    .first();
  return row !== null;
}
