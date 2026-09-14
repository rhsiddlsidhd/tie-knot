import "server-only";
import bcrypt from "bcryptjs";

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
};

export { hashPassword, comparePasswords };
