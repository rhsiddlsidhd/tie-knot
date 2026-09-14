import "server-only";
import type { Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";
import type { MobileInvitationTheme } from "@/core/domain/theme";
import { MOBILE_INVITATION_THEMES } from "@/core/domain/theme";

interface MobileInvitationPerson {
  name: string;
  phone: string;
}

interface MobileInvitationParent extends MobileInvitationPerson {
  bankName?: string;
  accountNumber?: string;
}

interface MobileInvitationSide extends MobileInvitationPerson {
  bankName?: string;
  accountNumber?: string;
  father?: MobileInvitationParent;
  mother?: MobileInvitationParent;
}

interface MobileInvitationDocument {
  _id: Types.ObjectId;
  publicKey: string;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  status: "draft" | "published";
  theme: MobileInvitationTheme;
  groom: MobileInvitationSide;
  bride: MobileInvitationSide;
  weddingDate: Date;
  venue: string;
  address: string;
  addressDetail: string;
  subwayStation?: string;
  guestbookEnabled: boolean;
  thumbnailImages: string[];
  galleryImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ParentSchema = new Schema<MobileInvitationParent>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bankName: String,
    accountNumber: String,
  },
  { _id: false },
);

const SideSchema = new Schema<MobileInvitationSide>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bankName: String,
    accountNumber: String,
    father: ParentSchema,
    mother: ParentSchema,
  },
  { _id: false },
);

const MobileInvitationSchema = new Schema<MobileInvitationDocument>(
  {
    publicKey: { type: String, required: true, unique: true, immutable: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
    theme: {
      type: String,
      enum: MOBILE_INVITATION_THEMES,
      default: "default",
      required: true,
    },
    groom: { type: SideSchema, required: true },
    bride: { type: SideSchema, required: true },
    weddingDate: { type: Date, required: true },
    venue: { type: String, required: true },
    address: { type: String, required: true },
    addressDetail: { type: String, required: true },
    subwayStation: String,
    guestbookEnabled: { type: Boolean, default: false },
    thumbnailImages: { type: [String], default: [] },
    galleryImages: { type: [String], default: [] },
  },
  { timestamps: true },
);

const MobileInvitationModel =
  (mongoose.models.MobileInvitation as Model<MobileInvitationDocument>) ||
  mongoose.model<MobileInvitationDocument>(
    "MobileInvitation",
    MobileInvitationSchema,
  );

export {
  MobileInvitationModel,
  type MobileInvitationPerson,
  type MobileInvitationParent,
  type MobileInvitationSide,
  type MobileInvitationDocument,
};
