import type { UserRole } from "@/core/domain/user";
import type { FilterToggleGroupOption } from "@/ui/components/molecules/FilterToggleGroup/FilterToggleGroup";
import { USER_ROLE_LABELS } from "@/app/(admin)/admin/users/_constants/labels";

const ROLE_FILTER_OPTIONS: ReadonlyArray<FilterToggleGroupOption<UserRole>> = [
  { value: null, label: "전체 역할" },
  { value: "USER", label: USER_ROLE_LABELS.USER },
  { value: "ADMIN", label: USER_ROLE_LABELS.ADMIN },
];

export { ROLE_FILTER_OPTIONS };
