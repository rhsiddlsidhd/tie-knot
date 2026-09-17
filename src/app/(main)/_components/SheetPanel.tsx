"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/components/atoms/sheet";
import { Logo } from "@/ui/components/atoms/logo";
import { cn } from "@/core/utils/cn";

interface SheetPanelProps {
  title: string;
  side?: "top" | "right" | "bottom" | "left";
  trigger: ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
  children: (close: () => void) => ReactNode;
}

const SheetPanel = ({
  title,
  side = "left",
  trigger,
  triggerClassName,
  contentClassName,
  children,
}: SheetPanelProps) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className={triggerClassName}>
        {trigger}
      </SheetTrigger>

      <SheetContent
        side={side}
        className={cn("p-0 [&>button:last-of-type]:hidden", contentClassName)}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex h-full min-h-0 flex-col">
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between">
              <span onClick={close}>
                <Logo />
              </span>
              <button
                type="button"
                onClick={close}
                className="text-muted-foreground hover:text-foreground -mr-1 p-1 transition-colors"
                aria-label="메뉴 닫기"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="bg-border/60 h-px flex-1" />
              <span className="text-muted-foreground/50 text-[10px] font-medium tracking-[0.25em] uppercase">
                Menu
              </span>
              <div className="bg-border/60 h-px flex-1" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {children(close)}
          </div>

          <div className="border-border/40 border-t px-6 py-5">
            <p className="text-muted-foreground/40 text-center text-[10px] tracking-[0.15em] uppercase">
              매듭을 맺다 &amp; 웨딩 이커머스
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { SheetPanel };
