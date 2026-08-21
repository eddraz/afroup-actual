import { DEFAULT_USER_GRANTS } from "./identity-merge";

export interface RegisterInput {
  name: string;
  email: string;
  passwordHash: string;
}

export interface RegisterPlan {
  user: {
    name: string;
    email: string;
    passwordHash: string;
    verifiedAt: null;
    roleId: null;
    invitePending: 0;
    isActive: 1;
    createdBy: null;
  };
  grants: Array<(typeof DEFAULT_USER_GRANTS)[number]>;
}

export interface ExistingInviteUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string | null;
  roleId: number | null;
  invitePending: 0 | 1;
  createdBy: number | null;
  grantNames: string[];
}

export interface InviteInput {
  existing: ExistingInviteUser | null;
  name: string;
  email: string;
  roleId: number | null;
  extraGrantNames: string[];
  createdBy: number | null;
}

export interface InvitePlan {
  action: "insert" | "update-pending" | "attach-verified";
  createsSecondRow: false;
  user: {
    id: number | null;
    name: string;
    email: string;
    passwordHash: string | null;
    roleId: number | null;
    invitePending: 0 | 1;
    createdBy: number | null;
  };
  grantNames: string[];
}

function mergeGrantNames(existing: string[], extras: string[]): string[] {
  const names: string[] = [];
  for (const name of [...existing, ...DEFAULT_USER_GRANTS, ...extras]) {
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

export function planRegister(input: RegisterInput): RegisterPlan {
  return {
    user: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      verifiedAt: null,
      roleId: null,
      invitePending: 0,
      isActive: 1,
      createdBy: null,
    },
    grants: [...DEFAULT_USER_GRANTS],
  };
}

export type LoginReject =
  | "missing_fields"
  | "invalid_credentials"
  | "account_pending"
  | "account_inactive"
  | "unverified"
  | "ok";

export interface LoginUserState {
  passwordOk: boolean;
  invitePending: 0 | 1;
  isActive: 0 | 1;
  verifiedAt: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
  user?: LoginUserState | null;
}

export function classifyLogin(input: LoginInput): LoginReject {
  if (!input.email || !input.password) return "missing_fields";
  if (!input.user || !input.user.passwordOk) return "invalid_credentials";
  if (input.user.invitePending === 1) return "account_pending";
  if (input.user.isActive === 0) return "account_inactive";
  if (!input.user.verifiedAt) return "unverified";
  return "ok";
}

export function permissionsFromRows(
  rows: Array<{ module_slug: string; action: string }>,
): Record<string, string[]> {
  const permissions: Record<string, string[]> = {};
  for (const row of rows) {
    const actions = permissions[row.module_slug] ?? [];
    if (!actions.includes(row.action)) actions.push(row.action);
    permissions[row.module_slug] = actions;
  }
  return permissions;
}

export function permissionsFromNamedRows(
  rows: Array<{ name: string; action: string }>,
): Record<string, string[]> {
  return permissionsFromRows(
    rows.map((row) => {
      const colon = row.name.lastIndexOf(":");
      return {
        module_slug: colon === -1 ? row.name : row.name.slice(0, colon),
        action: row.action,
      };
    }),
  );
}

export function planCompletePasswordReset(now: string): {
  verifiedAt: string;
  invitePending: 0;
} {
  return {
    verifiedAt: now,
    invitePending: 0,
  };
}

export function planInvite(input: InviteInput): InvitePlan {
  if (!input.existing) {
    return {
      action: "insert",
      createsSecondRow: false,
      user: {
        id: null,
        name: input.name,
        email: input.email,
        passwordHash: null,
        roleId: input.roleId,
        invitePending: 1,
        createdBy: input.createdBy,
      },
      grantNames: mergeGrantNames([], input.extraGrantNames),
    };
  }

  if (input.existing.invitePending === 1) {
    return {
      action: "update-pending",
      createsSecondRow: false,
      user: {
        id: input.existing.id,
        name: input.name,
        email: input.existing.email,
        passwordHash: input.existing.passwordHash,
        roleId: input.roleId,
        invitePending: 1,
        createdBy: input.createdBy,
      },
      grantNames: mergeGrantNames(input.existing.grantNames, input.extraGrantNames),
    };
  }

  return {
    action: "attach-verified",
    createsSecondRow: false,
    user: {
      id: input.existing.id,
      name: input.existing.name,
      email: input.existing.email,
      passwordHash: input.existing.passwordHash,
      roleId: input.roleId,
      invitePending: 0,
      createdBy: input.existing.createdBy ?? input.createdBy,
    },
    grantNames: mergeGrantNames(input.existing.grantNames, input.extraGrantNames),
  };
}
