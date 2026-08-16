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
