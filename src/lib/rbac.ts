export const ROLES = {
  CLIENT: "CLIENT",
  ADVISOR: "ADVISOR",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Klient:in",
  ADVISOR: "Lebensberater:in",
  ADMIN: "Administrator:in",
};

export function isRole(value: string): value is Role {
  return value === ROLES.CLIENT || value === ROLES.ADVISOR || value === ROLES.ADMIN;
}
