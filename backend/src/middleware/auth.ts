import { prisma } from "../config/prisma.js";
import { AppError } from "../services/app-error.js";
import { verifyAccessToken } from "../services/token.service.js";
import { asyncHandler } from "./async-handler.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  const token = authHeader.slice("Bearer ".length);
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
      isActive: true
    }
  });

  if (!user?.isActive) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId
  };
  req.companyId = user.companyId;
  next();
});
