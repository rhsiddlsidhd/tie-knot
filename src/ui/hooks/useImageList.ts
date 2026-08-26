"use client";

import { useState } from "react";

export type ImageItem = { id: string; preview: string; url: string };

const toImageItem = (url: string): ImageItem => ({
  id: crypto.randomUUID(),
  preview: url,
  url,
});

export function useImageList(defaultUrls?: string[]) {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // defaultUrls가 준비되면 한 번만 초기화 (SWR 비동기 로드 대응)
  if (!initialized && defaultUrls?.length) {
    setInitialized(true);
    setItems(defaultUrls.map(toImageItem));
  }

  const add = (urls: string[]) =>
    setItems((prev) => [...prev, ...urls.map(toImageItem)]);

  const remove = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const getUrls = (): string[] => items.map((item) => item.url);

  return { items, add, remove, getUrls };
}
