import { afterAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { AppError } from "@/core/domain";
import { dbConnect } from "@/db";
import { InvitationModel, OrderModel } from "@/models";
import {
  buildCoupleInfoInput,
  buildOrderInput,
  clearCollections,
} from "@testing/support";
import { saveInvitationForOrder } from "./invitation";

describe("invitation", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const createEligibleOrder = async (userId: string) => {
    const input = buildOrderInput({ userId });
    return OrderModel.create({
      ...input,
      merchantUid: `ORDER-${new mongoose.Types.ObjectId().toString()}`,
      orderStatus: "CONFIRMED",
      finalPrice: input.product.pricing.discountedPrice,
    });
  };

  const buildContent = () => {
    const { userId: _userId, ...content } = buildCoupleInfoInput();
    return content;
  };

  it("22자 base64url 공개 키를 발급한다", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const order = await createEligibleOrder(userId);

    const invitation = await saveInvitationForOrder(
      order._id.toString(),
      userId,
      buildContent(),
    );

    expect(invitation.publicKey).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it("같은 주문을 수정하면 기존 공개 키를 유지한다", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const order = await createEligibleOrder(userId);
    const first = await saveInvitationForOrder(
      order._id.toString(),
      userId,
      buildContent(),
    );

    const second = await saveInvitationForOrder(order._id.toString(), userId, {
      ...buildContent(),
      venue: "변경된 예식장",
    });

    expect(second._id.toString()).toBe(first._id.toString());
    expect(second.publicKey).toBe(first.publicKey);
    expect(second.venue).toBe("변경된 예식장");
  });

  it("같은 사용자의 서로 다른 주문에 별도 청첩장을 생성한다", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const firstOrder = await createEligibleOrder(userId);
    const secondOrder = await createEligibleOrder(userId);

    const first = await saveInvitationForOrder(
      firstOrder._id.toString(),
      userId,
      buildContent(),
    );
    const second = await saveInvitationForOrder(
      secondOrder._id.toString(),
      userId,
      buildContent(),
    );

    expect(second._id.toString()).not.toBe(first._id.toString());
    expect(second.publicKey).not.toBe(first.publicKey);
    expect(await InvitationModel.countDocuments({ userId })).toBe(2);
  });

  it("다른 사용자의 주문이면 FORBIDDEN을 던진다", async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const order = await createEligibleOrder(ownerId);

    await expect(
      saveInvitationForOrder(
        order._id.toString(),
        new mongoose.Types.ObjectId().toString(),
        buildContent(),
      ),
    ).rejects.toMatchObject({ category: "FORBIDDEN" });
    await expect(
      saveInvitationForOrder(
        order._id.toString(),
        new mongoose.Types.ObjectId().toString(),
        buildContent(),
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("결제 완료 전 주문이면 VALIDATION을 던진다", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const input = buildOrderInput({ userId });
    const order = await OrderModel.create({
      ...input,
      merchantUid: `ORDER-${new mongoose.Types.ObjectId().toString()}`,
      orderStatus: "PENDING",
      finalPrice: input.product.pricing.discountedPrice,
    });

    await expect(
      saveInvitationForOrder(order._id.toString(), userId, buildContent()),
    ).rejects.toMatchObject({ category: "VALIDATION" });
  });
});
