import type { AdminUserStatusFilter, UserRole } from "@/core/domain/user";
import type { FilterSelectOption } from "@/ui/components/molecules/FilterSelect/FilterSelect";
import { USER_ROLE_LABELS } from "@/app/(admin)/admin/users/_constants/labels";

const ROLE_FILTER_OPTIONS: ReadonlyArray<FilterSelectOption<UserRole>> = [
  { value: "USER", label: USER_ROLE_LABELS.USER },
  { value: "ADMIN", label: USER_ROLE_LABELS.ADMIN },
];

const STATUS_FILTER_OPTIONS: ReadonlyArray<
  FilterSelectOption<AdminUserStatusFilter>
> = [
  { value: "active", label: "활동중" },
  { value: "withdrawn", label: "탈퇴" },
];

export { ROLE_FILTER_OPTIONS, STATUS_FILTER_OPTIONS };
