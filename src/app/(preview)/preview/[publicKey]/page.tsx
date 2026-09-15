import { isMobileInvitationExpired } from "@/core/utils/mobile-invitation";
import { getPublishedMobileInvitationByPublicKey } from "@/services/mobile-invitation";
import { MobileInvitationTemplate } from "@/app/(preview)/preview/[publicKey]/_components/MobileInvitationTemplate";
import { MobileInvitationNotice } from "@/app/(preview)/preview/[publicKey]/_components/MobileInvitationNotice";

export const revalidate = 300;

export default async function Page({ params }: { params: Promise<{ publicKey: string }> }) {
  const { publicKey } = await params;
  const invitation = await getPublishedMobileInvitationByPublicKey(publicKey);

  if (!invitation || invitation.status === "draft") {
    return (
      <MobileInvitationNotice
        title="준비 중인 청첩장입니다"
        description="곧 소중한 소식을 전해드릴게요."
      />
    );
  }
  if (isMobileInvitationExpired(invitation.content.weddingDate)) {
    return (
      <MobileInvitationNotice
        title="종료된 청첩장입니다"
        description="tie-knot에서 새로운 시작을 위한 모바일 청첩장을 만나보세요."
      />
    );
  }
  // theme은 저장 시점 스냅샷(invitation.content.theme)을 쓴다 — 상품 theme을 매번
  // 라이브 조회하지 않는다, 관리자가 나중에 상품 theme을 바꿔도 이미 발행된
  // 청첩장은 조용히 안 바뀐다.
  return <MobileInvitationTemplate content={invitation.content} publicKey={publicKey} features={invitation.features} theme={invitation.content.theme} />;
}
