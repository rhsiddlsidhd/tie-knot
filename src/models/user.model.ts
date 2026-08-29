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
  // 스키마가 default: null이라 모든 문서에 항상 존재한다 — optional이 아니라 nullable.
  deletedAt: Date | null;
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
    deletedAt: { type: Date, default: null },
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
