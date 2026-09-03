export const dynamic = "force-dynamic";

import { getOwnedInvitationByOrder } from "@/services/invitation";
import { verifySession } from "@/services/auth";
import { InvitationStatusControls } from "@/app/(main)/(my-order)/my-orders/[orderId]/invitation/_containers/InvitationStatusControls";
import { InvitationForm } from "@/app/(main)/(my-order)/my-orders/[orderId]/invitation/_containers/InvitationForm";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await verifySession();
  const invitation = await getOwnedInvitationByOrder(orderId, session.userId);
  return (
    <main>
      <InvitationStatusControls orderId={orderId} status={invitation?.status} />
      <InvitationForm />
    </main>
  );
}
