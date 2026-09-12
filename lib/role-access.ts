export type AppRole = "member" | "boat" | "weighmaster" | "admin";

export const ROLE_CAPABILITIES = [
  {
    capability: "View member season and published results",
    member: true,
    boat: true,
    weighmaster: true,
    admin: true,
  },
  {
    capability: "Enter and review catches",
    member: false,
    boat: false,
    weighmaster: true,
    admin: true,
  },
  {
    capability: "Run scoring audits and exports",
    member: false,
    boat: false,
    weighmaster: true,
    admin: true,
  },
  {
    capability: "Manage roles, schedules, and season closeout",
    member: false,
    boat: false,
    weighmaster: false,
    admin: true,
  },
] as const;

export function isRoleAuthorized(
  currentRole: AppRole | null,
  requiredRole: AppRole,
) {
  if (!currentRole) return false;
  if (currentRole === "admin") return true;

  return currentRole === requiredRole;
}

export function canRunCompetitionOperations(role: AppRole | null) {
  return role === "weighmaster" || role === "admin";
}
