import { Types } from "mongoose";
import {
  User,
  IUser,
  Store,
  Role,
  StoreRole,
  AppError,
  hashPassword,
  comparePassword,
  hashSha256,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from "../../../shared";
import config from "../config/env";
import { ROLE_PERMISSIONS, Permission } from "../constants/permissions";

const revokedOldTokens = new Set<string>();

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: Role;
    storeRole: StoreRole;
    storeIds: string[];
  };
  storeRole: StoreRole;
  permissions: Permission[];
  stores: Array<{
    id: string;
    name: string;
    isActive: boolean;
    isAcceptingOrders: boolean;
  }>;
  demoToolsEnabled: boolean;
}

export const loginStoreUser = async (
  email: string,
  pass: string,
  userAgent: string = "web"
): Promise<LoginResult> => {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    role: Role.ADMIN,
  }).select("+passwordHash");

  if (!user || !user.passwordHash || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValid = await comparePassword(pass, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const storeRole = user.storeRole || StoreRole.STAFF;
  const accessToken = generateAccessToken(
    { sub: user._id.toString(), role: user.role, storeRole },
    config.JWT_ACCESS_SECRET,
    config.JWT_ACCESS_EXPIRES_IN
  );

  const refreshToken = generateRefreshToken();
  const tokenHash = hashSha256(refreshToken);
  const expiresAt = getRefreshTokenExpiry(config.JWT_REFRESH_EXPIRES_IN);

  user.refreshTokens.push({
    tokenHash,
    expiresAt,
    userAgent,
  });

  user.lastLoginAt = new Date();
  await user.save();

  const authMe = await getStoreAuthMe(user._id.toString());

  return {
    accessToken,
    refreshToken,
    ...authMe,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email || "",
      phone: user.phone,
      role: user.role,
      storeRole,
      storeIds: (user.storeIds || []).map((id) => id.toString()),
    },
  };
};

export const refreshStoreToken = async (
  rawRefreshToken: string,
  userAgent: string = "web"
): Promise<{ accessToken: string; refreshToken: string }> => {
  const tokenHash = hashSha256(rawRefreshToken);

  if (revokedOldTokens.has(tokenHash)) {
    const compromisedUser = await User.findOne({
      "refreshTokens.tokenHash": tokenHash,
    });
    if (compromisedUser) {
      compromisedUser.refreshTokens = [];
      await compromisedUser.save();
    }
    throw new AppError("Token reuse detected; all sessions revoked", 401);
  }

  const user = await User.findOne({
    "refreshTokens.tokenHash": tokenHash,
    role: Role.ADMIN,
    isActive: true,
  });

  if (!user) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const existingToken = user.refreshTokens.find(
    (t) => t.tokenHash === tokenHash
  );

  if (!existingToken || existingToken.expiresAt < new Date()) {
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.tokenHash !== tokenHash
    );
    await user.save();
    throw new AppError("Refresh token has expired", 401);
  }

  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.tokenHash !== tokenHash
  );
  revokedOldTokens.add(tokenHash);

  const storeRole = user.storeRole || StoreRole.STAFF;
  const newAccessToken = generateAccessToken(
    { sub: user._id.toString(), role: user.role, storeRole },
    config.JWT_ACCESS_SECRET,
    config.JWT_ACCESS_EXPIRES_IN
  );

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashSha256(newRefreshToken);
  const expiresAt = getRefreshTokenExpiry(config.JWT_REFRESH_EXPIRES_IN);

  user.refreshTokens.push({
    tokenHash: newTokenHash,
    expiresAt,
    userAgent,
  });

  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutStoreUser = async (
  userId: string,
  rawRefreshToken?: string
): Promise<void> => {
  if (!rawRefreshToken) return;
  const tokenHash = hashSha256(rawRefreshToken);
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { tokenHash } } }
  );
  revokedOldTokens.add(tokenHash);
};

export const logoutAllStoreSessions = async (userId: string): Promise<void> => {
  await User.updateOne(
    { _id: userId },
    { $set: { refreshTokens: [] } }
  );
};

export const changeStoreUserPassword = async (
  userId: string,
  oldPass: string,
  newPass: string
): Promise<void> => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !user.passwordHash) {
    throw new AppError("User not found", 404);
  }

  const isValid = await comparePassword(oldPass, user.passwordHash);
  if (!isValid) {
    throw new AppError("Incorrect current password", 400);
  }

  user.passwordHash = await hashPassword(newPass);
  user.refreshTokens = [];
  await user.save();
};

export const getStoreAuthMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const storeRole = user.storeRole || StoreRole.STAFF;
  const permissions = ROLE_PERMISSIONS[storeRole] || [];

  let storeQuery: any = { isActive: true };
  if (user.storeIds && user.storeIds.length > 0) {
    storeQuery._id = { $in: user.storeIds };
  }

  const stores = await Store.find(storeQuery).select(
    "_id name isActive isAcceptingOrders"
  );

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email || "",
      phone: user.phone,
      role: user.role,
    },
    storeRole,
    permissions,
    stores: stores.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      isActive: s.isActive,
      isAcceptingOrders: s.isAcceptingOrders,
    })),
    demoToolsEnabled: config.ENABLE_DEMO_TOOLS,
  };
};
