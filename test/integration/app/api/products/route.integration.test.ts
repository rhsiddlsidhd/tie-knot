// @vitest-environment node
//
// GET /api/products는 상품 목록 "더보기" 전용 route.ts다 — 첫 페이지는
// Server Component(page.tsx)가 getPublicProductsPageService를 직접 호출하고,
// 이 route.ts는 cursor 기반 다음 페이지 요청과 category/subCategory 필터를 검증한다
// (feat/product-list-cursor-pagination, issue #81).
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/db/connect";
import { buildProductInput, clearCollections } from "@test/support";
import { createProductService } from "@/services/product";
import { GET } from "@/app/api/products/route";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

const buildRequest = (query: string) =>
  new NextRequest(`http://localhost/api/products${query}`);

describe("GET /api/products", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("category 파라미터 없이 호출하면 전체 상품을 페이지 envelope으로 반환한다", async () => {
    await createProductService(buildProductInput({ title: "상품1" }));
    await createProductService(buildProductInput({ title: "상품2" }));

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(2);
    expect(body.data.nextCursor).toBeNull();
  });

  it("category=mobile-invitation으로 필터링하면 해당 카테고리 상품만 반환한다", async () => {
    await createProductService(
      buildProductInput({ title: "상품1", category: MOBILE_INVITATION_CATEGORY }),
    );

    const res = await GET(buildRequest(`?category=${MOBILE_INVITATION_CATEGORY}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].category).toBe(MOBILE_INVITATION_CATEGORY);
  });

  it("subCategory로 필터링하면 해당 subCategory 상품만 반환한다", async () => {
    await createProductService(
      buildProductInput({ title: "청첩장", subCategory: "wedding" }),
    );
    await createProductService(
      buildProductInput({ title: "돌잔치 초대장", subCategory: "first-birthday" }),
    );

    const res = await GET(
      buildRequest(`?category=${MOBILE_INVITATION_CATEGORY}&subCategory=wedding`),
    );
    const body = await res.json();

    expect(body.data.items.map((p: { title: string }) => p.title)).toEqual(["청첩장"]);
  });

  it("PRODUCT_CATEGORIES에 없는 category 값이면 400 VALIDATION 에러를 반환한다 (orderListRequestSchema와 동일한 enum 검증 방침)", async () => {
    await createProductService(buildProductInput({ title: "상품1" }));

    const res = await GET(buildRequest("?category=nonexistent"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.category).toBe("VALIDATION");
  });

  it("active이면서 삭제되지 않은 공개 상품만 반환한다", async () => {
    await createProductService(buildProductInput({ title: "공개상품" }));
    await createProductService(
      buildProductInput({ title: "비활성상품", status: "inactive" }),
    );
    await createProductService(
      buildProductInput({ title: "품절상품", status: "soldOut" }),
    );

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items.map((product: { title: string }) => product.title)).toEqual([
      "공개상품",
    ]);
  });

  it("잘못된 형식의 cursor면 400 VALIDATION 에러를 반환한다", async () => {
    const res = await GET(buildRequest("?cursor=not-a-valid-cursor"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.category).toBe("VALIDATION");
  });
});
