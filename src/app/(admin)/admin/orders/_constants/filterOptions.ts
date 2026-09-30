import type { OrderStatus } from "@/core/domain/order";
import { ORDER_STATUS_LABELS } from "@/core/domain/order";
import type { FilterSelectOption } from "@/ui/components/molecules/FilterSelect/FilterSelect";

const STATUS_FILTER_OPTIONS: ReadonlyArray<FilterSelectOption<OrderStatus>> = [
  { value: "PENDING", label: ORDER_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: ORDER_STATUS_LABELS.CONFIRMED },
  { value: "COMPLETED", label: ORDER_STATUS_LABELS.COMPLETED },
  { value: "CANCELLED", label: ORDER_STATUS_LABELS.CANCELLED },
];

export { STATUS_FILTER_OPTIONS };
