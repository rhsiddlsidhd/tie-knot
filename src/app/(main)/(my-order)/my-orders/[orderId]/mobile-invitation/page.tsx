export const dynamic = "force-dynamic";

import { getOwnedMobileInvitationByOrder } from "@/services/mobile-invitation";
import { verifySession } from "@/services/auth";
import { MobileInvitationStatusControls } from "@/app/(main)/(my-order)/my-orders/[orderId]/mobile-invitation/_containers/MobileInvitationStatusControls";
import { MobileInvitationForm } from "@/app/(main)/(my-order)/my-orders/[orderId]/mobile-invitation/_containers/MobileInvitationForm";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await verifySession();
  const invitation = await getOwnedMobileInvitationByOrder(orderId, session.userId);
  return (
    <main>
      <MobileInvitationStatusControls orderId={orderId} status={invitation?.status} />
      <MobileInvitationForm />
    </main>
  );
}
