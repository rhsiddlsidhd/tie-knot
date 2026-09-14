import type { UserRole } from "@/core/domain/user";

const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "일반회원",
  ADMIN: "관리자",
};

export { USER_ROLE_LABELS };
