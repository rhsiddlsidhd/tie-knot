"use client";

import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/ui/fetcher";
import { Button } from "@/ui/components/atoms/button";
import { EyebrowSection } from "../_components/EyebrowSection";
import { GuestbookList } from "../_components/GuestbookList";
import { PenLine } from "lucide-react";
import React, { useEffect, useRef } from "react";
import type { GuestbookListResponse } from "@/core/schemas/response/guestbook.schema";
import { useGuestbookModalStore } from "@/ui/stores/use-app-store";
import { mapDataToGuestbookProps } from "../_utils/guestbookSection.mapper";

const buildKey = (publicKey: string, cursor?: string) => {
  const params = new URLSearchParams({ publicKey });
  if (cursor) params.set("cursor", cursor);
  return `/api/guestbook?${params.toString()}`;
};

export function LiveGuestbookSection({ publicKey }: { publicKey: string }) {
  const { data, size, setSize, isValidating, mutate } =
    useSWRInfinite<GuestbookListResponse>(
      (pageIndex, previousPage) => {
        if (pageIndex === 0) return buildKey(publicKey);
        if (!previousPage?.nextCursor) return null;
        return buildKey(publicKey, previousPage.nextCursor);
      },
      fetcher,
      { revalidateOnFocus: false },
    );

  const setIsOpen = useGuestbookModalStore((state) => state.setIsOpen);
  const isOpen = useGuestbookModalStore((state) => state.isOpen);
  const modalType = useGuestbookModalStore((state) => state.type);
  const wasOpenRef = useRef(isOpen);

  // 방명록 작성/삭제 모달이 닫힐 때 누적된 모든 페이지를 다시 검증한다 —
  // 새 글은 1페이지 맨 위에, 삭제된 글은 목록에서 빠진 상태로 반영된다
  // (OrderList.tsx의 onOrderChanged={() => mutate()}와 동일한 전체 재검증 패턴).
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (
      wasOpen &&
      !isOpen &&
      (modalType === "WRITE_GUESTBOOK" || modalType === "DELETE_GUESTBOOK")
    ) {
      mutate();
    }
  }, [isOpen, modalType, mutate]);

  const pages = data ?? [];
  const { data: items } = mapDataToGuestbookProps(publicKey, pages);
  const hasMore = Boolean(pages.at(-1)?.nextCursor);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isValidating) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSize(size + 1);
      },
      { root: scrollContainerRef.current, rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isValidating, size, setSize]);

  return (
    <EyebrowSection eyebrow="GUESTBOOK" heading="방명록">
      <div className="flex flex-col items-center gap-4">
        <div className="h-full">
          <GuestbookList
            status={data ? "ready" : "loading"}
            items={items}
            hasMore={hasMore}
            scrollContainerRef={scrollContainerRef}
            sentinelRef={sentinelRef}
            onDeleteClick={(id) =>
              setIsOpen({
                isOpen: true,
                type: "DELETE_GUESTBOOK",
                payload: { id, publicKey },
              })
            }
          />
        </div>

        <Button
          variant="secondary"
          onClick={() =>
            setIsOpen({
              isOpen: true,
              type: "WRITE_GUESTBOOK",
              payload: { publicKey },
            })
          }
          className="w-full gap-2 px-8 py-6 sm:w-auto"
        >
          <PenLine className="h-5 w-5" />
          <span className="font-semibold">방명록 작성하기</span>
        </Button>
      </div>
    </EyebrowSection>
  );
}
