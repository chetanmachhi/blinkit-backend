import { Otp } from "../models/otp.model";
import { hashSha256 } from "../utils/hash.util";
import { sendOtp } from "./sms.service";
import config from "../config/env";
import { AppError } from "../utils/AppError";

interface RequestOtpResult {
  message: string;
  devOtp?: string;
}

export const requestOtp = async (
  phone: string
): Promise<RequestOtpResult> => {
  await Otp.deleteMany({ phone });

  const otp =
    config.DEV_FIXED_OTP ||
    (config.NODE_ENV === "production"
      ? String(Math.floor(100000 + Math.random() * 900000))
      : "123456");

  const otpHash = hashSha256(otp);
  const expiresAt = new Date(
    Date.now() + config.OTP_TTL_MINUTES * 60 * 1000
  );

  await Otp.create({ phone, otpHash, attempts: 0, expiresAt });
  await sendOtp(phone, otp);

  const result: RequestOtpResult = { message: "OTP sent successfully" };
  if (config.NODE_ENV !== "production" || config.DEV_FIXED_OTP) {
    result.devOtp = otp;
  }
  return result;
};

export const verifyOtp = async (
  phone: string,
  otp: string
): Promise<void> => {
  const otpRecord = await Otp.findOne({ phone }).sort({
    createdAt: -1,
  });

  if (!otpRecord) {
    throw new AppError("OTP not found or expired", 400);
  }

  if (otpRecord.attempts >= config.OTP_MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new AppError("Maximum OTP attempts exceeded", 400);
  }

  const otpHash = hashSha256(otp);
  const isMasterOtp = config.DEV_FIXED_OTP && otp === config.DEV_FIXED_OTP;
  if (otpHash !== otpRecord.otpHash && !isMasterOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new AppError("Invalid OTP", 400);
  }

  await Otp.deleteOne({ _id: otpRecord._id });
};
