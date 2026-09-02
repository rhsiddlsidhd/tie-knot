import mongoose from "mongoose";
import type { GuestbookType } from "@/core/schemas/request/guestbook.schema";

export const buildGuestbookInput = (
  overrides?: Partial<GuestbookType>,
): GuestbookType => ({
  publicKey: new mongoose.Types.ObjectId().toString(),
  author: "하객1",
  password: "1234",
  message: "결혼 축하드립니다!",
  isPrivate: false,
  ...overrides,
});
