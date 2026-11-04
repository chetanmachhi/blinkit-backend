import {
  generateAccessToken as generateAccessTokenShared,
  generateRefreshToken as generateRefreshTokenShared,
  verifyAccessToken as verifyAccessTokenShared,
  getRefreshTokenExpiry as getRefreshTokenExpiryShared,
  AccessTokenPayload as SharedAccessTokenPayload,
} from "../../../shared";
import config from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return generateAccessTokenShared(
    payload,
    config.JWT_ACCESS_SECRET,
    config.JWT_ACCESS_EXPIRES_IN
  );
};

export const generateRefreshToken = (): string => {
  return generateRefreshTokenShared();
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = verifyAccessTokenShared(token, config.JWT_ACCESS_SECRET);
  return { sub: payload.sub, role: payload.role };
};

export const getRefreshTokenExpiry = (): Date => {
  return getRefreshTokenExpiryShared(config.JWT_REFRESH_EXPIRES_IN);
};
