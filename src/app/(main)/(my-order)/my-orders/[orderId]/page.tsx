export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getOwnedOrderDetail, verifySession } from "@/services";
import { AppError } from "@/core/domain";
import { OrderDetailTemplate } from "./_components";

const Page = async ({ params }: { params: Promise<{ orderId: string }> }) => {
  const { orderId } = await params;
  const session = await verifySession();

  // 없는 주문과 남의 주문은 사용자 입장에서 같은 결과여야 한다(소유 여부를 404로도
  // 알려주지 않는다) — 그 외 예외는 에러 경계로 그대로 올린다.
  const detail = await getOwnedOrderDetail(orderId, session.userId).catch(
    (error) => {
      if (
        error instanceof AppError &&
        (error.category === "NOT_FOUND" || error.category === "FORBIDDEN")
      ) {
        notFound();
      }
      throw error;
    },
  );

  return <OrderDetailTemplate order={detail.order} payment={detail.payment} />;
};

export default Page;
