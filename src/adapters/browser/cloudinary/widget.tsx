"use client";

import { useEffect, useState } from "react";
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

  if (!config) {
    return children({ isLoading: true, open: () => undefined });
  }

  return (
    <CldUploadWidget
      config={{ cloud: config }}
      options={{
        apiKey: config.apiKey,
        cloudName: config.cloudName,
        cropping: true,
        folder,
        multiple: false,
        resourceType: "image",
        sources: ["local", "url", "camera"],
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
      }}
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
    >
      {({ isLoading = false, open }) => children({ isLoading, open })}
    </CldUploadWidget>
  );
};

export { CloudinaryWidget };
