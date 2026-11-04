import {
  User,
  IUser,
  Role,
  AppError,
  comparePassword,
  generateAccessToken,
} from "../../../shared";
import config from "../config/env";

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  vehicleNumber?: string;
  isOnline: boolean;
}

export const toRiderProfile = (user: IUser): RiderProfile => ({
  id: user._id.toString(),
  name: user.name || "Delivery Partner",
  phone: user.phone,
  vehicleNumber: user.vehicleNumber,
  isOnline: user.isOnline !== false,
});

/** Accepts "+91 98765 43210" as well as "9876543210". */
const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const loginRider = async (
  phone: string,
  password: string
): Promise<{ accessToken: string; rider: RiderProfile }> => {
  const user = await User.findOne({
    phone: normalizePhone(phone),
    role: Role.RIDER,
  }).select("+passwordHash");

  if (!user || !user.passwordHash || !user.isActive) {
    throw new AppError("Invalid phone number or password", 401);
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid phone number or password", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(
    { sub: user._id.toString(), role: user.role },
    config.JWT_ACCESS_SECRET,
    config.DELIVERY_TOKEN_EXPIRES_IN
  );

  return { accessToken, rider: toRiderProfile(user) };
};

export const getRiderProfile = async (riderId: string): Promise<RiderProfile> => {
  const user = await User.findById(riderId);
  if (!user) {
    throw new AppError("Rider not found", 404);
  }
  return toRiderProfile(user);
};

export const setRiderAvailability = async (
  riderId: string,
  isOnline: boolean
): Promise<RiderProfile> => {
  const user = await User.findByIdAndUpdate(
    riderId,
    { $set: { isOnline } },
    { new: true }
  );
  if (!user) {
    throw new AppError("Rider not found", 404);
  }
  return toRiderProfile(user);
};
