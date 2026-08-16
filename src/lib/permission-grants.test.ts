import { describe, expect, test } from "bun:test";
import { parsePermissionGrants } from "./permission-grants";

describe("parsePermissionGrants", () => {
  test("permissionIds create a grant without parent", () => {
    const form = new FormData();
    form.append("permissionIds", "4");
    expect(parsePermissionGrants(form)).toEqual([
      {
        permissionId: 4,
        parent: false,
        quota: null,
        translateManual: false,
        translateAi: false,
      },
    ]);
  });

  test("legacy parentIds do not create a grant", () => {
    const form = new FormData();
    form.append("parentIds", "4");
    expect(parsePermissionGrants(form)).toEqual([]);
  });

  test("quota and translation attach to an allowed permission", () => {
    const form = new FormData();
    form.append("permissionIds", "7");
    form.append("quota-7", "3");
    form.append("translateManualIds", "7");
    form.append("translateAiIds", "7");
    expect(parsePermissionGrants(form)).toEqual([
      {
        permissionId: 7,
        parent: false,
        quota: 3,
        translateManual: true,
        translateAi: true,
      },
    ]);
  });
});
