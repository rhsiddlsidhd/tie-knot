import type { FeatureProductBindingSortKey } from "@/core/domain/premium-feature";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

type Column = DataTableColumn<FeatureProductBindingSortKey>;

// createdAt은 열 없이 기본 정렬로만 쓴다.
const FEATURE_PRODUCT_BINDING_TABLE_COLUMNS: readonly Column[] = [
  { label: "연결", sort: null },
  { label: "상품명", sort: "title" },
  { label: "가격", sort: "price" },
  { label: "상태", sort: null },
];

export { FEATURE_PRODUCT_BINDING_TABLE_COLUMNS };
