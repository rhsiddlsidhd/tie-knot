import { isInvitationExpired } from "@/core/utils";
import { getProductService } from "@/services/product";
import { getPublishedInvitationByPublicKey } from "@/services/invitation";
import { InvitationTemplate } from "./_components";

export const revalidate = 300;

export default async function Page({ params }: { params: Promise<{ publicKey: string }> }) {
  const { publicKey } = await params;
  const invitation = await getPublishedInvitationByPublicKey(publicKey);

  if (!invitation || invitation.status === "draft") {
    return <main className="grid min-h-screen place-items-center p-8 text-center"><div><h1 className="text-2xl font-bold">준비 중인 청첩장입니다</h1><p className="mt-3 text-muted-foreground">곧 소중한 소식을 전해드릴게요.</p></div></main>;
  }
  if (isInvitationExpired(invitation.content.weddingDate)) {
    return <main className="grid min-h-screen place-items-center p-8 text-center"><div><h1 className="text-2xl font-bold">종료된 청첩장입니다</h1><p className="mt-3 text-muted-foreground">tie-knot에서 새로운 시작을 위한 모바일 청첩장을 만나보세요.</p></div></main>;
  }
  const product = await getProductService(invitation.productId);
  return <InvitationTemplate content={invitation.content} publicKey={publicKey} features={invitation.features} theme={product?.theme ?? "default"} />;
}
