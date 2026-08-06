// Permission keys this module contributes to the RBAC system. CTM's
// license-service reads these to know what to grant/revoke per role.
export const loginPermissions = {
  LOGIN_ACCESS: "auth.login.access",
} as const;
