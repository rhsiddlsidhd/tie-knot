export const dynamic = "force-dynamic";

import { getOwnedInvitationByOrder, verifySession } from "@/services";
import { InvitationForm, InvitationStatusControls } from "./_components";

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
