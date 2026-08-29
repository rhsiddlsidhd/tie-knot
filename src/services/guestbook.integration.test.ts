import { afterAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { AppError } from "@/core/domain";
import { dbConnect } from "@/db";
import { GuestbookModel, InvitationModel } from "@/models";
import { buildGuestbookInput, clearCollections } from "@testing/support";
import {
  createGuestbookService,
  deleteGuestbookService,
  getGuestbookService,
  getPrivateGuestbookService,
} from "./guestbook";

describe("guestbook", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const createInvitation = async () => {
    const userId = new mongoose.Types.ObjectId();
    const invitation = await InvitationModel.create({
      publicKey: "published-invitation-key",
      userId,
      orderId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      status: "published",
      groom: { name: "신랑", phone: "010-1111-2222" },
      bride: { name: "신부", phone: "010-3333-4444" },
      weddingDate: new Date("2026-12-25T13:00:00"),
      venue: "예식장",
      address: "서울시 강남구",
      addressDetail: "3층",
      guestbookEnabled: true,
      thumbnailImages: [],
      galleryImages: [],
    });
    return { invitation, userId: userId.toString() };
  };

  it("publicKey로 게시된 청첩장에 방명록을 생성한다", async () => {
    const { invitation } = await createInvitation();
    const input = buildGuestbookInput({ publicKey: invitation.publicKey });

    const result = await createGuestbookService({ data: input });

    expect(result.author).toBe(input.author);
    expect(result.invitationId.toString()).toBe(invitation._id.toString());
  });

  it("draft 청첩장에는 방명록을 생성하지 않는다", async () => {
    const { invitation } = await createInvitation();
    await InvitationModel.updateOne(
      { _id: invitation._id },
      { status: "draft" },
    );

    await expect(
      createGuestbookService({
        data: buildGuestbookInput({ publicKey: invitation.publicKey }),
      }),
    ).rejects.toMatchObject({ category: "NOT_FOUND" });
  });

  it("비인증 요청에는 공개 글만 반환한다", async () => {
    const { invitation } = await createInvitation();
    await GuestbookModel.create([
      {
        invitationId: invitation._id,
        author: "공개 작성자",
        message: "공개 글",
        password: "hashed-password",
        isPrivate: false,
      },
      {
        invitationId: invitation._id,
        author: "비공개 작성자",
        message: "비공개 글",
        password: "hashed-password",
        isPrivate: true,
      },
    ]);

    const result = await getGuestbookService(invitation.publicKey);

    expect(result.items.map((entry) => entry.message)).toEqual(["공개 글"]);
  });

  it("비소유자는 draft 청첩장의 방명록을 조회할 수 없다", async () => {
    const { invitation } = await createInvitation();
    await InvitationModel.updateOne(
      { _id: invitation._id },
      { status: "draft" },
    );
    await GuestbookModel.create({
      invitationId: invitation._id,
      author: "공개 작성자",
      message: "공개 글",
      password: "hashed-password",
      isPrivate: false,
    });

    expect(await getGuestbookService(invitation.publicKey)).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it("소유자 요청에는 공개 글과 비공개 글을 모두 반환한다", async () => {
    const { invitation, userId } = await createInvitation();
    await GuestbookModel.create([
      {
        invitationId: invitation._id,
        author: "공개 작성자",
        message: "공개 글",
        password: "hashed-password",
        isPrivate: false,
      },
      {
        invitationId: invitation._id,
        author: "비공개 작성자",
        message: "비공개 글",
        password: "hashed-password",
        isPrivate: true,
      },
    ]);

    const result = await getGuestbookService(invitation.publicKey, {
      viewerUserId: userId,
    });

    expect(result.items.map((entry) => entry.message).sort()).toEqual([
      "공개 글",
      "비공개 글",
    ]);
  });

  it("알 수 없는 publicKey면 빈 페이지를 반환한다", async () => {
    expect(await getGuestbookService("missing-public-key")).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it("필수 필드 누락으로 저장에 실패하면 INTERNAL을 던진다", async () => {
    const { invitation } = await createInvitation();
    const input = buildGuestbookInput({
      publicKey: invitation.publicKey,
      author: undefined as unknown as string,
    });

    await expect(
      createGuestbookService({ data: input }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(createGuestbookService({ data: input })).rejects.toMatchObject(
      {
        category: "INTERNAL",
      },
    );
  });

  it("내부 조회와 삭제는 유효하지 않은 id를 정상적인 미존재로 처리한다", async () => {
    expect(await getPrivateGuestbookService("not-a-valid-id")).toBeNull();
    expect(await deleteGuestbookService("not-a-valid-id")).toEqual({
      acknowledged: false,
      deletedCount: 0,
    });
  });
});
