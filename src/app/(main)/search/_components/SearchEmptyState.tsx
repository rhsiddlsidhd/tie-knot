import { SearchX } from "lucide-react";
import Link from "next/link";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/ui/components/atoms/empty";
import { ROUTES } from "@/core/domain/routes";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

const SearchEmptyState = ({ query }: { query: string }) => {
  return (
    <Empty className="min-h-[400px] w-full rounded-2xl border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-20 rounded-full">
          <SearchX className="text-muted-foreground size-10 opacity-40" />
        </EmptyMedia>
        <EmptyTitle className="text-xl">검색결과가 없습니다</EmptyTitle>
        <EmptyDescription className="max-w-[280px] text-base leading-relaxed">
          {`'${query}'와 일치하는 상품을 찾지 못했어요.`}
          <br />
          다른 검색어로 다시 시도해보세요.
        </EmptyDescription>
      </EmptyHeader>

      {/*
        U8 리더 판정(01_ui_flow.md §9) — 막다른 페이지 방지 목적의 최소 링크.
        TODO(Phase3): 서브카테고리 진입 카드 섹션은 아직 미구현이라 이번 범위에선
        문구 + 이 링크까지만 노출한다(00_requirements REQ-4).
      */}
      <EmptyContent>
        <Link
          href={ROUTES.products.byCategory(MOBILE_INVITATION_CATEGORY)}
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          전체 상품 보기
        </Link>
      </EmptyContent>
    </Empty>
  );
};

export { SearchEmptyState };
