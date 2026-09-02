import "server-only";
import type { IGuestbook } from "@/models/guestbook.model";
import { GuestbookModel } from "@/models/guestbook.model";
import { InvitationModel } from "@/models/invitation.model";
import type { GuestbookType } from "@/core/schemas";
import { dbConnect } from "@/db/connect";
import type { GuestbookListPage } from "@/core/domain";
import { AppError, DEFAULT_PAGE_SIZE } from "@/core/domain";
import { comparePasswords, hashPassword } from "@/adapters/server/bcrypt";
import { decodeCursor, encodeCursor } from "@/core/utils";

import mongoose from "mongoose";

export const createGuestbookService = async ({
  data,
}: {
  data: GuestbookType;
}) => {
  await dbConnect();

  const invitation = await InvitationModel.findOne({
    publicKey: data.publicKey,
    status: "published",
  }).lean();
  if (!invitation)
    throw new AppError("NOT_FOUND", "청첩장을 찾을 수 없습니다.");
  const entry = {
    author: data.author,
    password: data.password,
    message: data.message,
    isPrivate: data.isPrivate,
  };
  return GuestbookModel.create({
    ...entry,
    invitationId: invitation._id,
  }).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "방명록 등록에 실패했습니다.",
    );
  });
};

export const getGuestbookService = async (
  publicKey: string,
  { cursor, viewerUserId }: { cursor?: string; viewerUserId?: string } = {},
): Promise<GuestbookListPage> => {
  await dbConnect();

  const invitation = await InvitationModel.findOne({ publicKey })
    .select("_id userId status")
    .lean();
  if (!invitation) return { items: [], nextCursor: null };

  const isOwner = viewerUserId === invitation.userId.toString();
  if (!isOwner && invitation.status !== "published")
    return { items: [], nextCursor: null };

  const filter: Record<string, unknown> = {
    invitationId: invitation._id,
    ...(isOwner ? {} : { isPrivate: false }),
  };

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
    filter.$or = [
      { createdAt: { $lt: decoded.createdAt } },
      {
        createdAt: decoded.createdAt,
        _id: { $lt: new mongoose.Types.ObjectId(decoded.id) },
      },
    ];
  }

  const found = await GuestbookModel.find(filter)
    .select("-__v -password -updatedAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(DEFAULT_PAGE_SIZE + 1)
    .lean()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "방명록 조회에 실패했습니다.",
      );
    });

  const hasMore = found.length > DEFAULT_PAGE_SIZE;
  const items = hasMore ? found.slice(0, DEFAULT_PAGE_SIZE) : found;
  const last = items.at(-1);

  return {
    items: items.map((guestbook) => ({
      id: guestbook._id.toString(),
      author: guestbook.author,
      message: guestbook.message,
      isPrivate: guestbook.isPrivate,
      createdAt: guestbook.createdAt,
    })),
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt, id: last._id.toString() })
        : null,
  };
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
    invitationId: guestbook.invitationId.toString(),
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
