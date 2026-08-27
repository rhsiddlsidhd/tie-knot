import "server-only";
import type { Types, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";
import type { UserRole } from "@/core/domain";

export type { UserRole } from "@/core/domain";
export interface BaseUser {
  email: string;
  name: string;
  phone: string;
  password: string;
}

export interface IUser extends BaseUser {
  _id: Types.ObjectId;
  role: UserRole;
  isDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// 관리자 전역 사용자 목록(전체) 전용 — getAdminUsersPageService의
// (createdAt desc, _id desc) 정렬을 인덱스로 전부 커버한다. 이전엔 이 조회를
// 지원하는 인덱스가 전혀 없어 COLLSCAN + blocking in-memory SORT로 떨어졌다.
userSchema.index({ createdAt: -1, _id: -1 });

// 관리자 전역 사용자 목록의 역할 필터 조회 전용.
userSchema.index({ role: 1, createdAt: -1, _id: -1 });

export const UserModel =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
