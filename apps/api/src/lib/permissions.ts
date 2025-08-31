import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  product: ["create", "view", "update", "delete"],
  color: ["create", "view", "update", "delete"],
  size: ["create", "view", "update", "delete"],
  category: ["create", "view", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  product: ["view"],
  color: ["view"],
  size: ["view"],
  category: ["view"],
});

export const admin = ac.newRole({
  user: ["list", "ban", "impersonate", "delete", "set-password", "update"],
  session: adminAc.statements.session,
  product: ["create", "view", "update", "delete"],
  color: ["create", "view", "update", "delete"],
  size: ["create", "view", "update", "delete"],
  category: ["create", "view", "update", "delete"],
});

export const superadmin = ac.newRole({
  user: adminAc.statements.user,
  session: adminAc.statements.session,
  product: ["create", "view", "update", "delete"],
  color: ["create", "view", "update", "delete"],
  size: ["create", "view", "update", "delete"],
  category: ["create", "view", "update", "delete"],
});
