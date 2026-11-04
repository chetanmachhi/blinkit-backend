import { Types } from "mongoose";
import {
  User,
  IUser,
  Role,
  StoreRole,
  AppError,
  hashPassword,
} from "../../../shared";

export const getStaffList = async (): Promise<IUser[]> => {
  return User.find({ role: Role.ADMIN })
    .select("-passwordHash")
    .sort({ createdAt: -1 });
};

export const createStaffMember = async (data: {
  name: string;
  email: string;
  password: string;
  storeRole: StoreRole;
  storeIds: string[];
}): Promise<IUser> => {
  const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
  if (existing) {
    throw new AppError("A user with this email already exists", 409);
  }

  const passwordHash = await hashPassword(data.password);
  const user = await User.create({
    name: data.name,
    phone: `STAFF_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: data.email.toLowerCase().trim(),
    passwordHash,
    role: Role.ADMIN,
    storeRole: data.storeRole,
    storeIds: data.storeIds.map((id) => new Types.ObjectId(id)),
    isActive: true,
    isPhoneVerified: true,
  });

  return User.findById(user._id).select("-passwordHash") as Promise<IUser>;
};

export const updateStaffMember = async (
  actingUserId: string,
  targetUserId: string,
  data: {
    name?: string;
    storeRole?: StoreRole;
    storeIds?: string[];
    isActive?: boolean;
  }
): Promise<IUser> => {
  const target = await User.findById(targetUserId);
  if (!target || target.role !== Role.ADMIN) {
    throw new AppError("Staff member not found", 404);
  }

  const isSelf = actingUserId === targetUserId;

  if (isSelf) {
    if (data.storeRole !== undefined && data.storeRole !== target.storeRole) {
      throw new AppError("You cannot modify your own role", 400);
    }
    if (data.isActive === false) {
      throw new AppError("You cannot deactivate your own account", 400);
    }
  }

  const willDemoteOrDeactivate =
    target.storeRole === StoreRole.OWNER &&
    ((data.storeRole && data.storeRole !== StoreRole.OWNER) ||
      data.isActive === false);

  if (willDemoteOrDeactivate) {
    const activeOwnerCount = await User.countDocuments({
      role: Role.ADMIN,
      storeRole: StoreRole.OWNER,
      isActive: true,
      _id: { $ne: target._id },
    });
    if (activeOwnerCount === 0) {
      throw new AppError(
        "Cannot demote or deactivate the last active owner",
        400
      );
    }
  }

  const updateFields: any = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.storeRole !== undefined) updateFields.storeRole = data.storeRole;
  if (data.isActive !== undefined) updateFields.isActive = data.isActive;
  if (data.storeIds !== undefined) {
    updateFields.storeIds = data.storeIds.map((id) => new Types.ObjectId(id));
  }

  const updated = await User.findByIdAndUpdate(
    targetUserId,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  if (!updated) {
    throw new AppError("Staff member not found", 404);
  }

  return updated;
};

export const resetStaffPassword = async (
  targetUserId: string,
  newPass: string
): Promise<void> => {
  const user = await User.findById(targetUserId);
  if (!user || user.role !== Role.ADMIN) {
    throw new AppError("Staff member not found", 404);
  }

  user.passwordHash = await hashPassword(newPass);
  user.refreshTokens = [];
  await user.save();
};
