"use client";
import { cn } from "@/core/utils";
import type { ImageLoaderProps, StaticImageData } from "next/image";
import Image from "next/image";
import React from "react";

const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps) => {
  if (typeof src !== "string" || !src.includes("res.cloudinary.com")) {
    return src;
  }
  const params = [`f_auto`, quality ? `q_${quality}` : `q_auto`, `w_${width}`];

  return src.replace("/upload/", `/upload/${params.join(",")}/`);
};

interface CloudImageProps {
  src: string | StaticImageData;
  alt?: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
}

const CloudImage = ({
  src,
  alt = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  className,
  priority = false,
  loading,
}: CloudImageProps) => {
  if (!src) return null;

  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      sizes={sizes}
      fill
      alt={alt}
      className={cn(`object-cover`, className)}
      priority={priority}
      loading={loading}
    />
  );
};

export { CloudImage };
