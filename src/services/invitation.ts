import "server-only";

import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { unstable_cache } from "next/cache";
import type { InvitationContent } from "@/core/domain";
import { AppError } from "@/core/domain";
import type { CoupleInfoSchemaDto } from "@/core/schemas";
import type { IInvitation } from "@/models/invitation.model";
import { InvitationModel } from "@/models/invitation.model";
import { OrderModel } from "@/models/order.model";
import { dbConnect } from "@/db/connect";
import { requireAuth } from "./auth";
import { isValidSubwayStationName } from "./subway";

export const invitationCacheTag = (publicKey: string) =>
  `invitation:${publicKey}`;

const createPublicKey = (): string => randomBytes(16).toString("base64url");

const toInternalError = (error: unknown, fallbackMessage: string): AppError =>
  new AppError(
    "INTERNAL",
    error instanceof Error ? error.message : fallbackMessage,
  );

const toContent = (invitation: IInvitation): InvitationContent => ({
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

const toStoredContent = (data: CoupleInfoSchemaDto) => ({
  groom: data.groom,
  bride: data.bride,
  weddingDate: new Date(`${data.weddingDate}T${data.weddingTime}`),
  venue: data.venue,
  address: data.address,
  addressDetail: data.addressDetail,
  subwayStation: data.subwayStation,
  guestbookEnabled: data.guestbookEnabled,
  thumbnailImages: data.thumbnailImages,
  galleryImages: data.galleryImages,
});

const requireOwnedEligibleOrder = async (orderId: string, userId: string) => {
  if (!mongoose.isObjectIdOrHexString(orderId)) {
    throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  }
  const order = await OrderModel.findById(orderId).lean();
  if (!order) throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  if (order.userId.toString() !== userId) {
    throw new AppError("FORBIDDEN", "본인 주문만 사용할 수 있습니다.");
  }
  if (
    !(["CONFIRMED", "COMPLETED"] as const).includes(
      order.orderStatus as "CONFIRMED" | "COMPLETED",
    )
  ) {
    throw new AppError(
      "VALIDATION",
      "결제가 완료된 주문만 사용할 수 있습니다.",
    );
  }
  return order;
};

export const saveInvitationForOrder = async (
  orderId: string,
  userId: string,
  data: CoupleInfoSchemaDto,
): Promise<IInvitation> => {
  await dbConnect();
  if (
    data.subwayStation &&
    !(await isValidSubwayStationName(data.subwayStation))
  ) {
    throw new AppError("VALIDATION", "존재하지 않는 지하철역입니다.", {
      subwayStation: ["존재하지 않는 지하철역입니다."],
    });
  }
  const order = await requireOwnedEligibleOrder(orderId, userId);
  const ids = {
    userId: new mongoose.Types.ObjectId(userId),
    orderId: order._id,
    productId: new mongoose.Types.ObjectId(order.product.productId),
  };
  try {
    const existing = await InvitationModel.findOne({
      orderId: ids.orderId,
      userId: ids.userId,
    });
    if (existing) {
      existing.set({
        ...toStoredContent(data),
        orderId: ids.orderId,
        productId: ids.productId,
      });
      await existing.save();
      return existing.toObject();
    }
    const created = await InvitationModel.create({
      ...ids,
      ...toStoredContent(data),
      publicKey: createPublicKey(),
      status: "draft",
    });
    return created.toObject();
  } catch (error) {
    throw toInternalError(error, "청첩장 저장에 실패했습니다.");
  }
};

export const saveInvitationForCurrentUser = async (
  orderId: string,
  data: CoupleInfoSchemaDto,
): Promise<IInvitation> => {
  const { userId } = await requireAuth();
  return saveInvitationForOrder(orderId, userId, data);
};

export const getOwnedInvitationByOrder = async (
  orderId: string,
  userId: string,
): Promise<IInvitation | null> => {
  await dbConnect();
  await requireOwnedEligibleOrder(orderId, userId);
  if (!mongoose.isObjectIdOrHexString(orderId)) return null;
  return InvitationModel.findOne({
    orderId: new mongoose.Types.ObjectId(orderId),
  }).lean();
};

export const getOwnedInvitationPreviewByOrder = async (
  orderId: string,
  userId: string,
): Promise<
  | { invitation: IInvitation; features: string[] }
  | null
> => {
  await dbConnect();
  const order = await requireOwnedEligibleOrder(orderId, userId);
  const invitation = await InvitationModel.findOne({
    orderId: order._id,
  }).lean();
  if (!invitation) return null;
  return {
    invitation,
    features: order.product.selectedFeatures.map((feature) => feature.code),
  };
};

const findPublishedInvitationByPublicKey = async (
  publicKey: string,
): Promise<
  | { status: "draft" }
  | {
      status: "published";
      content: InvitationContent;
      productId: string;
      features: string[];
    }
  | null
> => {
  await dbConnect();
  const invitation = await InvitationModel.findOne({ publicKey }).lean();
  if (!invitation) return null;
  if (invitation.status === "draft") return { status: "draft" };
  const order = await OrderModel.findById(invitation.orderId)
    .select("product.selectedFeatures.code")
    .lean();
  return {
    status: "published",
    content: toContent(invitation),
    productId: invitation.productId.toString(),
    features: order?.product.selectedFeatures.map((feature) => feature.code) ?? [],
  };
};

export const getPublishedInvitationByPublicKey = async (publicKey: string) =>
  unstable_cache(
    () => findPublishedInvitationByPublicKey(publicKey),
    ["published-invitation", publicKey],
    { tags: [invitationCacheTag(publicKey)], revalidate: 300 },
  )();

export const setInvitationStatusForCurrentUser = async (
  orderId: string,
  status: "draft" | "published",
): Promise<{ publicKey: string; status: "draft" | "published" }> => {
  await dbConnect();
  const { userId } = await requireAuth();
  const order = await requireOwnedEligibleOrder(orderId, userId);
  const invitation = await InvitationModel.findOneAndUpdate(
    {
      orderId: new mongoose.Types.ObjectId(orderId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: { status } },
    { new: true, runValidators: true },
  ).catch((error) => {
    throw toInternalError(error, "청첩장 상태 변경에 실패했습니다.");
  });
  if (!invitation)
    throw new AppError("NOT_FOUND", "청첩장을 찾을 수 없습니다.");

  // 청첩장 발행이 곧 이 주문의 이행 완료다 — 발행 시점에 주문을 COMPLETED로 전이시켜
  // 목록 배지가 "발행완료"를 그릴 수 있게 한다. 다시 비공개(draft)로 되돌리면 이행
  // 상태도 결제완료(CONFIRMED)로 함께 되돌린다.
  const nextOrderStatus = status === "published" ? "COMPLETED" : "CONFIRMED";
  const previousOrderStatus =
    status === "published" ? "CONFIRMED" : "COMPLETED";
  await OrderModel.updateOne(
    { _id: order._id, orderStatus: previousOrderStatus },
    { $set: { orderStatus: nextOrderStatus } },
    { runValidators: true },
  ).catch((error) => {
    throw toInternalError(error, "주문 상태 변경에 실패했습니다.");
  });

  return { publicKey: invitation.publicKey, status: invitation.status };
};
