import type { FeatureProductBindingSortKey } from "@/core/domain/premium-feature";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

// createdAt은 열 없이 기본 정렬로만 쓴다.
const FEATURE_PRODUCT_BINDING_TABLE_COLUMNS = [
  { label: "연결" },
  { label: "상품명", sort: "title" },
  { label: "가격", sort: "price" },
  { label: "상태" },
] as const satisfies readonly DataTableColumn<FeatureProductBindingSortKey>[];

export { FEATURE_PRODUCT_BINDING_TABLE_COLUMNS };
