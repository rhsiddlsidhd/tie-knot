import { TypographyH1, TypographyMuted } from "@/ui/components/atoms";
import type {
  OrderListPage,
  OrderStatus,
  ProductCategory,
} from "@/core/domain";
import { OrderFilters } from "./OrderFilters";
import { OrderList } from "./OrderList";

interface MyOrdersTemplateProps {
  firstPage: OrderListPage;
  status?: OrderStatus;
  category?: ProductCategory;
}

const MyOrdersTemplate = ({
  firstPage,
  status,
  category,
}: MyOrdersTemplateProps) => {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <TypographyH1 className="text-left mb-2 text-3xl font-bold">
          주문 목록
        </TypographyH1>
        <TypographyMuted>
          구매한 템플릿과 주문 상태를 확인합니다.
        </TypographyMuted>
      </div>

      <OrderFilters status={status} category={category} />

      <OrderList firstPage={firstPage} status={status} category={category} />
    </div>
  );
};

export { MyOrdersTemplate };
