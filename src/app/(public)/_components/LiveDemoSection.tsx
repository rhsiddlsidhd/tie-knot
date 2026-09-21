import { TypographyH2 } from "@/ui/components/atoms/typography";
import { LinkButton } from "@/ui/components/molecules/LinkButton";

import { Eye } from "lucide-react";
import { ROUTES } from "@/core/domain/routes";

/**
 * 메인 페이지에서 대표 청첩장 샘플(/preview/sample)을 보여주는 섹션 (Organism)
 */
const LiveDemoSection = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <TypographyH2 className="mb-4 border-none text-3xl font-bold tracking-tight sm:text-4xl">
          대표 청첩장 샘플을 <br className="hidden sm:block" />
          지금 바로 확인해보세요
        </TypographyH2>
        <p className="text-muted-foreground mb-8 text-lg">
          실제 청첩장에 담기는 구성 그대로 만든 샘플입니다.
          <br className="hidden sm:block" />
          모바일에서 최적화된 유려한 애니메이션과 디자인을 직접 경험해보세요.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <LinkButton
            href={ROUTES.preview.sample}
            target="_blank"
            size="lg"
            className="h-12 px-8 text-base"
          >
            <Eye className="mr-2 h-5 w-5" />
            샘플 미리보기
          </LinkButton>
        </div>
      </div>
    </section>
  );
};

export { LiveDemoSection };
