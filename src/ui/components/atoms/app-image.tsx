"use client";

import { cn } from "@/core/utils/cn";
import { ImageOff } from "lucide-react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { useState } from "react";

interface AppImageProps {
  src: string | StaticImageData;
  alt?: string;
  sizes?: string;
  className?: string;
  preload?: boolean;
  loading?: "eager" | "lazy";
  zoomOnHover?: boolean;
}

const AppImage = ({
  src,
  alt = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  className,
  preload = false,
  loading,
  zoomOnHover = false,
}: AppImageProps) => {
  const [failedSrc, setFailedSrc] = useState<AppImageProps["src"] | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt || "이미지를 불러올 수 없습니다"}
        className={cn(
          "bg-muted flex h-full w-full items-center justify-center",
          className,
        )}
      >
        <ImageOff
          aria-hidden="true"
          className="text-muted-foreground h-6 w-6"
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      sizes={sizes}
      fill
      alt={alt}
      className={cn(
        "object-cover",
        zoomOnHover &&
          "transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06]",
        className,
      )}
      preload={preload}
      loading={loading}
      onError={() => setFailedSrc(src)}
    />
  );
};

export { AppImage };
