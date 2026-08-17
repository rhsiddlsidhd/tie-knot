"use server";

import type { APIResponse } from "@/core/domain";
import { createCoupleInfoWorkflow } from "@/services";
import { actionError } from "@/boundary";
import { validateAndFlatten } from "@/core/utils";
import { coupleInfoSchema } from "@/core/schemas";

export const createCoupleInfo = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string; _id: string }>> => {
  const thumbnailRaw = formData.get("thumbnailSource") as string;
  const galleryRaw = formData.get("gallerySource") as string;

  const galleryData: string[] = galleryRaw ? JSON.parse(galleryRaw) : [];

  // Helper to build parent data only if name is provided
  const buildParentData = (prefix: string) => {
    const name = formData.get(`${prefix}_name`) as string;
    const phone = formData.get(`${prefix}_phone`) as string;
    const bankName = formData.get(`${prefix}_bank_name`) as string;
    const accountNumber = formData.get(`${prefix}_account_number`) as string;

    if (!name || !phone || !bankName || !accountNumber) return undefined;

    return {
      name,
      phone,
      bankName,
      accountNumber,
    };
  };

  const data = {
    groom: {
      name: formData.get("groom_name") as string,
      phone: formData.get("groom_phone") as string,
      bankName: formData.get("groom_bank_name") as string,
      accountNumber: formData.get("groom_account_number") as string,
      father: buildParentData("groom_parents_father"),
      mother: buildParentData("groom_parents_mother"),
    },
    bride: {
      name: formData.get("bride_name") as string,
      phone: formData.get("bride_phone") as string,
      bankName: formData.get("bride_bank_name") as string,
      accountNumber: formData.get("bride_account_number") as string,
      father: buildParentData("bride_parents_father"),
      mother: buildParentData("bride_parents_mother"),
    },
    weddingDate: formData.get("wedding_date") as string,
    weddingTime: formData.get("wedding_time") as string,
    venue: formData.get("venue_name") as string,
    address: formData.get("venue_address") as string,
    addressDetail: formData.get("venue_address_detail") as string,
    subwayStation: formData.get("subway_station") as string,
    guestbookEnabled: formData.get("guestbook_enabled") === "on",
    thumbnailImages: thumbnailRaw ? JSON.parse(thumbnailRaw) : [],
    galleryImages: galleryData,
  };

  const parsed = validateAndFlatten(coupleInfoSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: parsed.error },
    };
  }

  try {
    const orderId = formData.get("orderId") as string | null;
    const coupleInfoId = await createCoupleInfoWorkflow(parsed.data, orderId ?? undefined);

    return {
      success: true,
      data: {
        message: "커플 정보가 성공적으로 등록되었습니다.",
        _id: coupleInfoId,
      },
    };
  } catch (e) {
    return actionError(e);
  }
};
