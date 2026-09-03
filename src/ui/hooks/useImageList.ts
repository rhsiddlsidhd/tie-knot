"use client";

import { useRef, useState } from "react";

export type ImageItem = { id: string; preview: string; url: string };

export function useImageList(defaultUrls?: string[]) {
  // 훅 인스턴스별로 격리된 단조 증가 카운터. render 중이 아니라 add()가
  // 실제로 호출되는 시점(이벤트 핸들러)에만 읽고 증가시킨다 — render 중 ref
  // 접근은 react-hooks/refs 위반이라 아래 초기화 분기에서는 쓰지 않는다.
  const nextId = useRef(0);

  const [items, setItems] = useState<ImageItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // defaultUrls가 준비되면 한 번만 초기화 (SWR 비동기 로드 대응).
  // 초기 항목은 배열 index로 결정적 id를 부여해 이후 add()의 카운터 id와
  // 겹치지 않는다("init-" 접두사로 네임스페이스 분리).
  if (!initialized && defaultUrls?.length) {
    setInitialized(true);
    setItems(
      defaultUrls.map((url, index) => ({
        id: `init-${index}`,
        preview: url,
        url,
      })),
    );
  }

  const add = (urls: string[]) =>
    setItems((prev) => [
      ...prev,
      ...urls.map((url) => ({
        id: String(nextId.current++),
        preview: url,
        url,
      })),
    ]);

  const remove = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const getUrls = (): string[] => items.map((item) => item.url);

  return { items, add, remove, getUrls };
}
