import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_USER_GRANTS,
  mergeIdentities,
  type AdminIdentity,
  type PublicIdentity,
} from "./identity-merge";

const publicUser = (
  overrides: Partial<PublicIdentity> & Pick<PublicIdentity, "id" | "email">,
): PublicIdentity => ({
  name: `Public ${overrides.id}`,
  passwordHash: `public-hash-${overrides.id}`,
  verifiedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const adminUser = (
  overrides: Partial<AdminIdentity> & Pick<AdminIdentity, "id" | "email">,
): AdminIdentity => ({
  name: `Admin ${overrides.id}`,
  passwordHash: `admin-hash-${overrides.id}`,
  roleId: 2,
  isActive: 1,
  invitePending: 0,
  createdBy: null,
  ...overrides,
});

describe("mergeIdentities", () => {
  test("preserves every public id as users.id", () => {
    const result = mergeIdentities({
      publicUsers: [
        publicUser({ id: 4, email: "keep@afroup.test" }),
        publicUser({ id: 12, email: "also@afroup.test" }),
      ],
      adminUsers: [],
    });

    expect(result.users.map((user) => user.id).sort((a, b) => a - b)).toEqual([4, 12]);
    expect(result.users.find((user) => user.email === "keep@afroup.test")?.id).toBe(4);
  });

  test("assigns a new users.id when an invite-only admin id collides with a public id", () => {
    const result = mergeIdentities({
      publicUsers: [publicUser({ id: 5, email: "public@afroup.test" })],
      adminUsers: [adminUser({ id: 5, email: "admin@afroup.test" })],
    });

    const publicRow = result.users.find((user) => user.email === "public@afroup.test");
    const adminRow = result.users.find((user) => user.email === "admin@afroup.test");

    expect(publicRow?.id).toBe(5);
    expect(adminRow?.id).not.toBe(5);
    expect(adminRow?.id).toBeGreaterThan(5);
    expect(result.adminIdMap).toEqual([{ adminId: 5, userId: adminRow?.id ?? -1 }]);
  });

  test("keeps the public password hash when emails match", () => {
    const result = mergeIdentities({
      publicUsers: [
        publicUser({
          id: 1,
          email: "both@afroup.test",
          passwordHash: "public-secret",
          name: "Public Name",
        }),
      ],
      adminUsers: [
        adminUser({
          id: 99,
          email: "both@afroup.test",
          passwordHash: "admin-secret",
          name: "Admin Name",
          roleId: 3,
          isActive: 0,
          invitePending: 1,
        }),
      ],
    });

    expect(result.users).toHaveLength(1);
    expect(result.users[0]).toMatchObject({
      id: 1,
      email: "both@afroup.test",
      passwordHash: "public-secret",
      roleId: 3,
      isActive: 0,
    });
    expect(result.adminIdMap).toEqual([{ adminId: 99, userId: 1 }]);
  });

  test("keeps the admin password hash for invite-only people", () => {
    const result = mergeIdentities({
      publicUsers: [publicUser({ id: 1, email: "public@afroup.test" })],
      adminUsers: [
        adminUser({
          id: 8,
          email: "invite@afroup.test",
          passwordHash: "invite-secret",
        }),
      ],
    });

    const invite = result.users.find((user) => user.email === "invite@afroup.test");
    expect(invite?.passwordHash).toBe("invite-secret");
    expect(invite?.id).not.toBe(8);
    expect(result.adminIdMap).toEqual([{ adminId: 8, userId: invite?.id ?? -1 }]);
  });

  test("forces invite_pending = 0 when the public row is already verified", () => {
    const result = mergeIdentities({
      publicUsers: [
        publicUser({
          id: 2,
          email: "verified@afroup.test",
          verifiedAt: "2026-02-02T00:00:00Z",
        }),
      ],
      adminUsers: [
        adminUser({
          id: 20,
          email: "verified@afroup.test",
          invitePending: 1,
        }),
      ],
    });

    expect(result.users).toHaveLength(1);
    expect(result.users[0]?.invitePending).toBe(0);
    expect(result.users[0]?.verifiedAt).toBe("2026-02-02T00:00:00Z");
  });

  test("default grants are exactly users.read and users.update for every person", () => {
    const result = mergeIdentities({
      publicUsers: [publicUser({ id: 1, email: "a@afroup.test" })],
      adminUsers: [adminUser({ id: 9, email: "b@afroup.test" })],
    });

    expect(DEFAULT_USER_GRANTS).toEqual(["users.read", "users.update"]);
    expect(result.users).toHaveLength(2);
    expect(result.defaultGrants).toEqual(
      result.users.map((user) => ({
        userId: user.id,
        names: ["users.read", "users.update"],
      })),
    );
    for (const grant of result.defaultGrants) {
      expect(grant.names).toEqual(["users.read", "users.update"]);
      expect(grant.names).not.toContain("users.create");
      expect(grant.names).not.toContain("users.delete");
    }
  });

  test("drops created_by and parent-grant edges whose map key is missing", () => {
    const result = mergeIdentities({
      publicUsers: [publicUser({ id: 1, email: "public@afroup.test" })],
      adminUsers: [
        adminUser({
          id: 10,
          email: "child@afroup.test",
          createdBy: 404,
        }),
      ],
      parentGrants: [
        { childId: 10, parentId: 404, action: "read" },
        { childId: 10, parentId: 10, action: "update" },
      ],
    });

    const child = result.users.find((user) => user.email === "child@afroup.test");
    expect(child?.createdBy).toBeNull();
    expect(result.remappedParentGrants).toEqual([]);
    expect(result.droppedEdges).toEqual([
      { kind: "created_by", fromAdminId: 10, missingAdminId: 404 },
      { kind: "parent_grant", fromAdminId: 10, missingAdminId: 404 },
      { kind: "parent_grant", fromAdminId: 10, missingAdminId: 10 },
    ]);
  });

  test("never inserts an unmapped admin id as users.id", () => {
    const result = mergeIdentities({
      publicUsers: [
        publicUser({ id: 3, email: "keep@afroup.test" }),
        publicUser({ id: 7, email: "other@afroup.test" }),
      ],
      adminUsers: [
        adminUser({ id: 3, email: "invite-a@afroup.test" }),
        adminUser({ id: 7, email: "invite-b@afroup.test" }),
        adminUser({
          id: 11,
          email: "child@afroup.test",
          createdBy: 3,
        }),
      ],
      parentGrants: [{ childId: 11, parentId: 3, action: "read" }],
    });

    const usedIds = result.users.map((user) => user.id);
    const mappedUserIds = result.adminIdMap.map((entry) => entry.userId);
    const leftoverAdminIds = result.adminUsersInsertedAsUnmapped;

    expect(new Set(usedIds).size).toBe(usedIds.length);
    expect(usedIds).toContain(3);
    expect(usedIds).toContain(7);
    expect(usedIds).not.toContain(11);
    expect(result.adminIdMap.map((entry) => entry.adminId).sort((a, b) => a - b)).toEqual([
      3, 7, 11,
    ]);
    expect(mappedUserIds).not.toContain(3);
    expect(mappedUserIds).not.toContain(7);
    expect(mappedUserIds).not.toContain(11);
    expect(leftoverAdminIds).toEqual([]);

    const child = result.users.find((user) => user.email === "child@afroup.test");
    const parent = result.users.find((user) => user.email === "invite-a@afroup.test");
    expect(child?.createdBy).toBe(parent?.id);
    expect(result.remappedParentGrants).toEqual([
      { childId: child?.id, parentId: parent?.id, action: "read" },
    ]);
  });
});

describe("0020 SQL matches merge helper rules", () => {
  const sql = readFileSync(
    resolve(import.meta.dir, "../../migrations/0020_unified_users.sql"),
    "utf8",
  );

  test("rebuilds users with public ids preserved and admin ids mapped", () => {
    expect(sql).toContain("PRAGMA foreign_keys = OFF");
    expect(sql).toContain("PRAGMA foreign_keys = ON");
    expect(sql).toContain("CREATE TABLE users (");
    expect(sql).toContain("CREATE TABLE admin_id_map (");
    expect(sql).toMatch(/INSERT INTO users[\s\S]*SELECT[\s\S]*FROM afroup_users/);
    expect(sql).toMatch(/INSERT INTO admin_id_map[\s\S]*JOIN afroup_users/);
    expect(sql).toMatch(/INSERT INTO users[\s\S]*FROM admin_users[\s\S]*NOT EXISTS/);
    expect(sql).toContain("DROP TABLE admin_id_map");
    expect(sql).toContain("DROP TABLE afroup_users");
    expect(sql).toContain("DROP TABLE admin_users");
    expect(sql).not.toContain("DROP TABLE admin_sessions");
    expect(sql).not.toContain("DROP TABLE admin_credentials");
    expect(sql).toContain("ALTER TABLE afroup_sessions_new RENAME TO afroup_sessions");
    expect(sql).not.toMatch(/cookie/i);
  });

  test("keeps public hashes, forces verified pending off, and remaps admin FKs", () => {
    expect(sql).toMatch(/password_hash = afroup_users\.password_hash/);
    expect(sql).toMatch(/invite_pending = CASE[\s\S]*afroup_users\.verified_at[\s\S]*IS NOT NULL THEN 0/);
    expect(sql).toMatch(/admin_user_permissions[\s\S]*admin_id_map/);
    expect(sql).toMatch(/admin_user_invitations[\s\S]*admin_id_map/);
    expect(sql).toMatch(/admin_parent_grants[\s\S]*admin_id_map/);
    expect(sql).toMatch(/UPDATE users[\s\S]*created_by[\s\S]*admin_id_map/);
    expect(sql).toMatch(/DELETE FROM admin_parent_grants[\s\S]*admin_id_map/);
    expect(sql).toMatch(/created_by = NULL[\s\S]*admin_id_map/);
    expect(sql).toContain("REFERENCES users(id)");
  });

  test("renames slug A1, seeds default grants, and advances sqlite_sequence", () => {
    expect(sql).toMatch(/SET slug = 'users'[\s\S]*WHERE slug = 'usuarios'/);
    expect(sql).toMatch(/SET name = 'users:' \|\| action/);
    expect(sql).toMatch(/name = 'Usuarios'|WHERE name = 'Usuarios'/);
    expect(sql).toMatch(/INSERT OR IGNORE INTO admin_user_permissions[\s\S]*users\.read|users:read/);
    expect(sql).toMatch(/INSERT OR IGNORE INTO admin_user_permissions[\s\S]*users\.update|users:update/);
    expect(sql).toMatch(/sqlite_sequence[\s\S]*MAX\(id\)/);
  });
});
