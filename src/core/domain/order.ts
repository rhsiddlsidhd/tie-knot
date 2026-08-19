import type { PayMethod } from "./payment";

// 결제완료 후 couple-info(청첩장 콘텐츠)를 이 기간(일) 안에 입력하지 않으면
// 자동취소+환불 대상이 된다.
export const COUPLE_INFO_DEADLINE_DAYS = 7;

export type OrderJSON = {
  _id: string;
  merchantUid: string;
  coupleInfoId?: string;
  userId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  product: {
    productId: string;
    title: string;
    thumbnail: string;
    pricing: { originalPrice: number; discountedPrice: number };
    quantity: number;
    selectedFeatures: Array<{
      featureId: string;
      code: string;
      label: string;
      price: number;
    }>;
  };
  finalPrice: number;
  discountRate: number;
  discountAmount: number;
  payMethod: PayMethod;
  orderStatus: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  paymentId?: string;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
};
