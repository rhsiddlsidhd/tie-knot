export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getOwnedInvitationPreviewByOrder, getProductService, verifySession } from "@/services";
import { InvitationTemplate } from "../../../../../../(preview)/preview/[publicKey]/_components";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await verifySession();
  const preview = await getOwnedInvitationPreviewByOrder(orderId, session.userId);
  if (!preview) notFound();
  const { invitation, features } = preview;
  const product = await getProductService(invitation.productId.toString());
  return <InvitationTemplate content={invitation} publicKey={invitation.publicKey} features={features} theme={product?.theme ?? "default"} />;
}
