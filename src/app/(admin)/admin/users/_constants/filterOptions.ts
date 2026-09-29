import type { UserRole } from "@/core/domain/user";
import { USER_ROLE_LABELS } from "@/app/(admin)/admin/users/_constants/labels";

const ROLE_FILTER_OPTIONS: ReadonlyArray<{
  value: UserRole | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "전체 역할" },
  { value: "USER", label: USER_ROLE_LABELS.USER },
  { value: "ADMIN", label: USER_ROLE_LABELS.ADMIN },
];

export { ROLE_FILTER_OPTIONS };
