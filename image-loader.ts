"use client";

import type { ImageLoaderProps } from "next/image";

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src.includes("res.cloudinary.com")) {
    return src;
  }

  const params = [`f_auto`, quality ? `q_${quality}` : `q_auto`, `w_${width}`];

  return src.replace("/upload/", `/upload/${params.join(",")}/`);
}
