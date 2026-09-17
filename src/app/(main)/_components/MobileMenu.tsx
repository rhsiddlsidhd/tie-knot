"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/components/atoms/sheet";
import { Button } from "@/ui/components/atoms/button";
import { SidebarPanel } from "@/ui/components/organisms/AppSidebar/AppSidebar";

const MobileMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen} >
      <SheetTrigger asChild className="md:hidden">
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
        side="left"
        className="border-border/50 flex w-72 flex-col border-r p-0 [&>button:last-of-type]:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>메뉴</SheetTitle>
        </SheetHeader>
        <SidebarPanel
          navType="MAIN"
          onClose={() => setOpen(false)}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

export { MobileMenu };
