import "server-only";
import { AppError } from "@/core/domain";
import type { BaseUser, IUser } from "@/models";
import { UserModel } from "@/models";
import { dbConnect } from "@/db";
import { hashPassword } from "@/adapters/server/bcrypt";
import { decrypt, encrypt } from "@/adapters/server/jose";
import { deleteCookie } from "@/adapters/server/cookies";
import { sendEmail } from "@/adapters/server/nodemailer";
import { routes } from "@/core/domain";
import { getAppBaseUrl } from "@/core/utils";
// 유저 생성
export const createUser = async (user: BaseUser): Promise<IUser> => {
  await dbConnect();
  const newUser = await new UserModel(user).save();
  return newUser;
};

// 이메일 중복 확인
export const checkEmailDuplicate = async (email: string): Promise<boolean> => {
  await dbConnect();
  const exists = await UserModel.exists({ email });
  return !!exists;
};

// 유저 email 찾기
export const getUserEmail = async ({
  name,
  phone,
}: {
  name: string;
  phone: string;
}): Promise<string> => {
  await dbConnect();
  const user = await UserModel.findOne({ name, phone }).lean<BaseUser>();
  if (!user) throw new AppError("NOT_FOUND", "유저를 찾을 수가 없습니다.");
  return user.email;
};

// 유저 ID로 유저 찾기
export const getUserById = async (id: string): Promise<IUser> => {
  await dbConnect();
  const user = await UserModel.findById(id).lean<IUser>();
  if (!user) throw new AppError("NOT_FOUND", "유저를 찾을 수가 없습니다.");
  return user;
};

// 비밀번호 변경 함수
export const changePassword = async (
  email: string,
  newPassword: string,
): Promise<boolean> => {
  await dbConnect();

  // 새 비밀번호 해싱
  const hashedNewPassword = await hashPassword(newPassword);

  // 비밀번호 업데이트
  const userBeforeUpdate = await UserModel.findOneAndUpdate(
    { email, isDelete: false },
    { password: hashedNewPassword },
    { runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.",
    );
  });

  return !!userBeforeUpdate;
};

export async function signupUserService({
  email,
  name,
  phone,
  password,
}: {
  email: string;
  name: string;
  phone: string;
  password: string;
}): Promise<void> {
  if (await checkEmailDuplicate(email)) {
    throw new AppError("VALIDATION", "이미 존재하는 이메일 입니다.");
  }
  await createUser({ email, name, phone, password: await hashPassword(password) });
}

export async function requestPasswordResetService(email: string): Promise<void> {
  if (!(await checkEmailDuplicate(email))) {
    throw new AppError("VALIDATION", "등록되지 않은 이메일입니다.");
  }
  const token = await encrypt({ id: email, type: "ENTRY" });
  const path = new URL(
    `${routes.changePw}?t=${encodeURIComponent(token)}`,
    getAppBaseUrl(),
  ).toString();
  await sendEmail({ email, path });
}

export async function resetUserPasswordService({
  token,
  password,
}: {
  token: string;
  password: string;
}): Promise<void> {
  const { payload } = await decrypt({ token, type: "ENTRY" });
  if (!payload.id) {
    throw new AppError(
      "UNAUTHENTICATED",
      "유효하지 않거나 만료된 토큰입니다. 비밀번호 재설정을 다시 시도해주세요.",
    );
  }
  if (!(await changePassword(payload.id, password))) {
    throw new AppError("NOT_FOUND", "해당 계정을 찾을 수 없습니다. 이메일 주소를 확인해주세요.");
  }
  await deleteCookie("userEmail");
}
