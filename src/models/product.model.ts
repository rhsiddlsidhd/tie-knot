import "server-only";
import type { Model } from "mongoose";
import mongoose, { model, Schema } from "mongoose";
import type { ProductCategory, SubCategory } from "@/core/domain/product-category";
import type { MobileInvitationTheme } from "@/core/domain/theme";
import type { ProductStatus } from "@/core/domain/product";
import { SUB_CATEGORY_MAP, PRODUCT_CATEGORIES } from "@/core/domain/product-category";
import { MOBILE_INVITATION_THEMES } from "@/core/domain/theme";

export { SUB_CATEGORY_MAP };

export type Status = ProductStatus;

const discountSchema = new Schema(
  {
    discountType: {
      type: String,
      enum: ["rate", "amount"],
      default: "rate",
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator(this: { discountType?: string }, value: number) {
          return this.discountType !== "rate" || value <= 1;
        },
        message: "할인율은 100% 이하여야 합니다.",
      },
    },
  },
  { _id: false },
);

export interface ProductDB {
  authorId: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  category: ProductCategory;
  subCategory: SubCategory;
  isPremium: boolean;
  featureIds?: mongoose.Types.ObjectId[];
  isFeatured: boolean;
  priority: number;
  likes: mongoose.Types.ObjectId[];
  views: number;
  salesCount: number;
  discount: {
    discountType: "rate" | "amount";
    value: number;
  };
  status: Status;
  // 스키마가 default: null이라 모든 문서에 항상 존재한다 — optional이 아니라 nullable.
  deletedAt: Date | null;
  images: string[];
  minQuantity: number;
  maxQuantity: number;
  // Review 컬렉션 aggregate 결과 캐시 — 리뷰 write마다 services/review.ts가 재계산해 갱신한다.
  ratingAverage: number;
  ratingCount: number;
}

export interface IProduct extends ProductDB {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// mobile-invitation 카테고리 전용 필드 — mongoose discriminator로 base(IProduct)에 병합된다.
export interface IMobileInvitationProduct extends IProduct {
  previewUrl?: string;
  theme?: MobileInvitationTheme;
}

const productSchema = new Schema<IProduct>(
  {
    authorId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
      validate: {
        validator: async function (
          this: mongoose.Document<unknown, unknown, IProduct> | mongoose.Query<unknown, IProduct>,
          value: string,
        ) {
          let category = this.get("category") as ProductCategory | undefined;
          if (!category && "getQuery" in this) {
            const existing = await (this.model as mongoose.Model<IProduct>)
              .findOne(this.getQuery())
              .select("category")
              .lean();
            // 대상 문서가 아예 없으면 subCategory 유효성을 판단할 근거가 없다 —
            // false로 떨어뜨려 ValidationError(INTERNAL)를 내면 findOneAndUpdate가
            // 원래 냈어야 할 "매치 없음"(→ NOT_FOUND) 결과를 가로채게 된다. 검증을
            // 건너뛰어 update 자체가 매치 없이 끝나도록 위임한다.
            if (!existing) return true;
            category = existing.category;
          }
          // 카테고리가 5종으로 늘면서 SUB_CATEGORY_MAP 인덱싱 결과가 카테고리별로 다른
          // 리터럴 튜플 타입의 union이 된다 — 명시적으로 readonly string[]로 넓혀야
          // .includes()가 "not assignable to parameter of type 'never'"로 막히지 않는다.
          const allowed: readonly string[] | undefined =
            SUB_CATEGORY_MAP[category as ProductCategory];
          return allowed?.includes(value) ?? false;
        },
        message: (props: { value: string }) =>
          `'${props.value}'는 해당 카테고리에서 허용되지 않는 subCategory입니다.`,
      },
    },
    isFeatured: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    views: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    discount: {
      type: discountSchema,
      default: () => ({ discountType: "rate", value: 0 }),
    },
    isPremium: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "soldOut", "deleted"],
      default: "active",
    },
    featureIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Feature" }],
      default: [],
    },
    deletedAt: { type: Date, default: null },
    images: { type: [String], default: [] },
    minQuantity: { type: Number, required: true, default: 1, min: 1 },
    maxQuantity: { type: Number, required: true, default: 0, min: 0 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    // 이미 존재하는 category 필드를 판별키로 재사용한다 — 카테고리별 discriminator를
    // 추가할 때 새 필드를 만들지 않는다(src/models/AGENTS.md 참고).
    discriminatorKey: "category",
  },
);

// 공개 상품 목록 cursor 페이징(getPublicProductsPageService) 전용 — equality 필드
// (deletedAt/status/category)를 앞에, 정렬 필드(isFeatured/priority/createdAt/_id)를
// 뒤에 두는 순서를 따른다(mongoose 공식 문서 compound index 가이드). subCategory는
// 쿼리에 있을 때만 equality로 쓰여 아래 index만으로는 커버되지 않아, subCategory
// 포함/미포함 두 쿼리 모양을 각각 커버하는 index 두 개를 둔다(order.model.ts가 이미
// 같은 방식으로 쿼리 모양별 index를 여러 개 두고 있다).
productSchema.index({
  deletedAt: 1,
  status: 1,
  category: 1,
  isFeatured: -1,
  priority: -1,
  createdAt: -1,
  _id: -1,
});
productSchema.index({
  deletedAt: 1,
  status: 1,
  category: 1,
  subCategory: 1,
  isFeatured: -1,
  priority: -1,
  createdAt: -1,
  _id: -1,
});

export const ProductModel =
  (mongoose.models.Product as Model<IProduct>) ||
  model<IProduct>("Product", productSchema);

const mobileInvitationProductSchema = new Schema<IMobileInvitationProduct>({
  previewUrl: { type: String },
  theme: { type: String, enum: MOBILE_INVITATION_THEMES, default: "default" },
});

// discriminator 이름("mobile-invitation")이 곧 category 필드에 저장되는 값이다 —
// 기존 category enum 값과 그대로 일치시킨다. HMR 재컴파일 시 이미 등록된
// discriminator를 재사용해 "Cannot overwrite discriminator" 에러를 피한다.
export const MobileInvitationProductModel =
  (ProductModel.discriminators?.["mobile-invitation"] as Model<IMobileInvitationProduct>) ||
  ProductModel.discriminator<IMobileInvitationProduct>(
    "mobile-invitation",
    mobileInvitationProductSchema,
  );
