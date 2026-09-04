export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getOwnedMobileInvitationPreviewByOrder } from "@/services/mobile-invitation";
import { getProductService } from "@/services/product";
import { verifySession } from "@/services/auth";
import { MobileInvitationTemplate } from "@/app/(preview)/preview/[publicKey]/_components/MobileInvitationTemplate";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await verifySession();
  const preview = await getOwnedMobileInvitationPreviewByOrder(orderId, session.userId);
  if (!preview) notFound();
  const { invitation, features } = preview;
  const product = await getProductService(invitation.productId.toString());
  return <MobileInvitationTemplate content={invitation} publicKey={invitation.publicKey} features={features} theme={product?.theme ?? "default"} />;
}
