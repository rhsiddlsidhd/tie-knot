import type { APIRouteResponse } from "@/boundary";
import { routeError, routeSuccess } from "@/boundary";
import type { InvitationEditor } from "@/core/domain";
import { getOwnedInvitationByOrder, requireAuth } from "@/services";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<APIRouteResponse<InvitationEditor | null>> => {
  try {
    const { orderId } = await params;
    const { userId } = await requireAuth();
    const invitation = await getOwnedInvitationByOrder(orderId, userId);
    if (!invitation) return routeSuccess(null);
    return routeSuccess({
      publicKey: invitation.publicKey,
      status: invitation.status,
      groom: invitation.groom,
      bride: invitation.bride,
      weddingDate: invitation.weddingDate,
      venue: invitation.venue,
      address: invitation.address,
      addressDetail: invitation.addressDetail,
      subwayStation: invitation.subwayStation,
      guestbookEnabled: invitation.guestbookEnabled,
      thumbnailImages: invitation.thumbnailImages,
      galleryImages: invitation.galleryImages,
    });
  } catch (error) {
    return routeError(error);
  }
};
