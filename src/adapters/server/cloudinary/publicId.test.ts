import { describe, it, expect } from "vitest";
import { extractPublicId } from "./publicId";

describe("extractPublicId", () => {
  it("버전 세그먼트가 있는 URL에서 publicId를 추출한다", () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/v1690000000/products/thumbnails/abc123.jpg";

    expect(extractPublicId(url)).toBe("products/thumbnails/abc123");
  });

  it("버전 세그먼트가 없는 URL도 처리한다", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/products/images/xyz.png";

    expect(extractPublicId(url)).toBe("products/images/xyz");
  });

  it("/upload/가 없는 URL이면 null을 리턴한다", () => {
    expect(extractPublicId("https://example.com/products/images/xyz.png")).toBeNull();
  });

  it("빈 문자열이면 null을 리턴한다", () => {
    expect(extractPublicId("")).toBeNull();
  });
});
