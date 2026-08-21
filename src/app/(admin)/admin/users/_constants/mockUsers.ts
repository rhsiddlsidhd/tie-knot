import type { UserRole } from "@/core/domain";

export interface MockUser {
  name: string;
  email: string;
  joinedAt: string;
  role: UserRole;
  isDelete: boolean;
}

// mock UI만 구현 — 실제 사용자 전체조회 API/서비스는 아직 없다(별도 Issue 대상).
export const MOCK_USERS: MockUser[] = [
  {
    name: "김민준",
    email: "minjun.kim@email.com",
    joinedAt: "2026.03.12",
    role: "USER",
    isDelete: false,
  },
  {
    name: "이서연",
    email: "seoyeon.lee@email.com",
    joinedAt: "2025.11.02",
    role: "ADMIN",
    isDelete: true,
  },
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "일반회원",
  ADMIN: "관리자",
};
