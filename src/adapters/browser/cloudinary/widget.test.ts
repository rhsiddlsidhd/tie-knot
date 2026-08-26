import React from "react";
import { render, waitFor } from "@testing-library/react";
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

const renderWidget = () =>
  render(
    // eslint-disable-next-line react/no-children-prop
    React.createElement(CloudinaryWidget, {
      folder: "products/images",
      onUpload: vi.fn(),
      children: () =>
        React.createElement("button", { type: "button" }, "업로드"),
    }),
  );

describe("CloudinaryWidget", () => {
  beforeEach(() => {
    capturedOptions = undefined;
    vi.restoreAllMocks();
  });

  it("크롭 가능한 단일 이미지 위젯으로 초기화한다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(buildResponse("bootstrap"));
    renderWidget();

    await waitFor(() => expect(capturedOptions).toBeDefined());
    expect(capturedOptions).toMatchObject({
      cropping: true,
      folder: "products/images",
      multiple: false,
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
