import {
  Empty,
  EmptyHeader,
  EmptyDescription,
} from "@/ui/components/atoms/empty";
import { TypographyH1 } from "@/ui/components/atoms/typography";

interface MobileInvitationNoticeProps {
  title: string;
  description: string;
}

/** 발행 전이거나 종료된 청첩장에 보여주는 안내 화면. */
const MobileInvitationNotice = ({
  title,
  description,
}: MobileInvitationNoticeProps) => (
  <main className="grid min-h-screen place-items-center p-8">
    <Empty>
      <EmptyHeader>
        {/* EmptyTitle은 div라 페이지 단위 안내에 필요한 h1 시맨틱이 없다. */}
        <TypographyH1 className="text-2xl font-bold">{title}</TypographyH1>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </main>
);

export { MobileInvitationNotice };
