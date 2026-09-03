import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { validateAndFlattenMock } = vi.hoisted(() => ({
  validateAndFlattenMock: vi.fn(),
}));

vi.mock("@/core/utils/validate-and-flatten", () => ({
  validateAndFlatten: validateAndFlattenMock,
}));
vi.mock("@/core/schemas/request/coupleInfo.schema", () => ({
  coupleInfoClientSchema: {},
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";
import { useImageUpload } from "./useImageUpload";

const buildPayload = () => ({
  thumbnailImages: ["https://example.com/thumb.jpg"],
  galleryImages: ["https://example.com/gallery.jpg"],
});

describe("useImageUpload", () => {
  beforeEach(() => vi.clearAllMocks());

  it("검증 실패 시 null을 반환하고 오류를 알린다", async () => {
    validateAndFlattenMock.mockReturnValue({ success: false });
    const { result } = renderHook(() => useImageUpload());

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.upload(
        new FormData(),
        buildPayload(),
      );
    });

    expect(uploadResult).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("입력값을 확인해주세요");
  });

  it("위젯이 업로드한 URL을 검증 입력에 포함한다", async () => {
    validateAndFlattenMock.mockReturnValue({ success: false });
    const payload = buildPayload();
    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await result.current.upload(new FormData(), payload);
    });

    expect(validateAndFlattenMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining(payload),
    );
  });

  it("검증 성공 시 추가 업로드 없이 URL 배열을 반환한다", async () => {
    const payload = buildPayload();
    validateAndFlattenMock.mockReturnValue({ success: true, data: payload });
    const { result } = renderHook(() => useImageUpload());

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.upload(new FormData(), payload);
    });

    expect(uploadResult).toEqual({
      thumbnailUrls: payload.thumbnailImages,
      galleryUrls: payload.galleryImages,
    });
    expect(result.current.uploadProgress).toBe(100);
    expect(result.current.isUploading).toBe(false);
  });
});
