// @vitest-environment node
//
// route.ts 고유 계약(HTTP status + 응답 envelope + 세션 요구)을 실제 DB까지 관통시켜
// 검증한다. 필터·커서 자체의 동작은 서비스 integration(src/services/order.integration.test.ts)이
// 담당하므로 여기서 다시 나열하지 않는다.
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/db/connect";
import { AppError } from "@/core/domain/error";
import {
  buildOrderInput,
  buildProductInput,
  clearCollections,
} from "@test/support";
import { ProductModel } from "@/models/product.model";
import type * as AuthServiceModule from "@/services/auth";
import { createOrderService } from "@/services/order";
import { createProductService } from "@/services/product";
import { GET } from "@/app/api/orders/route";

const { authState } = vi.hoisted(() => ({
  authState: { userId: "" as string | null },
}));

// 세션만 대체한다 — 쿠키/JWT 발급은 이 라우트의 검증 대상이 아니다(partial mock).
vi.mock("@/services/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof AuthServiceModule>();
  return {
    ...actual,
    requireAuth: async () => {
      if (!authState.userId) {
        throw new AppError("UNAUTHENTICATED", "인증이 필요합니다.");
      }
      return {
        userId: authState.userId,
        email: "buyer@example.com",
        role: "USER",
      };
    },
  };
});

const buildRequest = (query = "") =>
  new NextRequest(`http://localhost/api/orders${query}`);

describe("GET /api/orders — 통합(DB~route)", () => {
  let productId: string;

  beforeEach(async () => {
    await dbConnect();
    await clearCollections();

    const productInput = buildProductInput({ minQuantity: 1, maxQuantity: 0 });
    await createProductService(productInput);
    const product = await ProductModel.findOne({
      title: productInput.title,
    }).lean();
    productId = product!._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const createOrderFor = async (userId: string) => {
    const input = buildOrderInput({ userId });
    return createOrderService({
      ...input,
      product: { ...input.product, productId },
    });
  };

  it("세션이 없으면 401을 반환한다", async () => {
    authState.userId = null;

    const res = await GET(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.category).toBe("UNAUTHENTICATED");
  });

  it("골든패스: 본인 주문 페이지를 envelope에 담아 반환한다", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    authState.userId = userId;
    const order = await createOrderFor(userId);
    await createOrderFor(new mongoose.Types.ObjectId().toString());

    const res = await GET(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]._id).toBe(order._id.toString());
    expect(body.data.nextCursor).toBe(null);
  });

  it("허용되지 않은 status 값은 400을 반환한다", async () => {
    authState.userId = new mongoose.Types.ObjectId().toString();

    const res = await GET(buildRequest("?status=NOT_A_STATUS"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.category).toBe("VALIDATION");
  });

  it("형식이 깨진 커서는 400을 반환한다", async () => {
    authState.userId = new mongoose.Types.ObjectId().toString();

    const res = await GET(buildRequest("?cursor=!!broken!!"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.category).toBe("VALIDATION");
  });
});
