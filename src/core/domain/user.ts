import type { OffsetPage } from "./offset";

const USER_ROLES = ["USER", "ADMIN"] as const;
type UserRole = (typeof USER_ROLES)[number];

// 관리자 사용자 목록의 탈퇴 여부 필터 — deletedAt 유무를 단일값으로 노출한다.
const ADMIN_USER_STATUS_FILTERS = ["active", "withdrawn"] as const;
type AdminUserStatusFilter = (typeof ADMIN_USER_STATUS_FILTERS)[number];

// 관리자 전역 사용자 목록 한 행 — 비밀번호/전화번호/인증 관련 필드는 담지 않는다.
type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  role: UserRole;
  deletedAt: Date | null;
};

const ADMIN_USER_SORT_KEYS = ["createdAt", "name"] as const;
type AdminUserSortKey = (typeof ADMIN_USER_SORT_KEYS)[number];
type AdminUserListPage = OffsetPage<AdminUserListItem>;

export {
  USER_ROLES,
  ADMIN_USER_SORT_KEYS,
  ADMIN_USER_STATUS_FILTERS,
  type UserRole,
  type AdminUserListItem,
  type AdminUserListPage,
  type AdminUserSortKey,
  type AdminUserStatusFilter,
};
