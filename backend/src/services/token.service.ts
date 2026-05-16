import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./app-error.js";
import type { AuthenticatedUser, RefreshTokenPayload } from "../types/auth.js";

const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
};

const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
};

export function signAccessToken(user: AuthenticatedUser) {
  return jwt.sign({ ...user, type: "access" }, env.JWT_ACCESS_SECRET, accessTokenOptions);
}

export function signRefreshToken(userId: string, tokenId = randomUUID()) {
  const token = jwt.sign({ tokenId, userId, type: "refresh" }, env.JWT_REFRESH_SECRET, refreshTokenOptions);
  return {
    token,
    tokenId,
    expiresAt: getJwtExpiresAt(token)
  };
}

export function verifyAccessToken(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUser & { type?: string };

    if (payload.type !== "access") {
      throw new AppError("Invalid access token", 401, "INVALID_ACCESS_TOKEN");
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired access token", 401, "INVALID_ACCESS_TOKEN");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

    if (payload.type !== "refresh" || !payload.tokenId || !payload.userId) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
  }
}

export function hashToken(token: string) {
  return bcrypt.hash(token, env.BCRYPT_SALT_ROUNDS);
}

export function verifyTokenHash(token: string, tokenHash: string) {
  return bcrypt.compare(token, tokenHash);
}

function getJwtExpiresAt(token: string) {
  const decoded = jwt.decode(token) as JwtPayload | null;

  if (!decoded?.exp) {
    throw new AppError("Token expiry could not be calculated", 500, "TOKEN_EXPIRY_ERROR");
  }

  return new Date(decoded.exp * 1000);
}
