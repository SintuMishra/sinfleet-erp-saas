import { prisma } from "../../config/prisma.js";
import { AppError } from "../../services/app-error.js";
import { verifyPassword } from "../../services/password.service.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyTokenHash
} from "../../services/token.service.js";
import type { AuthenticatedUser } from "../../types/auth.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      companyId: true,
      isActive: true
    }
  });

  if (!user?.isActive) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  return createSession(toAuthenticatedUser(user));
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const persistedToken = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
          isActive: true
        }
      }
    }
  });

  if (!persistedToken || persistedToken.revokedAt || persistedToken.expiresAt <= new Date()) {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  const tokenMatches = await verifyTokenHash(refreshToken, persistedToken.tokenHash);

  if (!tokenMatches || !persistedToken.user.isActive) {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  await prisma.refreshToken.update({
    where: { id: persistedToken.id },
    data: { revokedAt: new Date() }
  });

  return createSession(toAuthenticatedUser(persistedToken.user));
}

export async function logout(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      id: payload.tokenId,
      userId: payload.userId,
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });

  return {
    revoked: true
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      companyId: true,
      isActive: true,
      company: {
        select: {
          id: true,
          companyName: true,
          companyCode: true,
          status: true
        }
      }
    }
  });

  if (!user?.isActive) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return user;
}

async function createSession(user: AuthenticatedUser) {
  const accessToken = signAccessToken(user);
  const refresh = signRefreshToken(user.id);
  const tokenHash = await hashToken(refresh.token);

  await prisma.refreshToken.create({
    data: {
      id: refresh.tokenId,
      userId: user.id,
      tokenHash,
      expiresAt: refresh.expiresAt
    }
  });

  return {
    user,
    accessToken,
    refreshToken: refresh.token,
    tokenType: "Bearer"
  };
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  name: string;
  role: AuthenticatedUser["role"];
  companyId?: string | null;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId ?? null
  };
}
