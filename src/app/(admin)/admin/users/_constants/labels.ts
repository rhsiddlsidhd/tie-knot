import type { UserRole } from "@/core/domain";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "일반회원",
  ADMIN: "관리자",
};
