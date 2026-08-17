import "server-only";
import type { IGuestbook } from "@/models";
import { GuestbookModel } from "@/models";
import type { GuestbookType } from "@/core/schemas";
import { dbConnect } from "@/db";
import { AppError } from "@/core/domain";
import { comparePasswords, hashPassword } from "@/adapters/bcrypt";

import mongoose from "mongoose";

export const createGuestbookService = async ({
  data,
}: {
  data: GuestbookType;
}) => {
  await dbConnect();

  return GuestbookModel.create(data).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "방명록 등록에 실패했습니다.",
    );
  });
};

export const getGuestbookService = async (
  id: string,
): Promise<IGuestbook[]> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(id)) {
    return [];
  }

  const coupleInfoId = new mongoose.Types.ObjectId(id);
  const guestbooks = await GuestbookModel.find({ coupleInfoId })
    .select("-__v -password -updatedAt")
    .sort({
      createdAt: -1,
    })
    .lean();
  return guestbooks.map((guestbook) => ({
    ...guestbook,
    _id: guestbook._id.toString(),
    coupleInfoId: guestbook.coupleInfoId.toString(),
  }));
};

export const getPrivateGuestbookService = async (
  id: string,
): Promise<IGuestbook | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(id)) {
    return null;
  }

  const _id = new mongoose.Types.ObjectId(id);
  const guestbook = await GuestbookModel.findById(_id).lean();

  if (!guestbook) return null;

  return {
    ...guestbook,
    _id: guestbook._id.toString(),
    coupleInfoId: guestbook.coupleInfoId.toString(),
  };
};

export const deleteGuestbookService = async (
  id: string,
): Promise<{ acknowledged: boolean; deletedCount: number }> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }

  const _id = new mongoose.Types.ObjectId(id);
  const result = await GuestbookModel.deleteOne({ _id });

  return result;
};

export async function createGuestbookWithPasswordService(
  data: GuestbookType,
): Promise<void> {
  await createGuestbookService({
    data: { ...data, password: await hashPassword(data.password) },
  });
}

export async function deleteGuestbookWithPasswordService({
  guestbookId,
  password,
}: {
  guestbookId: string;
  password: string;
}): Promise<void> {
  const guestbook = await getPrivateGuestbookService(guestbookId);
  if (!guestbook) {
    throw new AppError("NOT_FOUND", "해당 게시글을 찾을 수 없습니다.");
  }
  if (!(await comparePasswords(password, guestbook.password))) {
    throw new AppError("UNAUTHENTICATED", "비밀번호가 일치하지 않습니다.");
  }
  const result = await deleteGuestbookService(guestbookId);
  if (!result.acknowledged || result.deletedCount === 0) {
    throw new AppError("INTERNAL", "게시글 삭제에 실패했습니다.");
  }
}
