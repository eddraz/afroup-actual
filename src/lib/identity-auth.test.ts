import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_USER_GRANTS } from "./identity-merge";
import {
  classifyLogin,
  permissionsFromRows,
  planCompletePasswordReset,
  planInvite,
  planRegister,
} from "./identity-auth";

describe("planRegister", () => {
  test("writes one users row with no role and only the two default grants", () => {
    const plan = planRegister({
      name: "Ada Lovelace",
      email: "ada@afroup.test",
      passwordHash: "hash-ada",
    });

    expect(plan.user).toEqual({
      name: "Ada Lovelace",
      email: "ada@afroup.test",
      passwordHash: "hash-ada",
      verifiedAt: null,
      roleId: null,
      invitePending: 0,
      isActive: 1,
      createdBy: null,
    });
    expect(plan.grants).toEqual(["users.read", "users.update"]);
    expect(plan.grants).toEqual([...DEFAULT_USER_GRANTS]);
    expect(plan.grants).not.toContain("users.create");
    expect(plan.grants).not.toContain("users.delete");
  });
});

describe("planInvite", () => {
  test("creates one invite-pending row for an unknown email and may attach role, extras, and created_by", () => {
    const plan = planInvite({
      existing: null,
      name: "Invited Person",
      email: "new@afroup.test",
      roleId: 4,
      extraGrantNames: ["roles.read"],
      createdBy: 11,
    });

    expect(plan.action).toBe("insert");
    expect(plan.createsSecondRow).toBe(false);
    expect(plan.user).toEqual({
      id: null,
      name: "Invited Person",
      email: "new@afroup.test",
      passwordHash: null,
      roleId: 4,
      invitePending: 1,
      createdBy: 11,
    });
    expect(plan.grantNames).toEqual(["users.read", "users.update", "roles.read"]);
  });

  test("upserts a registered person onto the same row and never deletes default grants", () => {
    const plan = planInvite({
      existing: {
        id: 7,
        name: "Ada Lovelace",
        email: "ada@afroup.test",
        passwordHash: "public-hash",
        roleId: null,
        invitePending: 0,
        createdBy: null,
        grantNames: ["users.read", "users.update"],
      },
      name: "Should Not Replace",
      email: "ada@afroup.test",
      roleId: 2,
      extraGrantNames: ["users.create", "modulos.read"],
      createdBy: 3,
    });

    expect(plan.action).toBe("attach-verified");
    expect(plan.createsSecondRow).toBe(false);
    expect(plan.user).toEqual({
      id: 7,
      name: "Ada Lovelace",
      email: "ada@afroup.test",
      passwordHash: "public-hash",
      roleId: 2,
      invitePending: 0,
      createdBy: 3,
    });
    expect(plan.grantNames).toEqual([
      "users.read",
      "users.update",
      "users.create",
      "modulos.read",
    ]);
    expect(plan.grantNames).toContain("users.read");
    expect(plan.grantNames).toContain("users.update");
  });

  test("refreshes an invite-pending row without creating a second user or dropping defaults", () => {
    const plan = planInvite({
      existing: {
        id: 9,
        name: "Old Name",
        email: "pending@afroup.test",
        passwordHash: null,
        roleId: null,
        invitePending: 1,
        createdBy: 1,
        grantNames: ["roles.read"],
      },
      name: "New Name",
      email: "pending@afroup.test",
      roleId: 5,
      extraGrantNames: ["roles.update"],
      createdBy: 2,
    });

    expect(plan.action).toBe("update-pending");
    expect(plan.createsSecondRow).toBe(false);
    expect(plan.user).toEqual({
      id: 9,
      name: "New Name",
      email: "pending@afroup.test",
      passwordHash: null,
      roleId: 5,
      invitePending: 1,
      createdBy: 2,
    });
    expect(plan.grantNames).toEqual([
      "roles.read",
      "users.read",
      "users.update",
      "roles.update",
    ]);
  });
});

describe("classifyLogin", () => {
  test("rejects in order: missing, invalid, pending, inactive, unverified",
    () => {
      expect(classifyLogin({ email: "", password: "secret" })).toBe("missing_fields");
      expect(classifyLogin({ email: "a@afroup.test", password: "" })).toBe("missing_fields");
      expect(
        classifyLogin({
          email: "missing@afroup.test",
          password: "secret",
          user: null,
        }),
      ).toBe("invalid_credentials");
      expect(
        classifyLogin({
          email: "a@afroup.test",
          password: "wrong",
          user: {
            passwordOk: false,
            invitePending: 1,
            isActive: 0,
            verifiedAt: null,
          },
        }),
      ).toBe("invalid_credentials");
      expect(
        classifyLogin({
          email: "a@afroup.test",
          password: "secret",
          user: {
            passwordOk: true,
            invitePending: 1,
            isActive: 0,
            verifiedAt: null,
          },
        }),
      ).toBe("account_pending");
      expect(
        classifyLogin({
          email: "a@afroup.test",
          password: "secret",
          user: {
            passwordOk: true,
            invitePending: 0,
            isActive: 0,
            verifiedAt: null,
          },
        }),
      ).toBe("account_inactive");
      expect(
        classifyLogin({
          email: "a@afroup.test",
          password: "secret",
          user: {
            passwordOk: true,
            invitePending: 0,
            isActive: 1,
            verifiedAt: null,
          },
        }),
      ).toBe("unverified");
      expect(
        classifyLogin({
          email: "a@afroup.test",
          password: "secret",
          user: {
            passwordOk: true,
            invitePending: 0,
            isActive: 1,
            verifiedAt: "2026-03-01T00:00:00Z",
          },
        }),
      ).toBe("ok");
    },
  );
});

describe("permissionsFromRows", () => {
  test("maps slug to unique actions without an admin boolean",
    () => {
      const payload = permissionsFromRows([
        { module_slug: "users", action: "read" },
        { module_slug: "users", action: "update" },
        { module_slug: "users", action: "read" },
        { module_slug: "roles", action: "read" },
      ]);
      expect(payload).toEqual({
        users: ["read", "update"],
        roles: ["read"],
      });
      expect(payload).not.toHaveProperty("admin");
    },
  );
});

describe("auth helpers join users, not the old identity tables", () => {
  test("session lookup and getCurrentUser no longer email-join admin_users",
    () => {
      const publicSession = readFileSync(
        resolve(import.meta.dir, "./public-session.ts"),
        "utf8",
      );
      const adminScope = readFileSync(
        resolve(import.meta.dir, "./admin-scope.ts"),
        "utf8",
      );
      const userBios = readFileSync(resolve(import.meta.dir, "./user-bios.ts"), "utf8");

      expect(publicSession).toContain("JOIN users u ON u.id = s.user_id");
      expect(publicSession).not.toContain("JOIN afroup_users");
      expect(publicSession).not.toContain("function getAdminUserByEmail");
      expect(publicSession).not.toContain("FROM admin_users");
      expect(publicSession).toContain('PUBLIC_SESSION_COOKIE = "afroup_session"');

      expect(adminScope).toContain("export async function getCurrentUser");
      expect(adminScope).toMatch(/FROM users[\s\S]*is_active = 1[\s\S]*invite_pending = 0/);
      expect(adminScope).not.toMatch(/getCurrentAdmin[\s\S]*FROM admin_users[\s\S]*email = \?/);

      expect(userBios).not.toContain("getAdminUserByEmail");
      expect(userBios).toContain("UPDATE users SET bio");
    },
  );
});

describe("planCompletePasswordReset", () => {
  test("verifies the account and clears invite_pending so login can succeed", () => {
    const plan = planCompletePasswordReset("2026-08-20T19:00:00.000Z");
    expect(plan.verifiedAt).toBe("2026-08-20T19:00:00.000Z");
    expect(plan.invitePending).toBe(0);
  });
});
