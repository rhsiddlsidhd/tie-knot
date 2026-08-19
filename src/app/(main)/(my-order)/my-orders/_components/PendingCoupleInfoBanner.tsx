import Link from "next/link";
import { Edit } from "lucide-react";
import { Button } from "@/ui/components/atoms";
import { Alert } from "@/ui/components/molecules";
import { routes } from "@/core/domain";

interface PendingCoupleInfoBannerProps {
  orderId: string;
  daysLeft?: number;
}

const PendingCoupleInfoBanner = ({
  orderId,
  daysLeft,
}: PendingCoupleInfoBannerProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Alert는 children을 <p>로 감싸므로 블록 요소를 중첩하지 않는다 —
          <p> 안의 <div>는 SSR 하이드레이션 불일치를 만든다. */}
      <Alert type="warning">
        <span className="block">
          청첩장 정보가 아직 입력되지 않았어요. 정보를 입력하면 바로 확인할 수
          있어요.
        </span>
        {daysLeft !== undefined && (
          <span className="block font-semibold">
            {daysLeft >= 0
              ? `D-${daysLeft}, 이후 자동취소·환불`
              : "입력 기한이 지나 자동취소·환불 대상입니다"}
          </span>
        )}
      </Alert>
      <Button size="lg" variant="outline" asChild>
        <Link href={routes.myOrders.invitation(orderId)}>
          <Edit className="mr-1 h-4 w-4" />
          정보 입력하기
        </Link>
      </Button>
    </div>
  );
};

export { PendingCoupleInfoBanner };
