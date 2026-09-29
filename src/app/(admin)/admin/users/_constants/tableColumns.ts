import type { AdminUserSortKey } from "@/core/domain/user";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

type Column = DataTableColumn<AdminUserSortKey>;

const USER_TABLE_COLUMNS: readonly Column[] = [
  { label: "이름", sort: "name" },
  { label: "이메일", sort: null },
  { label: "가입일", sort: "createdAt" },
  { label: "역할", sort: null },
  { label: "상태", sort: null },
  { label: "관리", sort: null },
];

export { USER_TABLE_COLUMNS };
