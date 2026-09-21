"use client";

import type { ImageLoaderProps } from "next/image";

const cloudinaryImageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const params = [
    `f_auto`,
    quality ? `q_${quality}` : `q_auto`,
    `w_${width}`,
    `c_scale`,
  ];

  return src.replace("/upload/", `/upload/${params.join(",")}/`);
};

export { cloudinaryImageLoader };
