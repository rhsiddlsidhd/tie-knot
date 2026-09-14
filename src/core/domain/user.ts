import type { CursorPage } from "./cursor";

const USER_ROLES = ["USER", "ADMIN"] as const;
type UserRole = (typeof USER_ROLES)[number];

// 관리자 전역 사용자 목록 한 행 — 비밀번호/전화번호/인증 관련 필드는 담지 않는다.
type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  role: UserRole;
  deletedAt: Date | null;
};

type AdminUserListPage = CursorPage<AdminUserListItem>;

export { USER_ROLES, type UserRole, type AdminUserListItem, type AdminUserListPage };
