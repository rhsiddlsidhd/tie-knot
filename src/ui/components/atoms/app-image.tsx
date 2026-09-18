"use client";

import { cn } from "@/core/utils/cn";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { useState } from "react";
import { cloudinaryImageLoader } from "@/ui/utils/image-loader";

const FALLBACK_SRC = "/assets/images/default/placeholder.svg";

interface AppImageProps {
  src: string | StaticImageData;
  alt?: string;
  sizes?: string;
  className?: string;
  loading?: "eager" | "lazy";
  zoomOnHover?: boolean;
}

const AppImage = ({
  src,
  alt = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  className,
  loading,
  zoomOnHover = false,
}: AppImageProps) => {
  const [failedSrc, setFailedSrc] = useState<AppImageProps["src"] | null>(null);
  const isImageUnavailable = !src || failedSrc === src;
  const resolvedSrc = isImageUnavailable ? FALLBACK_SRC : src;
  const isCloudinarySrc =
    typeof resolvedSrc === "string" && resolvedSrc.includes("res.cloudinary.com");

  return (
    <Image
      src={resolvedSrc}
      loader={isCloudinarySrc ? cloudinaryImageLoader : undefined}
      sizes={sizes}
      fill
      alt={isImageUnavailable ? alt || "이미지를 불러올 수 없습니다" : alt}
      className={cn(
        "object-cover",
        zoomOnHover &&
          "transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06]",
        className,
      )}
      loading={loading}
      onError={() => setFailedSrc(src)}
    />
  );
};

export { AppImage };
