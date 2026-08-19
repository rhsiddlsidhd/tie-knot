import "server-only";
import type { Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface InvitationPerson {
  name: string;
  phone: string;
}

export interface InvitationParent extends InvitationPerson {
  bankName?: string;
  accountNumber?: string;
}

export interface InvitationSide extends InvitationPerson {
  bankName?: string;
  accountNumber?: string;
  father?: InvitationParent;
  mother?: InvitationParent;
}

export interface IInvitation {
  _id: Types.ObjectId;
  publicKey: string;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  status: "draft" | "published";
  groom: InvitationSide;
  bride: InvitationSide;
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

const parentSchema = new Schema<InvitationParent>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bankName: String,
    accountNumber: String,
  },
  { _id: false },
);

const sideSchema = new Schema<InvitationSide>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bankName: String,
    accountNumber: String,
    father: parentSchema,
    mother: parentSchema,
  },
  { _id: false },
);

const invitationSchema = new Schema<IInvitation>(
  {
    publicKey: { type: String, required: true, unique: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", required: true },
    groom: { type: sideSchema, required: true },
    bride: { type: sideSchema, required: true },
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

export const InvitationModel =
  (mongoose.models.Invitation as Model<IInvitation>) ||
  mongoose.model<IInvitation>("Invitation", invitationSchema);
