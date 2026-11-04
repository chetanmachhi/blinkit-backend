export const sendOtp = async (
  phone: string,
  otp: string
): Promise<void> => {
  console.log(`[SMS] Sending OTP ${otp} to ${phone}`);
};
