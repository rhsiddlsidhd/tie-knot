import { AuthButtons } from "./AuthButtons";
import { PrimaryNav } from "./PrimaryNav";
import { MobileMenu } from "./MobileMenu";
import Link from "next/link";
import React from "react";
import { Search } from "lucide-react";
import { ROUTES } from "@/core/domain/routes";
import { Button } from "@/ui/components/atoms/button";
import { Logo } from "@/ui/components/atoms/logo";
const Header = () => {
  return (
    <header className="bg-background/80 border-border sticky top-0 right-0 left-0 z-50 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <MobileMenu />
          <Logo />
          <PrimaryNav />
        </div>

        {/* Auth / Action Buttons */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="상품 검색">
            <Link href={ROUTES.search}>
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </Button>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
};

export { Header };
