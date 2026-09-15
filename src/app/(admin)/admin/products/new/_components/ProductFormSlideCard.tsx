import type React from "react";
import { Asterisk } from "lucide-react";
import { Button } from "@/ui/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/components/atoms/card";

interface ProductFormSlideCardProps {
  step: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  children: React.ReactNode;
}

/** 상품 등록 슬라이드의 카드 UI와 이전·다음 탐색을 제공한다. */
const ProductFormSlideCard = ({
  step,
  title,
  description,
  required = false,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  children,
}: ProductFormSlideCardProps) => {
  return (
    <Card data-product-form-step={step}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-1">
            {title}
            {required && <Asterisk aria-hidden="true" size={12} />}
          </CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
      {(onPrevious || onNext) && (
        <CardFooter className="justify-between border-t">
          {onPrevious && previousLabel ? (
            <Button type="button" variant="outline" onClick={onPrevious}>
              이전: {previousLabel}
            </Button>
          ) : (
            <span />
          )}
          {onNext && nextLabel && (
            <Button type="button" onClick={onNext}>
              다음: {nextLabel}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export { ProductFormSlideCard };
export type { ProductFormSlideCardProps };
