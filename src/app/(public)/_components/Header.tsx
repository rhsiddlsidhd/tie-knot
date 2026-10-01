import { Suspense } from "react";
import { AuthStatus } from "./AuthStatus";
import { HeaderNavigationMenu } from "./HeaderNavigationMenu";
import { SheetPanel } from "./SheetPanel";
import { SheetNavigationList } from "./SheetNavigationList";
import { Search } from "lucide-react";
import { ROUTES } from "@/core/domain/routes";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import {
  CATEGORY_NAVIGATION_ITEMS,
  GENERAL_NAVIGATION_ITEMS,
} from "@/core/domain/navigation";
import { buildCategoryNavigationItems } from "@/core/utils/navigation";
import { getAvailableSubCategoriesService } from "@/services/product";
import { LinkButton } from "@/ui/components/molecules/LinkButton";
import { Logo } from "@/ui/components/atoms/logo";

const Header = async () => {
  // 조회가 실패하면 nav를 비우는 대신 정적 전체 목록으로 폴백한다(홈의 인기 상품
  // 조회와 같은 방침 — 헤더 하나 때문에 페이지 전체가 죽지 않게 한다).
  const availableSubCategories: AvailableSubCategory[] | null =
    await getAvailableSubCategoriesService().catch((): null => null);
  const categoryGroups = availableSubCategories
    ? buildCategoryNavigationItems(availableSubCategories)
    : CATEGORY_NAVIGATION_ITEMS;

  return (
    <header className="bg-background/80 border-border sticky top-0 right-0 left-0 z-50 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <SheetPanel hiddenFrom="lg">
            {/* useSearchParams는 프리렌더 중 가장 가까운 Suspense 경계까지를
                클라이언트 렌더로 떨어뜨린다 — 경계가 없으면 정적 라우트 빌드가
                깨진다(missing-suspense-with-csr-bailout). */}
            <Suspense fallback={null}>
              <SheetNavigationList
                groups={categoryGroups}
                links={GENERAL_NAVIGATION_ITEMS}
              />
            </Suspense>
          </SheetPanel>
          <Logo />
          <HeaderNavigationMenu items={categoryGroups} />
        </div>

        <div className="flex items-center gap-4">
          <LinkButton
            variant="ghost"
            size="icon"
            aria-label="상품 검색"
            href={ROUTES.search}
          >
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </LinkButton>
          <AuthStatus />
        </div>
      </div>
    </header>
  );
};

export { Header };
