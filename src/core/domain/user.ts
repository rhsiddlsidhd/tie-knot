import type { CursorPage } from "./cursor";

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// 관리자 전역 사용자 목록 한 행 — 비밀번호/전화번호/인증 관련 필드는 담지 않는다.
export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  role: UserRole;
  deletedAt: Date | null;
};

export type AdminUserListPage = CursorPage<AdminUserListItem>;
