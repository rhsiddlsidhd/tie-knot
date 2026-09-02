export const dynamic = "force-dynamic";

import { getOwnedInvitationByOrder } from "@/services/invitation";
import { verifySession } from "@/services/auth";
import { InvitationStatusControls } from "./_components";
import { InvitationForm } from "./_containers";

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
