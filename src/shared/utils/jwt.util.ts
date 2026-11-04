import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface AccessTokenPayload {
  sub: string;
  role: string;
  storeRole?: string;
  [key: string]: any;
}

export const generateAccessToken = (
  payload: AccessTokenPayload,
  secret: string,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, {
    expiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString("hex");
};

export const verifyAccessToken = (
  token: string,
  secret: string
): AccessTokenPayload => {
  const decoded = jwt.verify(
    token,
    secret
  ) as jwt.JwtPayload & AccessTokenPayload;
  return {
    sub: decoded.sub,
    role: decoded.role,
    storeRole: decoded.storeRole,
  };
};

export const getRefreshTokenExpiry = (
  expiresInStr: string = "30d"
): Date => {
  const match = expiresInStr.match(/^(\d+)([dhms])$/);
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
  return new Date(
    Date.now() + value * (multipliers[unit] || 24 * 60 * 60 * 1000)
  );
};
