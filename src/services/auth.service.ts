import { User } from "../models/user.model";
import { verifyOtp as verifyOtpCode } from "./otp.service";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/jwt.util";
import { hashPassword, comparePassword, hashSha256 } from "../utils/hash.util";
import { AppError } from "../utils/AppError";
import { Role } from "../constants/enums";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface LoginResult {
  user: Record<string, any>;
  accessToken: string;
  refreshToken: string;
}

export const customerLogin = async (
  phone: string,
  otp: string,
  name?: string,
  userAgent?: string
): Promise<LoginResult> => {
  await verifyOtpCode(phone, otp);

  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({
      phone,
      name: name || "",
      role: Role.CUSTOMER,
      isPhoneVerified: true,
    });
  } else {
    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }
    user.isPhoneVerified = true;
    if (name && !user.name) {
      user.name = name;
    }
  }

  user.lastLoginAt = new Date();

  const refreshToken = generateRefreshToken();
  const tokenHash = hashSha256(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  user.refreshTokens.push({
    tokenHash,
    expiresAt,
    userAgent: userAgent || "unknown",
  });

  await user.save();

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
    },
    accessToken,
    refreshToken,
  };
};

export const adminLogin = async (
  email: string,
  password: string,
  userAgent?: string
): Promise<LoginResult> => {
  const user = await User.findOne({ email, role: Role.ADMIN }).select(
    "+passwordHash"
  );
  if (!user || !user.passwordHash) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  user.lastLoginAt = new Date();

  const refreshToken = generateRefreshToken();
  const tokenHash = hashSha256(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  user.refreshTokens.push({
    tokenHash,
    expiresAt,
    userAgent: userAgent || "unknown",
  });

  await user.save();

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      storeIds: user.storeIds,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshTokens = async (
  oldRefreshToken: string,
  userAgent?: string
): Promise<TokenPair> => {
  const tokenHash = hashSha256(oldRefreshToken);

  const user = await User.findOne({
    "refreshTokens.tokenHash": tokenHash,
  });

  if (!user) {
    throw new AppError("Invalid refresh token", 401);
  }

  const storedToken = user.refreshTokens.find(
    (t) => t.tokenHash === tokenHash
  );

  if (!storedToken || storedToken.expiresAt < new Date()) {
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.tokenHash !== tokenHash
    );
    await user.save();
    throw new AppError("Refresh token expired", 401);
  }

  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.tokenHash !== tokenHash
  );

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashSha256(newRefreshToken);
  const expiresAt = getRefreshTokenExpiry();

  user.refreshTokens.push({
    tokenHash: newTokenHash,
    expiresAt,
    userAgent: userAgent || "unknown",
  });

  await user.save();

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (
  userId: string,
  refreshToken: string
): Promise<void> => {
  const tokenHash = hashSha256(refreshToken);
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { tokenHash } } }
  );
};

export const logoutAll = async (userId: string): Promise<void> => {
  await User.updateOne(
    { _id: userId },
    { $set: { refreshTokens: [] } }
  );
};

export { hashPassword };
