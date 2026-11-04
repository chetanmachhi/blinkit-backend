import {
  hashPassword as hashPasswordShared,
  comparePassword as comparePasswordShared,
  hashSha256 as hashSha256Shared,
} from "../../../shared";

export const hashPassword = async (password: string): Promise<string> => {
  return hashPasswordShared(password, 12);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return comparePasswordShared(password, hash);
};

export const hashSha256 = (data: string): string => {
  return hashSha256Shared(data);
};
