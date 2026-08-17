import "server-only";
import type { CoupleInfoDB } from "@/server/models";
import { CoupleInfoModel } from "@/server/models";
import type { CoupleInfoSchemaDto } from "@/shared/schemas";
import { dbConnect } from "@/server/lib/mongodb";
import type { ICoupleInfo } from "@/shared/types";
import { AppError } from "@/shared/types";

import mongoose from "mongoose";

const toCoupleInfo = (coupleInfo: CoupleInfoDB): ICoupleInfo => ({
  ...coupleInfo,
  _id: coupleInfo._id.toString(),
  userId: coupleInfo.userId.toString(),
});

export const createCoupleInfoService = async (
  data: CoupleInfoSchemaDto & { userId: string },
): Promise<ICoupleInfo> => {
  await dbConnect();

  const weddingDateTime = new Date(`${data.weddingDate}T${data.weddingTime}`);

  const coupleInfo = {
    userId: new mongoose.Types.ObjectId(data.userId),
    groom: data.groom,
    bride: data.bride,
    weddingDate: weddingDateTime,
    venue: data.venue,
    address: data.address,
    addressDetail: data.addressDetail,
    subwayStation: data.subwayStation,
    guestbookEnabled: data.guestbookEnabled,
    thumbnailImages: data.thumbnailImages,
    galleryImages: data.galleryImages,
  };

  const newCoupleInfo = await CoupleInfoModel.create(coupleInfo).catch(
    (err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "커플 정보 생성에 실패했습니다.",
      );
    },
  );

  return toCoupleInfo(newCoupleInfo.toJSON());
};

export const getCoupleInfoById = async (
  coupleInfoId: string,
): Promise<ICoupleInfo | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(coupleInfoId)) {
    return null;
  }

  const coupleInfo = await CoupleInfoModel.findById(
    new mongoose.Types.ObjectId(coupleInfoId),
  ).lean();

  return coupleInfo ? toCoupleInfo(coupleInfo) : null;
};

export const updateCoupleInfoService = async (
  coupleInfoId: string,
  userId: string,
  data: CoupleInfoSchemaDto,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(coupleInfoId)) {
    throw new AppError("NOT_FOUND", "커플 정보를 찾을 수 없습니다.");
  }

  // 1. 권한 확인: 해당 coupleInfo가 현재 유저의 것인지 확인
  const coupleInfo = await CoupleInfoModel.findById(
    new mongoose.Types.ObjectId(coupleInfoId),
  );

  if (!coupleInfo) {
    throw new AppError("NOT_FOUND", "커플 정보를 찾을 수 없습니다.");
  }

  if (coupleInfo.userId.toString() !== userId) {
    throw new AppError("FORBIDDEN", "권한이 없습니다.");
  }

  // 2. weddingDateTime 변환 (createCoupleInfoService와 동일)
  const weddingDateTime = new Date(`${data.weddingDate}T${data.weddingTime}`);

  const updateData = {
    groom: data.groom,
    bride: data.bride,
    weddingDate: weddingDateTime,
    venue: data.venue,
    address: data.address,
    addressDetail: data.addressDetail,
    subwayStation: data.subwayStation,
    guestbookEnabled: data.guestbookEnabled,
    thumbnailImages: data.thumbnailImages,
    galleryImages: data.galleryImages,
  };

  // 3. 업데이트 수행
  const updated = await CoupleInfoModel.findByIdAndUpdate(
    new mongoose.Types.ObjectId(coupleInfoId),
    { $set: updateData },
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "커플 정보 수정에 실패했습니다.",
    );
  });

  return !!updated;
};
