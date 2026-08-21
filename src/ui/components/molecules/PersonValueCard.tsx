import { Badge, Card, TypographyLarge, TypographyMuted } from "@/ui/components/atoms";
import { ClipboardButton } from "./ClipboardButton";

interface PersonValueCardProps {
  relation: string;
  name: string;
  subLabel?: string;
  value: string;
  isCopied: boolean;
  onCopy: () => void;
  ariaLabel?: string;
}

/**
 * 계좌 정보(AccountSection)/연락처(ViewContact) 둘 다 "관계 배지 + 이름 + 복사 가능한
 * 값" 구조가 동일해서 승격한 molecule이다. 왼쪽(배지/이름/보조라벨)은 세로로 3단
 * 쌓아서 값 영역과 너비를 다투지 않게 하고, 오른쪽 값은 `whitespace-nowrap`으로
 * 강제 한 줄 처리한다 — 계좌번호처럼 긴 값도 줄바꿈 없이 보이도록 오른쪽 비율을
 * 왼쪽보다 넉넉히 준다(1:1.35).
 */
export function PersonValueCard({
  relation,
  name,
  subLabel,
  value,
  isCopied,
  onCopy,
  ariaLabel,
}: PersonValueCardProps) {
  return (
    <Card
      className="p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
      role="article"
      aria-label={ariaLabel}
    >
      <div className="grid grid-cols-[1fr_1.35fr] items-center gap-3">
        <div className="flex min-w-0 flex-col items-start gap-1 text-left">
          <Badge variant="outline" className="font-normal opacity-80">
            {relation}
          </Badge>
          <TypographyLarge className="[word-break:keep-all] font-bold">
            {name}
          </TypographyLarge>
          {subLabel && <TypographyMuted className="text-sm">{subLabel}</TypographyMuted>}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <TypographyLarge className="whitespace-nowrap text-right font-mono text-sm tracking-tighter sm:text-base">
            {value}
          </TypographyLarge>
          <ClipboardButton isCopied={isCopied} onCopy={onCopy} />
        </div>
      </div>
    </Card>
  );
}
