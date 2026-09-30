import "server-only";
import { randomUUID } from "node:crypto";
import type mongoose from "mongoose";
import type { Types } from "mongoose";
import type {
  AdminUserListPage,
  AdminUserSortKey,
  AdminUserStatusFilter,
  UserRole,
} from "@/core/domain/user";
import { AppError } from "@/core/domain/error";
import { DEFAULT_PAGE_SIZE } from "@/core/domain/cursor";
import { ADMIN_USER_SORT_KEYS, USER_ROLES } from "@/core/domain/user";
import type { BaseUser, UserDocument } from "@/models/user.model";
import { UserModel } from "@/models/user.model";
import { dbConnect } from "@/db/connect";
import { escapeRegExp } from "@/core/utils/escape-regexp";
import { hashPassword } from "@/adapters/server/bcrypt/hash";
import { decrypt } from "@/adapters/server/jose/decrypt";
import { encrypt } from "@/adapters/server/jose/encrypt";
import { deleteCookie } from "@/adapters/server/cookies/delete";
import { sendEmail } from "@/adapters/server/nodemailer/send";
import { ROUTES } from "@/core/domain/routes";
import { isValidPageLimit } from "@/core/utils/cursor";

const PASSWORD_RESET_COOLDOWN_MS = 60_000;

const getAppBaseUrl = (): string => {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.BASE_URL
      : process.env.DEPLOYMENT_BASE_URL;

  if (!baseUrl) {
    throw new AppError(
      "INTERNAL",
      "BASE_URL/DEPLOYMENT_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }

  return baseUrl;
};

// 유저 생성
const createUser = async (user: BaseUser): Promise<UserDocument> => {
  await dbConnect();
  const newUser = await new UserModel(user).save();
  return newUser;
};

// 이메일 중복 확인
const checkEmailDuplicate = async (email: string): Promise<boolean> => {
  await dbConnect();
  const exists = await UserModel.exists({ email });
  return !!exists;
};

// 유저 email 찾기
const getUserEmail = async ({
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
const getUserById = async (id: string): Promise<UserDocument> => {
  await dbConnect();
  const user = await UserModel.findById(id).lean<UserDocument>();
  if (!user) throw new AppError("NOT_FOUND", "유저를 찾을 수가 없습니다.");
  return user;
};

// 비밀번호 변경 함수
const changePassword = async (
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

const signupUserService = async ({
  email,
  name,
  phone,
  password,
}: {
  email: string;
  name: string;
  phone: string;
  password: string;
}): Promise<void> => {
  if (await checkEmailDuplicate(email)) {
    throw new AppError("VALIDATION", "이미 존재하는 이메일 입니다.");
  }
  await createUser({
    email,
    name,
    phone,
    password: await hashPassword(password),
  });
};

const consumePasswordResetToken = async ({
  email,
  tokenId,
  newPassword,
}: {
  email: string;
  tokenId: string;
  newPassword: string;
}): Promise<boolean> => {
  await dbConnect();
  const hashedNewPassword = await hashPassword(newPassword);
  const updated = await UserModel.findOneAndUpdate(
    { email, passwordResetTokenId: tokenId },
    { password: hashedNewPassword, passwordResetTokenId: null },
    { runValidators: true },
  );
  return !!updated;
};

const requestPasswordResetService = async (email: string): Promise<void> => {
  if (!(await checkEmailDuplicate(email))) {
    throw new AppError("VALIDATION", "등록되지 않은 이메일입니다.");
  }

  await dbConnect();
  const cutoff = new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MS);
  const cooldownPassed = await UserModel.findOneAndUpdate(
    {
      email,
      $or: [
        { lastPasswordResetRequestedAt: null },
        { lastPasswordResetRequestedAt: { $lt: cutoff } },
      ],
    },
    { $set: { lastPasswordResetRequestedAt: new Date() } },
  );
  if (!cooldownPassed) {
    throw new AppError("VALIDATION", "잠시 후 다시 시도해주세요.");
  }

  const jti = randomUUID();
  const token = await encrypt({ id: email, type: "ENTRY", jti });
  await UserModel.findOneAndUpdate(
    { email },
    { passwordResetTokenId: jti },
    { runValidators: true },
  );
  const path = new URL(
    `${ROUTES.changePw}?t=${encodeURIComponent(token)}`,
    getAppBaseUrl(),
  ).toString();
  await sendEmail({ email, path });
};

const resetUserPasswordService = async ({
  token,
  password,
}: {
  token: string;
  password: string;
}): Promise<void> => {
  const { payload } = await decrypt({ token, type: "ENTRY" });
  if (!payload.id || !payload.jti) {
    throw new AppError(
      "UNAUTHENTICATED",
      "유효하지 않거나 만료된 토큰입니다. 비밀번호 재설정을 다시 시도해주세요.",
    );
  }
  if (
    !(await consumePasswordResetToken({
      email: payload.id,
      tokenId: payload.jti,
      newPassword: password,
    }))
  ) {
    throw new AppError(
      "UNAUTHENTICATED",
      "유효하지 않거나 만료된 토큰입니다. 비밀번호 재설정을 다시 시도해주세요.",
    );
  }
  await deleteCookie("userEmail");
};

type AdminUserListQuery = {
  q?: string;
  role?: UserRole;
  status?: AdminUserStatusFilter;
  page?: number;
  limit?: number;
  sort?: AdminUserSortKey;
  direction?: "asc" | "desc";
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
 * 대상으로 한다(deletedAt으로 걸러내지 않는다). 비밀번호·전화번호·인증 관련 필드는
 * select 단계에서부터 제외한다. 검색(q)은 이름/이메일 부분일치를 쓴다.
 */
const getAdminUsersPageService = async ({
  q,
  role,
  status,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  sort = "createdAt",
  direction = "desc",
}: AdminUserListQuery): Promise<AdminUserListPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit) || !Number.isInteger(page) || page < 1) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }
  if (role && !USER_ROLES.includes(role)) {
    throw new AppError("VALIDATION", "잘못된 사용자 역할입니다.");
  }
  if (!ADMIN_USER_SORT_KEYS.includes(sort)) {
    throw new AppError("VALIDATION", "잘못된 정렬 기준입니다.");
  }
  if (direction !== "asc" && direction !== "desc") {
    throw new AppError("VALIDATION", "잘못된 정렬 방향입니다.");
  }

  const filter: mongoose.FilterQuery<UserDocument> = {};

  if (role) {
    filter.role = role;
  }
  if (status === "active") {
    filter.deletedAt = null;
  } else if (status === "withdrawn") {
    filter.deletedAt = { $ne: null };
  }

  const conditions: mongoose.FilterQuery<UserDocument>[] = [];

  const term = q?.trim();
  if (term) {
    conditions.push({
      $or: [
        { name: { $regex: escapeRegExp(term), $options: "i" } },
        { email: { $regex: escapeRegExp(term), $options: "i" } },
      ],
    });
  }

  if (conditions.length > 0) {
    filter.$and = conditions;
  }

  const sortDirection = direction === "asc" ? 1 : -1;
  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .select("name email createdAt role deletedAt")
      .sort({ [sort]: sortDirection, _id: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<AdminUserListRow[]>(),
    UserModel.countDocuments(filter),
  ]).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "사용자 목록 조회에 실패했습니다.",
    );
  });

  return {
    items: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      role: user.role,
      deletedAt: user.deletedAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export {
  createUser,
  checkEmailDuplicate,
  getUserEmail,
  getUserById,
  changePassword,
  signupUserService,
  requestPasswordResetService,
  resetUserPasswordService,
  getAdminUsersPageService,
};
