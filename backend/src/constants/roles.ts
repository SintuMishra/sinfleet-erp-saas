export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  DRIVER: "DRIVER",
  USER: "USER"
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
