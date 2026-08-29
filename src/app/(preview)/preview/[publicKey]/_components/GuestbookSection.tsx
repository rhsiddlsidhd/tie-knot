"use client";

import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/ui/fetcher";
import { Button } from "@/ui/components/atoms";
import { EyebrowSection } from "./EyebrowSection";
import { PenLine, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GuestbookListResponse } from "@/core/schemas";
import { useGuestbookModalStore } from "@/ui/stores";
import { mapDataToGuestbookProps } from "../_utils/guestbookSection.mapper";

const buildKey = (publicKey: string, cursor?: string) => {
  const params = new URLSearchParams({ publicKey });
  if (cursor) params.set("cursor", cursor);
  return `/api/guestbook?${params.toString()}`;
};

export function GuestbookSection({ publicKey }: { publicKey: string }) {
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

  // 새로 불러온 항목은 별도 초기화 없이도 isDelete[id]가 undefined(falsy)라 기본
  // 애니메이션 상태(opacity 1)와 동일하다 — 매 렌더 재계산되는 items를 의존성에
  // 넣어 매 렌더 setState하던 원래 초기화 effect는 무한 렌더 루프였다.
  const [isDelete] = useState<Record<string, boolean>>({});

  const observerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isValidating) return;
    const el = observerRef.current;
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
          <div
            ref={scrollContainerRef}
            className="max-h-[480px] overflow-y-auto"
          >
            <ul className="space-y-4 py-2">
              {data && items.length === 0 && (
                <li className="text-muted-foreground py-6 text-center">
                  등록된 방명록이 없습니다.
                </li>
              )}

              {data &&
                items.map((item) => (
                  <li
                    className="border-border bg-card relative flex items-start gap-3 rounded-lg border p-3 shadow-sm"
                    key={item.id}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{
                        opacity: !isDelete[item.id] ? 1 : 0,
                        y: !isDelete[item.id] ? 0 : -10,
                      }}
                      className="relative min-w-0 flex-1"
                    >
                      <p className="text-foreground truncate text-start text-sm font-semibold">
                        {item.author}
                      </p>
                      <p className="overflow-scroll-hidden wrap-break-words text-muted-foreground mt-1 line-clamp-3 overflow-hidden text-sm">
                        {item.message}
                      </p>
                      <motion.button
                        initial={{ opacity: 0, y: -10 }}
                        animate={{
                          opacity: !isDelete[item.id] ? 1 : 0,
                          y: !isDelete[item.id] ? 0 : -10,
                        }}
                        className="absolute top-0 right-0 cursor-pointer"
                        onClick={() =>
                          setIsOpen({
                            isOpen: true,
                            type: "DELETE_GUESTBOOK",
                            payload: item.id,
                          })
                        }
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  </li>
                ))}

              {!data && (
                <li className="text-muted-foreground py-6 text-center">
                  방명록을 불러오는 중입니다.
                </li>
              )}

              {hasMore && <div ref={observerRef} className="h-4" />}
            </ul>
          </div>
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
