import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/env";

interface AccessTokenPayload {
  sub: string;
  role: string;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString("hex");
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(
    token,
    config.JWT_ACCESS_SECRET
  ) as jwt.JwtPayload & AccessTokenPayload;
  return { sub: decoded.sub, role: decoded.role };
};

export const getRefreshTokenExpiry = (): Date => {
  const raw = config.JWT_REFRESH_EXPIRES_IN;
  const match = raw.match(/^(\d+)([dhms])$/);
  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + value * (multipliers[unit] || 24 * 60 * 60 * 1000));
};
