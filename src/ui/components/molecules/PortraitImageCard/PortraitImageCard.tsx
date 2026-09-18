import type { ReactNode } from "react";
import { cn } from "@/core/utils/cn";
import { AppImage } from "@/ui/components/atoms/app-image";
import { Card, CardContent } from "@/ui/components/atoms/card";

interface PortraitImageCardProps {
  src: string;
  alt: string;
  sizes: string;
  loading?: "eager" | "lazy";
  zoomOnHover?: boolean;
  className?: string;
  children?: ReactNode;
}

// 세로형(황금비 1:1.618) 이미지 프레임 — 카드 위에 무엇을 얹을지(뱃지, 가격, 오버레이
// 버튼 등)는 소비처가 children으로 직접 조립한다. 이 컴포넌트는 링크나 클릭 같은
// 인터랙션을 갖지 않는다 — 인터랙션 방식(전체 카드를 Link로 감쌀지, 일부만 버튼으로
// 둘지)은 소비처마다 다르기 때문이다.
const PortraitImageCard = ({
  src,
  alt,
  sizes,
  loading,
  zoomOnHover = false,
  className,
  children,
}: PortraitImageCardProps) => {
  return (
    <Card
      className={cn(
        "group relative aspect-[1/1.618] overflow-hidden border-0 p-0 shadow-none",
        className,
      )}
    >
      <CardContent className="absolute inset-0 p-0">
        <AppImage
          src={src}
          alt={alt}
          sizes={sizes}
          loading={loading}
          zoomOnHover={zoomOnHover}
        />
      </CardContent>
      {children}
    </Card>
  );
};

export { PortraitImageCard };
