import "server-only";
import type { Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";
import type { ICoupleInfo } from "@/shared/types";

// 공통 타입 정의
interface Person {
  name: string;
  phone: string;
}

interface Parent extends Person {
  bankName?: string;
  accountNumber?: string;
}

interface CoupleSide extends Person {
  bankName?: string;
  accountNumber?: string;
  father?: Parent;
  mother?: Parent;
}

export interface CoupleInfoDB extends Omit<ICoupleInfo, "_id" | "userId"> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
}

const ParentSchema = new Schema<Parent>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bankName: { type: String },
    accountNumber: { type: String },
  },
  { _id: false },
);

const CoupleSideSchema = new Schema<CoupleSide>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bankName: { type: String },
    accountNumber: { type: String },
    father: { type: ParentSchema, required: false },
    mother: { type: ParentSchema, required: false },
  },
  { _id: false },
);


const coupleInfoSchema = new Schema<CoupleInfoDB>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groom: {
      type: CoupleSideSchema,
      required: true,
    },
    bride: {
      type: CoupleSideSchema,
      required: true,
    },
    weddingDate: { type: Date, required: true },
    venue: { type: String, required: true },
    address: { type: String, required: true },
    addressDetail: { type: String, required: true },
    subwayStation: { type: String },
    guestbookEnabled: { type: Boolean, default: false },
    thumbnailImages: {
      type: [String],
      default: [],
    },
    galleryImages: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
    },
  },
);

export const CoupleInfoModel =
  (mongoose.models.CoupleInfo as Model<CoupleInfoDB>) ||
  mongoose.model<CoupleInfoDB>("CoupleInfo", coupleInfoSchema);
