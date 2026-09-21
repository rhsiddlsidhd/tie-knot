import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudinaryWidget } from "./widget";

let capturedOptions: Record<string, unknown> | undefined;

vi.mock("next-cloudinary", () => ({
  CldUploadWidget: ({
    children,
    options,
  }: {
    children: (controls: {
      isLoading: boolean;
      open: () => void;
    }) => React.ReactNode;
    options: Record<string, unknown>;
  }) => {
    capturedOptions = options;
    return children({ isLoading: false, open: vi.fn() });
  },
}));

const buildResponse = (signature: string) =>
  new Response(
    JSON.stringify({
      success: true,
      data: { apiKey: "api-key", cloudName: "cloud", signature },
    }),
  );

const renderWidget = (onUpload = vi.fn()) =>
  render(
    // eslint-disable-next-line react/no-children-prop
    React.createElement(CloudinaryWidget, {
      folder: "products/images",
      onUpload,
      children: ({ open }: { open: () => void }) =>
        React.createElement(
          "button",
          { type: "button", onClick: open },
          "업로드",
        ),
    }),
  );

describe("CloudinaryWidget", () => {
  beforeEach(() => {
    capturedOptions = undefined;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("E2E 모드에서는 외부 위젯 없이 결정적인 업로드 결과를 전달한다", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_E2E_MOCK", "enabled");
    const onUpload = vi.fn();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    renderWidget(onUpload);
    fireEvent.click(screen.getByRole("button", { name: "업로드" }));

    expect(onUpload).toHaveBeenCalledWith(
      "https://res.cloudinary.com/e2e/image/upload/products-images.png",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("크롭 없는 다중 이미지 위젯으로 초기화한다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(buildResponse("bootstrap"));
    renderWidget();

    await waitFor(() => expect(capturedOptions).toBeDefined());
    expect(capturedOptions).toMatchObject({
      cropping: false,
      folder: "products/images",
      multiple: true,
      resourceType: "image",
    });
  });

  it("위젯 최종 파라미터를 기존 서명 API에 전달한다", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(buildResponse("bootstrap"))
      .mockResolvedValueOnce(buildResponse("signed"));
    renderWidget();
    await waitFor(() => expect(capturedOptions).toBeDefined());
    const callback = vi.fn();
    const paramsToSign = {
      folder: "products/images",
      source: "uw",
      timestamp: 123,
    };

    const uploadSignature = capturedOptions?.uploadSignature as (
      callback: (signature: string) => void,
      params: Record<string, unknown>,
    ) => Promise<void>;
    await uploadSignature(callback, paramsToSign);

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/upload/signature",
      expect.objectContaining({ body: JSON.stringify({ paramsToSign }) }),
    );
    expect(callback).toHaveBeenCalledWith("signed");
  });
});
