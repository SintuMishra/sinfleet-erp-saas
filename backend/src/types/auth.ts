import type { Role } from "../constants/roles.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId?: string | null;
};

export type RefreshTokenPayload = {
  tokenId: string;
  userId: string;
  type: "refresh";
  iat?: number;
  exp?: number;
};
