import { afterEach, describe, expect, it, vi } from "vitest";
import type { ErrorPayload } from "@/core/domain/error";
import { fetcher } from "./fetcher";

describe("fetcher", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("성공 응답 envelope에서 data를 꺼내 반환한다", async () => {
    const data = { id: "product-1", name: "모바일 청첩장" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data }), {
          status: 200,
        }),
      ),
    );

    await expect(fetcher("/api/products/product-1")).resolves.toEqual(data);
  });

  it("실패 envelope을 ErrorPayload로 정규화해 throw한다", async () => {
    const error: ErrorPayload = {
      category: "NOT_FOUND",
      message: "상품을 찾을 수 없습니다.",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error }), {
          status: 404,
        }),
      ),
    );

    await expect(fetcher("/api/products/missing")).rejects.toEqual(error);
  });

  it("fieldErrors가 포함된 실패 envelope도 그대로 throw한다", async () => {
    const error: ErrorPayload = {
      category: "VALIDATION",
      message: "입력값을 확인해주세요.",
      fieldErrors: { keyword: ["필수 항목입니다."] },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error }), {
          status: 400,
        }),
      ),
    );

    await expect(fetcher("/api/products")).rejects.toEqual(error);
  });

  it("network 자체가 실패하면 정규화 없이 원본 에러를 그대로 전파한다", async () => {
    const networkError = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    await expect(fetcher("/api/products")).rejects.toBe(networkError);
  });
});
