"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { RefObject } from "react";
import type { GuestbookEntryProps } from "../_utils/guestbookSection.mapper";

interface GuestbookListProps {
  status: "loading" | "ready";
  items: GuestbookEntryProps[];
  hasMore: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onDeleteClick: (id: string) => void;
}

export function GuestbookList({
  status,
  items,
  hasMore,
  scrollContainerRef,
  sentinelRef,
  onDeleteClick,
}: GuestbookListProps) {
  return (
    <div ref={scrollContainerRef} className="scrollbar-hide max-h-[480px] overflow-y-auto">
      <ul className="space-y-4 py-2">
        {status === "ready" && items.length === 0 && (
          <li className="text-muted-foreground py-6 text-center">
            등록된 방명록이 없습니다.
          </li>
        )}

        {status === "ready" &&
          items.map((item) => (
            <li
              className="border-border bg-card relative flex items-start gap-3 rounded-lg border p-3 shadow-sm"
              key={item.id}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
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
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-0 right-0 cursor-pointer"
                  onClick={() => onDeleteClick(item.id)}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </motion.div>
            </li>
          ))}

        {status === "loading" && (
          <li className="text-muted-foreground py-6 text-center">
            방명록을 불러오는 중입니다.
          </li>
        )}

        {hasMore && <div ref={sentinelRef} className="h-4" />}
      </ul>
    </div>
  );
}
