import "server-only";

import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { unstable_cache } from "next/cache";
import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
import type { MobileInvitationTheme } from "@/core/domain/theme";
import { AppError } from "@/core/domain/error";
import type { MobileInvitationContentSchemaDto } from "@/core/schemas/request/mobileInvitationContent.schema";
import type { IMobileInvitation } from "@/models/mobile-invitation.model";
import { MobileInvitationModel } from "@/models/mobile-invitation.model";
import { OrderModel } from "@/models/order.model";
import { dbConnect } from "@/db/connect";
import { requireAuth } from "./auth";
import { isValidSubwayStationName } from "./subway";
import { getProductService } from "./product";

export const mobileInvitationCacheTag = (publicKey: string) =>
  `mobile-invitation:${publicKey}`;

const createPublicKey = (): string => randomBytes(16).toString("base64url");

const toInternalError = (error: unknown, fallbackMessage: string): AppError =>
  new AppError(
    "INTERNAL",
    error instanceof Error ? error.message : fallbackMessage,
  );

const toContent = (invitation: IMobileInvitation): MobileInvitationContent => ({
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
  theme: invitation.theme,
});

const toStoredContent = (
  data: MobileInvitationContentSchemaDto,
  theme: MobileInvitationTheme,
) => ({
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
  theme,
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

export const saveMobileInvitationForOrder = async (
  orderId: string,
  userId: string,
  data: MobileInvitationContentSchemaDto,
): Promise<IMobileInvitation> => {
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
  // 상품 theme을 저장 시점에 스냅샷한다 — 관리자가 나중에 상품 theme을 바꿔도
  // 이미 저장된 청첩장은 다시 저장하기 전까지 조용히 안 바뀐다.
  const product = await getProductService(order.product.productId.toString());
  const theme: MobileInvitationTheme = product?.theme ?? "default";
  try {
    const existing = await MobileInvitationModel.findOne({
      orderId: ids.orderId,
      userId: ids.userId,
    });
    if (existing) {
      existing.set({
        ...toStoredContent(data, theme),
        orderId: ids.orderId,
        productId: ids.productId,
      });
      await existing.save();
      return existing.toObject();
    }
    const created = await MobileInvitationModel.create({
      ...ids,
      ...toStoredContent(data, theme),
      publicKey: createPublicKey(),
      status: "draft",
    });
    return created.toObject();
  } catch (error) {
    throw toInternalError(error, "청첩장 저장에 실패했습니다.");
  }
};

export const saveMobileInvitationForCurrentUser = async (
  orderId: string,
  data: MobileInvitationContentSchemaDto,
): Promise<IMobileInvitation> => {
  const { userId } = await requireAuth();
  return saveMobileInvitationForOrder(orderId, userId, data);
};

export const getOwnedMobileInvitationByOrder = async (
  orderId: string,
  userId: string,
): Promise<IMobileInvitation | null> => {
  await dbConnect();
  await requireOwnedEligibleOrder(orderId, userId);
  if (!mongoose.isObjectIdOrHexString(orderId)) return null;
  return MobileInvitationModel.findOne({
    orderId: new mongoose.Types.ObjectId(orderId),
  }).lean();
};

export const getOwnedMobileInvitationPreviewByOrder = async (
  orderId: string,
  userId: string,
): Promise<
  | { invitation: IMobileInvitation; features: string[] }
  | null
> => {
  await dbConnect();
  const order = await requireOwnedEligibleOrder(orderId, userId);
  const invitation = await MobileInvitationModel.findOne({
    orderId: order._id,
  }).lean();
  if (!invitation) return null;
  return {
    invitation,
    features: order.product.selectedFeatures.map((feature) => feature.code),
  };
};

const findPublishedMobileInvitationByPublicKey = async (
  publicKey: string,
): Promise<
  | { status: "draft" }
  | {
      status: "published";
      content: MobileInvitationContent;
      productId: string;
      features: string[];
    }
  | null
> => {
  await dbConnect();
  const invitation = await MobileInvitationModel.findOne({ publicKey }).lean();
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

export const getPublishedMobileInvitationByPublicKey = async (publicKey: string) =>
  unstable_cache(
    () => findPublishedMobileInvitationByPublicKey(publicKey),
    ["published-invitation", publicKey],
    { tags: [mobileInvitationCacheTag(publicKey)], revalidate: 300 },
  )();

export const setMobileInvitationStatusForCurrentUser = async (
  orderId: string,
  status: "draft" | "published",
): Promise<{ publicKey: string; status: "draft" | "published" }> => {
  await dbConnect();
  const { userId } = await requireAuth();
  const order = await requireOwnedEligibleOrder(orderId, userId);
  const invitation = await MobileInvitationModel.findOneAndUpdate(
    {
      orderId: new mongoose.Types.ObjectId(orderId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: { status } },
    { new: true, runValidators: true },
  ).catch((error: unknown) => {
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
