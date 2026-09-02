import "server-only";
import type { Types } from "mongoose";
import mongoose from "mongoose";
import type { AdminUserListPage, UserRole } from "@/core/domain";
import { AppError, DEFAULT_PAGE_SIZE, USER_ROLES } from "@/core/domain";
import type { BaseUser, IUser } from "@/models/user.model";
import { UserModel } from "@/models/user.model";
import { dbConnect } from "@/db/connect";
import { hashPassword } from "@/adapters/server/bcrypt";
import { decrypt, encrypt } from "@/adapters/server/jose";
import { deleteCookie } from "@/adapters/server/cookies";
import { sendEmail } from "@/adapters/server/nodemailer";
import { routes } from "@/core/domain";
import {
  decodeCursor,
  encodeCursor,
  getAppBaseUrl,
  isValidPageLimit,
} from "@/core/utils";
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
    { email, deletedAt: null },
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

type AdminUserListQuery = {
  role?: UserRole;
  cursor?: string;
  limit?: number;
};

type AdminUserListRow = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  role: UserRole;
  deletedAt: Date | null;
};

/**
 * 관리자 전역 사용자 목록 한 페이지 — 활동/탈퇴 여부와 무관하게 전체 사용자를
 * 대상으로 한다(deletedAt으로 걸러내지 않는다). 정렬·커서 계약(createdAt desc, _id
 * tie-break, limit+1)은 주문 목록과 동일하되, 비밀번호·전화번호·인증 관련 필드는
 * select 단계에서부터 제외한다.
 */
export const getAdminUsersPageService = async ({
  role,
  cursor,
  limit = DEFAULT_PAGE_SIZE,
}: AdminUserListQuery): Promise<AdminUserListPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit)) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }
  if (role && !USER_ROLES.includes(role)) {
    throw new AppError("VALIDATION", "잘못된 사용자 역할입니다.");
  }

  const filter: mongoose.FilterQuery<IUser> = {};

  if (role) {
    filter.role = role;
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
    }
    filter.$or = [
      { createdAt: { $lt: decoded.createdAt } },
      {
        createdAt: decoded.createdAt,
        _id: { $lt: new mongoose.Types.ObjectId(decoded.id) },
      },
    ];
  }

  const found = await UserModel.find(filter)
    .select("name email createdAt role deletedAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean<AdminUserListRow[]>()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "사용자 목록 조회에 실패했습니다.",
      );
    });

  const hasMore = found.length > limit;
  const users = hasMore ? found.slice(0, limit) : found;
  const lastUser = users.at(-1);

  return {
    items: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      role: user.role,
      deletedAt: user.deletedAt,
    })),
    nextCursor:
      hasMore && lastUser
        ? encodeCursor({
            createdAt: lastUser.createdAt,
            id: lastUser._id.toString(),
          })
        : null,
  };
};
