"use client";

import { Button } from "@/ui/components/atoms/button";
import { EyebrowSection } from "./EyebrowSection";
import { GuestbookList } from "./GuestbookList";
import { PenLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/core/domain/cursor";
import { routes } from "@/core/domain/routes";
import { useGuestbookDemo } from "@/ui/context/guestbookDemo/provider";
import { useGuestbookModalStore } from "@/ui/stores/use-app-store";

// 데모 방명록은 실제 API를 호출하지 않는다 — 목데이터를 로컬에서 페이지 크기만큼
// 순차로 드러내는 방식으로 LiveGuestbookSection의 커서 무한스크롤 UX를 흉내낸다.
export function DemoGuestbookSection() {
  const [{ entries }] = useGuestbookDemo();
  const setIsOpen = useGuestbookModalStore((state) => state.setIsOpen);
  const [revealedCount, setRevealedCount] = useState(DEFAULT_PAGE_SIZE);

  const items = entries
    .slice(0, revealedCount)
    .map(({ id, author, message }) => ({ id, author, message }));
  const hasMore = revealedCount < entries.length;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealedCount((count) =>
            Math.min(count + DEFAULT_PAGE_SIZE, entries.length),
          );
        }
      },
      { root: scrollContainerRef.current, rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, entries.length]);

  return (
    <EyebrowSection eyebrow="GUESTBOOK" heading="방명록">
      <div className="flex flex-col items-center gap-4">
        <div className="h-full">
          <GuestbookList
            status="ready"
            items={items}
            hasMore={hasMore}
            scrollContainerRef={scrollContainerRef}
            sentinelRef={sentinelRef}
            onDeleteClick={(id) =>
              setIsOpen({
                isOpen: true,
                type: "DELETE_GUESTBOOK",
                payload: { id, publicKey: routes.preview.samplePublicKey },
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
              payload: { publicKey: routes.preview.samplePublicKey },
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
