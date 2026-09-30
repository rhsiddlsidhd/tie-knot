import type { OrderStatus } from "@/core/domain/order";
import { ORDER_STATUS_LABELS } from "@/core/domain/order";
import type { AllOptionSelectOption } from "@/ui/components/molecules/AllOptionSelect/AllOptionSelect";

const STATUS_FILTER_OPTIONS: ReadonlyArray<
  AllOptionSelectOption<OrderStatus>
> = [
  { value: null, label: "전체 상태" },
  { value: "PENDING", label: ORDER_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: ORDER_STATUS_LABELS.CONFIRMED },
  { value: "COMPLETED", label: ORDER_STATUS_LABELS.COMPLETED },
  { value: "CANCELLED", label: ORDER_STATUS_LABELS.CANCELLED },
];

export { STATUS_FILTER_OPTIONS };
