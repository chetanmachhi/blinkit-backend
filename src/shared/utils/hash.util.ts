import bcrypt from "bcryptjs";
import crypto from "crypto";

export const hashPassword = async (
  password: string,
  saltRounds: number = 12
): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashSha256 = (data: string): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};
