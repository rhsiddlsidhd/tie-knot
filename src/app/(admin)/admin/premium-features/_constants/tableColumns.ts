import type { AdminPremiumFeatureSortKey } from "@/core/domain/premium-feature";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

type Column = DataTableColumn<AdminPremiumFeatureSortKey>;

const PREMIUM_FEATURE_TABLE_COLUMNS: readonly Column[] = [
  { label: "기능 코드", sort: null },
  { label: "기능 이름", sort: "label" },
  { label: "설명", sort: null },
  { label: "추가 비용", sort: "additionalPrice" },
  { label: "상태", sort: null },
  { label: "등록일", sort: "createdAt" },
  { label: "관리", sort: null },
];

export { PREMIUM_FEATURE_TABLE_COLUMNS };
