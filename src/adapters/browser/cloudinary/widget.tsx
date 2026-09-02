"use client";

import "client-only";

import { useEffect, useMemo, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";

type UploadWidgetConfig = {
  apiKey: string;
  cloudName: string;
};

type SignatureResponse = {
  success: boolean;
  data?: UploadWidgetConfig & { signature: string };
  error?: { message?: string };
};

interface CloudinaryWidgetProps {
  children: (controls: {
    isLoading: boolean;
    open: () => void;
  }) => React.ReactNode;
  folder: string;
  onError?: () => void;
  onUpload: (url: string) => void;
}

const requestSignature = async (
  body: object,
): Promise<SignatureResponse["data"]> => {
  const response = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as SignatureResponse;

  if (!response.ok || !result.success || !result.data) {
    throw new Error(
      result.error?.message ?? "업로드 서명을 발급하지 못했습니다.",
    );
  }

  return result.data;
};

const CloudinaryWidget = ({
  children,
  folder,
  onError,
  onUpload,
}: CloudinaryWidgetProps) => {
  const [config, setConfig] = useState<UploadWidgetConfig | null>(null);

  useEffect(() => {
    requestSignature({ folder })
      .then(({ apiKey, cloudName }) => setConfig({ apiKey, cloudName }))
      .catch(() => onError?.());
  }, [folder, onError]);

  // CldUploadWidget이 매 렌더 새 options 객체 참조를 옵션 변경으로 오인해
  // 위젯 인스턴스를 다시 만들면서 "이미지 추가"를 반복 클릭할 때 좀비 상태로
  // 멈추는 문제가 있어 참조를 안정시킨다.
  const cloudConfig = useMemo(
    () => (config ? { cloud: config } : undefined),
    [config],
  );
  const widgetOptions = useMemo(
    () =>
      config
        ? {
            apiKey: config.apiKey,
            cloudName: config.cloudName,
            // Crop 단계의 Skip 클릭이 Cloudinary 위젯 자체의 postMessage
            // 버그(PointerEvent DataCloneError)를 트리거해 재오픈 시 위젯이
            // 멈추는 원인이라 크롭 단계를 아예 없앤다.
            cropping: false,
            folder,
            multiple: true,
            resourceType: "image" as const,
            sources: ["local", "url", "camera"] as (
              | "local"
              | "url"
              | "camera"
            )[],
            uploadSignature: async (
              callback: (signature: string) => void,
              paramsToSign: Record<string, unknown>,
            ) => {
              try {
                const result = await requestSignature({ paramsToSign });
                callback(result.signature);
              } catch {
                onError?.();
              }
            },
          }
        : undefined,
    [config, folder, onError],
  );

  if (!config || !cloudConfig || !widgetOptions) {
    return children({ isLoading: true, open: () => undefined });
  }

  return (
    <CldUploadWidget
      config={cloudConfig}
      options={widgetOptions}
      onError={onError}
      onSuccess={(result: CloudinaryUploadWidgetResults) => {
        if (
          typeof result.info === "object" &&
          result.info !== null &&
          "secure_url" in result.info &&
          typeof result.info.secure_url === "string"
        ) {
          onUpload(result.info.secure_url);
        }
      }}
      // 파일 큐 처리가 끝나면 위젯을 명시적으로 닫는다 — 안 닫으면 iframe이
      // 화면에 남아 그 아래 폼 버튼(예: "상품 등록") 클릭을 가로막는다.
      onQueuesEnd={(_result, { close }) => close()}
    >
      {({ isLoading = false, open }) => children({ isLoading, open })}
    </CldUploadWidget>
  );
};

export { CloudinaryWidget };
