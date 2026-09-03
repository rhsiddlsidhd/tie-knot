import { cn } from "@/core/utils/cn";

interface HoverDarkenOverlayProps {
  className?: string;
}

// 부모(형제 요소들을 감싸는 카드)가 group 클래스를 가져야 반응한다 —
// 이미지 자체의 애니메이션이 아니라 이미지 위에 얹는 별도 tint 레이어다.
function HoverDarkenOverlay({ className }: HoverDarkenOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
        className,
      )}
    />
  );
}

export { HoverDarkenOverlay };
