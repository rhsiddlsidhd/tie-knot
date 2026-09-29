import type { AdminPremiumFeatureSortKey } from "@/core/domain/premium-feature";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

const PREMIUM_FEATURE_TABLE_COLUMNS = [
  { label: "기능 코드" },
  { label: "기능 이름", sort: "label" },
  { label: "설명" },
  { label: "추가 비용", sort: "additionalPrice" },
  { label: "상태" },
  { label: "등록일", sort: "createdAt" },
  { label: "관리" },
] as const satisfies readonly DataTableColumn<AdminPremiumFeatureSortKey>[];

export { PREMIUM_FEATURE_TABLE_COLUMNS };
