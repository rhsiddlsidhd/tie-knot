"use client";

import { useState } from "react";
import { toast } from "sonner";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { mobileInvitationContentSchema } from "@/core/schemas/request/mobileInvitationContent.schema";
import type { ImagePayload } from "@/core/domain/image";

export function useImageUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (
    formData: FormData,
    imagePayload: ImagePayload,
  ): Promise<{
    thumbnailUrls: string[];
    galleryUrls: string[];
  } | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. 클라이언트 검증 (텍스트 필드 + 이미지 상태 합산)
      const validated = validateAndFlatten(mobileInvitationContentSchema, {
        ...buildTextData(formData),
        thumbnailImages: imagePayload.thumbnailImages,
        galleryImages: imagePayload.galleryImages,
      });

      if (!validated.success) {
        toast.error("입력값을 확인해주세요");
        return null;
      }

      setUploadProgress(100);
      return {
        thumbnailUrls: validated.data.thumbnailImages,
        galleryUrls: validated.data.galleryImages,
      };
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("이미지 업로드에 실패했습니다");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, uploadProgress, isUploading };
}

function buildTextData(formData: FormData) {
  const buildParent = (prefix: string) => {
    const name = (formData.get(`${prefix}_name`) as string) || "";
    const phone = (formData.get(`${prefix}_phone`) as string) || "";
    if (!name && !phone) return undefined;
    return {
      name,
      phone,
      bankName: (formData.get(`${prefix}_bank_name`) as string) || "",
      accountNumber: (formData.get(`${prefix}_account_number`) as string) || "",
    };
  };

  return {
    groom: {
      name: (formData.get("groom_name") as string) || "",
      phone: (formData.get("groom_phone") as string) || "",
      bankName: (formData.get("groom_bank_name") as string) || "",
      accountNumber: (formData.get("groom_account_number") as string) || "",
      father: buildParent("groom_parents_father"),
      mother: buildParent("groom_parents_mother"),
    },
    bride: {
      name: (formData.get("bride_name") as string) || "",
      phone: (formData.get("bride_phone") as string) || "",
      bankName: (formData.get("bride_bank_name") as string) || "",
      accountNumber: (formData.get("bride_account_number") as string) || "",
      father: buildParent("bride_parents_father"),
      mother: buildParent("bride_parents_mother"),
    },
    weddingDate: (formData.get("wedding_date") as string) || "",
    weddingTime: (formData.get("wedding_time") as string) || "",
    venue: (formData.get("venue_name") as string) || "",
    address: (formData.get("venue_address") as string) || "",
    addressDetail: (formData.get("venue_address_detail") as string) || "",
    subwayStation: (formData.get("subway_station") as string) || undefined,
    guestbookEnabled: formData.get("guestbook_enabled") === "on",
  };
}
