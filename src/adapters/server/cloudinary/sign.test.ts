import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("cloudinary", () => ({
  v2: {
    utils: {
      api_sign_request: vi.fn().mockReturnValue("mock-signature"),
    },
  },
}));

import { v2 as cloudinary } from "cloudinary";
import { signUploadRequest } from "./sign";

describe("signUploadRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("folder로 서명 정보를 생성한다", () => {
    const result = signUploadRequest("products");

    expect(result.signature).toBe("mock-signature");
    expect(result.folder).toBe("products");
    expect(result.allowed_formats).toBe("jpg,png,webp,jpeg");
    expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
      expect.objectContaining({ folder: "products" }),
      process.env.CLOUDINARY_API_SECRET,
    );
  });

  it("위젯이 전달한 크롭 파라미터와 timestamp를 그대로 서명한다", () => {
    const paramsToSign = {
      folder: "products/images",
      timestamp: 1234567890,
      source: "uw",
      custom_coordinates: "1,2,3,4",
    };

    const result = signUploadRequest("products/images", paramsToSign);

    expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET,
    );
    expect(result.timestamp).toBe(1234567890);
  });
});
