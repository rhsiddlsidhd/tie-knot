import { TypographyH2 } from "@/ui/components/atoms/typography";
import { LinkButton } from "@/ui/components/molecules/LinkButton";
import { PortraitImageCard } from "@/ui/components/molecules/PortraitImageCard";

import { Eye, ExternalLink } from "lucide-react";
import { ROUTES } from "@/core/domain/routes";

const FALLBACK_THUMBNAIL = "/assets/images/output.webp";

interface LiveDemoSectionProps {
  thumbnail?: string | null;
}

/**
 * 메인 페이지에서 대표 청첩장 샘플(/preview/sample)을 보여주는 섹션 (Organism)
 */
const LiveDemoSection = ({ thumbnail = null }: LiveDemoSectionProps) => {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        {/* 설명 영역 — flex-1로 남은 폭을 다 먹으면 내용은 좌측에 좁게 붙어있고 이미지만
            컨테이너 오른쪽 끝으로 밀려나 둘 사이가 멀어 보인다. max-width로 캡을 씌우고
            row는 justify-center로 묶어 텍스트와 썸네일이 붙어 보이게 한다. */}
        <div className="flex w-full flex-col justify-center text-center lg:max-w-xl lg:text-left">
          <TypographyH2 className="mb-4 border-none text-3xl font-bold tracking-tight sm:text-4xl">
            대표 청첩장 샘플을 <br className="hidden sm:block" />
            지금 바로 확인해보세요
          </TypographyH2>
          <p className="text-muted-foreground mb-8 text-lg">
            실제 청첩장에 담기는 구성 그대로 만든 샘플입니다.
            <br className="hidden sm:block" />
            모바일에서 최적화된 유려한 애니메이션과 디자인을 직접 경험해보세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
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

        {/* 비주얼 카드 영역 — 세로형 썸네일이라 flex-1로 폭을 다 채우면 카드가 지나치게
            커지므로, 폭을 고정하고 텍스트 영역만 flex-1로 남은 공간을 가져가게 한다. */}
        <div className="mx-auto w-full max-w-xs lg:mx-0">
          <PortraitImageCard
            src={thumbnail ?? FALLBACK_THUMBNAIL}
            alt="대표 청첩장 샘플 미리보기"
            sizes="(min-width: 1024px) 320px, 80vw"
            loading="eager"
            zoomOnHover
            className="border-border bg-background border-2 shadow-2xl"
          >
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <LinkButton
                href={ROUTES.preview.sample}
                target="_blank"
                variant="secondary"
                className="scale-95 transform font-semibold transition-transform duration-300 group-hover:scale-100"
              >
                <ExternalLink className="mr-2 h-4 w-4" />새 창에서 열기
              </LinkButton>
            </div>
          </PortraitImageCard>
        </div>
      </div>
    </section>
  );
};

export { LiveDemoSection };
