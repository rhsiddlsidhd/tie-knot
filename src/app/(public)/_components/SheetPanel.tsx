"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/components/atoms/sheet";
import { Button } from "@/ui/components/atoms/button";
import { Logo } from "@/ui/components/atoms/logo";
import { cn } from "@/core/utils/cn";

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

interface SheetPanelProps {
  side?: "top" | "right" | "bottom" | "left";
  hiddenFrom?: Breakpoint;
  children: ReactNode;
}

const SheetPanel = ({
  side = "left",
  hiddenFrom = "md",
  children,
}: SheetPanelProps) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className={cn(`${hiddenFrom}:hidden`)}>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground hover:text-foreground/70 transition-colors hover:bg-transparent"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>

      <SheetContent
        side={side}
        className="border-border/50 flex w-2/3 flex-col border-r p-0 [&>button:last-of-type]:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>메뉴</SheetTitle>
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

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

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
