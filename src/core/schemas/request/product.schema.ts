import * as z from "zod";
import { INVITATION_THEMES, SUB_CATEGORY_MAP, PRODUCT_CATEGORIES } from "@/core/domain";

export const productSchema = z
  .object({
    title: z.string().min(1, "상품명을 입력해주세요."),
    description: z.string().min(10, "상품 설명은 최소 10자 이상이어야 합니다."),
    category: z.enum(PRODUCT_CATEGORIES),
    subCategory: z.string().min(1, "서브 카테고리를 선택해주세요."),
    theme: z.enum(INVITATION_THEMES).optional(),
    price: z
      .number()
      .int("가격은 원 단위 정수로 입력해주세요.")
      .min(0, "가격은 0 이상이어야 합니다."),
    isPremium: z.boolean(),
    featureIds: z.array(z.string()).optional(),
    isFeatured: z.boolean(),
    priority: z.number(),
    discount: z
      .discriminatedUnion("discountType", [
        z.object({
          discountType: z.literal("rate"),
          value: z.number().min(0).max(1, "할인율은 100% 이하여야 합니다."),
        }),
        z.object({
          discountType: z.literal("amount"),
          value: z.number().int("할인액은 원 단위 정수로 입력해주세요.").min(0),
        }),
      ])
      .optional(),
    status: z.enum(["active", "inactive", "soldOut", "deleted"]).optional(),
    thumbnail: z.string().url("유효한 썸네일 URL이어야 합니다."),

    // ── 신규 (REQ-2 / REQ-3) ─────────────────────────────
    images: z.array(z.string().url("유효한 URL이어야 합니다.")).default([]),
    minQuantity: z
      .number()
      .int("최소 구매 수량은 정수여야 합니다.")
      .min(1, "최소 구매 수량은 1 이상이어야 합니다.")
      .default(1),
    maxQuantity: z
      .number()
      .int("최대 구매 수량은 정수여야 합니다.")
      .min(0, "최대 구매 수량은 0 이상이어야 합니다.") // 0 = 무제한
      .default(0),
  })
  .refine(
    (data) => {
      if (data.isPremium && (!data.featureIds || data.featureIds.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "옵션을 선택해주세요.",
      path: ["featureIds"],
    },
  )
  .refine(
    (data) => {
      // 카테고리가 5종으로 늘면서 SUB_CATEGORY_MAP 인덱싱 결과가 카테고리별로 다른
      // 리터럴 튜플 타입의 union이 된다 — 명시적으로 readonly string[]로 넓혀야
      // .includes()가 "Argument of type X is not assignable to parameter of type
      // 'never'"로 막히지 않는다(TS가 union 전체에 공통되는 오버로드를 못 찾음).
      const allowed: readonly string[] | undefined =
        SUB_CATEGORY_MAP[data.category as keyof typeof SUB_CATEGORY_MAP];
      return allowed?.includes(data.subCategory) ?? false;
    },
    {
      message: "해당 카테고리에서 허용되지 않는 서브 카테고리입니다.",
      path: ["subCategory"],
    },
  )
  // invitation은 previewUrl이 상세 확인을 대신하므로 images 없이도 판매 성립.
  // 물리 상품 4종(favor/accessory/guestbook/ceremony)은 최소 1장 필요.
  .refine((data) => data.category === "invitation" || data.images.length > 0, {
    message: "상세 이미지를 1장 이상 등록해주세요.",
    path: ["images"],
  })
  // maxQuantity 0(무제한)은 하한 비교 대상이 아니다.
  .refine(
    (data) => data.maxQuantity === 0 || data.maxQuantity >= data.minQuantity,
    {
      message: "최대 구매 수량은 최소 구매 수량보다 크거나 같아야 합니다.",
      path: ["maxQuantity"],
    },
  );

export type ProductDto = z.infer<typeof productSchema>;
