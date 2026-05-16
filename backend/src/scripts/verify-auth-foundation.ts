import { hashPassword, verifyPassword } from "../services/password.service.js";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../services/token.service.js";
import type { AuthenticatedUser } from "../types/auth.js";

const user: AuthenticatedUser = {
  id: "verify-user",
  email: "admin@sinsoftware.in",
  name: "SinSoftware Super Admin",
  role: "SUPER_ADMIN",
  companyId: null
};

const password = "local-verification-password";
const passwordHash = await hashPassword(password);
const passwordOk = await verifyPassword(password, passwordHash);

if (!passwordOk) {
  throw new Error("Password hashing verification failed.");
}

const accessToken = signAccessToken(user);
const accessPayload = verifyAccessToken(accessToken);

if (accessPayload.id !== user.id || accessPayload.type !== "access") {
  throw new Error("Access token verification failed.");
}

const refresh = signRefreshToken(user.id);
const refreshPayload = verifyRefreshToken(refresh.token);

if (refreshPayload.userId !== user.id || refreshPayload.tokenId !== refresh.tokenId) {
  throw new Error("Refresh token verification failed.");
}

console.log("Auth foundation verification passed.");
