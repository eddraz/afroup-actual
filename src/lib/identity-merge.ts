export const DEFAULT_USER_GRANTS = ["users.read", "users.update"] as const;

export interface PublicIdentity {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  verifiedAt: string | null;
}

export interface AdminIdentity {
  id: number;
  email: string;
  name: string;
  passwordHash: string | null;
  roleId: number | null;
  isActive: 0 | 1;
  invitePending: 0 | 1;
  createdBy: number | null;
}

export interface MergedUser {
  id: number;
  email: string;
  name: string;
  passwordHash: string | null;
  verifiedAt: string | null;
  roleId: number | null;
  isActive: 0 | 1;
  invitePending: 0 | 1;
  createdBy: number | null;
}

export interface AdminIdMapEntry {
  adminId: number;
  userId: number;
}

export interface DefaultGrant {
  userId: number;
  names: Array<(typeof DEFAULT_USER_GRANTS)[number]>;
}

export interface ParentGrant {
  childId: number;
  parentId: number;
  action: string;
}

export interface DroppedEdge {
  kind: "created_by" | "parent_grant";
  fromAdminId: number;
  missingAdminId: number;
}

export interface MergeInput {
  publicUsers: PublicIdentity[];
  adminUsers: AdminIdentity[];
  parentGrants?: ParentGrant[];
}

export interface MergeResult {
  users: MergedUser[];
  adminIdMap: AdminIdMapEntry[];
  defaultGrants: DefaultGrant[];
  remappedParentGrants: ParentGrant[];
  droppedEdges: DroppedEdge[];
  adminUsersInsertedAsUnmapped: number[];
}

function maxId(values: Iterable<number>): number {
  let max = 0;
  for (const id of values) {
    if (id > max) max = id;
  }
  return max;
}

function remapCreatedBy(
  users: Map<number, MergedUser>,
  pending: Array<{ userId: number; fromAdminId: number; rawCreatedBy: number | null }>,
  adminIdToUserId: Map<number, number>,
): DroppedEdge[] {
  const dropped: DroppedEdge[] = [];

  for (const edge of pending) {
    const user = users.get(edge.userId);
    if (!user || edge.rawCreatedBy == null) continue;

    const mapped = adminIdToUserId.get(edge.rawCreatedBy);
    if (!mapped) {
      user.createdBy = null;
      dropped.push({
        kind: "created_by",
        fromAdminId: edge.fromAdminId,
        missingAdminId: edge.rawCreatedBy,
      });
      continue;
    }

    user.createdBy = mapped;
  }

  return dropped;
}

function remapParentGrants(
  parentGrants: ParentGrant[],
  adminIdToUserId: Map<number, number>,
): { remapped: ParentGrant[]; dropped: DroppedEdge[] } {
  const remapped: ParentGrant[] = [];
  const dropped: DroppedEdge[] = [];

  for (const grant of parentGrants) {
    const childId = adminIdToUserId.get(grant.childId);
    const parentId = adminIdToUserId.get(grant.parentId);

    if (!childId) {
      dropped.push({
        kind: "parent_grant",
        fromAdminId: grant.childId,
        missingAdminId: grant.childId,
      });
      continue;
    }

    if (!parentId || parentId === childId) {
      dropped.push({
        kind: "parent_grant",
        fromAdminId: grant.childId,
        missingAdminId: grant.parentId,
      });
      continue;
    }

    remapped.push({ childId, parentId, action: grant.action });
  }

  return { remapped, dropped };
}

export function mergeIdentities(input: MergeInput): MergeResult {
  const users = new Map<number, MergedUser>();
  const usersByEmail = new Map<string, MergedUser>();
  const adminIdMap: AdminIdMapEntry[] = [];
  const pendingCreatedBy: Array<{
    userId: number;
    fromAdminId: number;
    rawCreatedBy: number | null;
  }> = [];

  for (const publicUser of input.publicUsers) {
    const row: MergedUser = {
      id: publicUser.id,
      email: publicUser.email,
      name: publicUser.name,
      passwordHash: publicUser.passwordHash,
      verifiedAt: publicUser.verifiedAt,
      roleId: null,
      isActive: 1,
      invitePending: 0,
      createdBy: null,
    };
    users.set(row.id, row);
    usersByEmail.set(row.email, row);
  }

  const publicEmails = new Set(input.publicUsers.map((publicUser) => publicUser.email));
  const inviteOnlyAdmins = input.adminUsers
    .filter((adminUser) => !publicEmails.has(adminUser.email))
    .slice()
    .sort((left, right) => left.id - right.id);
  const idCeiling = maxId([
    ...users.keys(),
    ...input.adminUsers.map((adminUser) => adminUser.id),
  ]);
  const inviteOnlyUserId = new Map(
    inviteOnlyAdmins.map((adminUser, index) => [adminUser.id, idCeiling + index + 1]),
  );

  for (const adminUser of input.adminUsers) {
    const existing = usersByEmail.get(adminUser.email);
    if (existing) {
      existing.roleId = adminUser.roleId;
      existing.isActive = adminUser.isActive;
      existing.invitePending = existing.verifiedAt ? 0 : adminUser.invitePending;
      adminIdMap.push({ adminId: adminUser.id, userId: existing.id });
      pendingCreatedBy.push({
        userId: existing.id,
        fromAdminId: adminUser.id,
        rawCreatedBy: adminUser.createdBy,
      });
      continue;
    }

    const userId = inviteOnlyUserId.get(adminUser.id);
    if (userId == null) continue;
    const row: MergedUser = {
      id: userId,
      email: adminUser.email,
      name: adminUser.name,
      passwordHash: adminUser.passwordHash,
      verifiedAt: null,
      roleId: adminUser.roleId,
      isActive: adminUser.isActive,
      invitePending: adminUser.invitePending,
      createdBy: null,
    };
    users.set(row.id, row);
    usersByEmail.set(row.email, row);
    adminIdMap.push({ adminId: adminUser.id, userId });
    pendingCreatedBy.push({
      userId,
      fromAdminId: adminUser.id,
      rawCreatedBy: adminUser.createdBy,
    });
  }

  const adminIdToUserId = new Map(adminIdMap.map((entry) => [entry.adminId, entry.userId]));
  const createdByDropped = remapCreatedBy(users, pendingCreatedBy, adminIdToUserId);
  const parentResult = remapParentGrants(input.parentGrants ?? [], adminIdToUserId);
  const publicIds = new Set(input.publicUsers.map((publicUser) => publicUser.id));
  const adminUsersInsertedAsUnmapped = input.adminUsers
    .filter((adminUser) => users.has(adminUser.id) && !publicIds.has(adminUser.id))
    .map((adminUser) => adminUser.id);

  const mergedUsers = Array.from(users.values());
  return {
    users: mergedUsers,
    adminIdMap,
    defaultGrants: mergedUsers.map((user) => ({
      userId: user.id,
      names: [...DEFAULT_USER_GRANTS],
    })),
    remappedParentGrants: parentResult.remapped,
    droppedEdges: [...createdByDropped, ...parentResult.dropped],
    adminUsersInsertedAsUnmapped,
  };
}
