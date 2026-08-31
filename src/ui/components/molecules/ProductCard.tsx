import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { Product, SubCategory } from "@/core/domain";
import { routes, subCategoryLabels } from "@/core/domain";
import { calculatePrice } from "@/core/utils";
import { Badge, TypographyMuted } from "@/ui/components/atoms";
import { CloudImage } from "./CloudImage";

export function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  const finalPrice =
    product.discount?.value > 0
      ? calculatePrice(product.price, product.discount)
      : product.price;

  const hasDiscount = product.discount?.value > 0;
  const discountLabel = hasDiscount
    ? product.discount.discountType === "rate"
      ? `${Math.round(product.discount.value * 100)}% OFF`
      : `${product.discount.value.toLocaleString()}원 할인`
    : null;

  return (
    <Link href={routes.products.detail(product.category, product._id)}>
      <article className="group relative cursor-pointer">
      {/* Image — the card itself. aspect-ratio는 황금비(1:1.618) 세로 카드 */}
      <div className="bg-muted relative aspect-[1/1.618] overflow-hidden rounded-2xl">
        {/* Thumbnail with zoom on hover */}
        <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06]">
          <CloudImage
            src={product.thumbnail}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            alt={`${product.title} 썸네일`}
            priority={true}
          />
        </div>

        {/* Persistent bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Hover overlay deepens */}
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Top badges */}
        <div className="absolute top-2 right-2 left-2 flex items-start justify-between sm:top-3 sm:right-3 sm:left-3">
          <div className="flex flex-col gap-1 sm:gap-1.5">
            {typeof rank === "number" && (
              <Badge className="bg-foreground/85 border-transparent shadow-sm backdrop-blur-sm">
                <TypographyMuted className="text-background text-[9px] font-bold sm:text-[10px]">
                  {rank}
                  <span className="sr-only">인기 {rank}위</span>
                </TypographyMuted>
              </Badge>
            )}
            {product.isPremium && (
              <Badge className="bg-primary border-transparent tracking-widest uppercase shadow-sm backdrop-blur-sm">
                <Sparkles className="text-primary-foreground h-2.5 w-2.5" />
                <TypographyMuted className="text-primary-foreground text-[9px] font-bold sm:text-[10px]">
                  Premium
                </TypographyMuted>
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="bg-accent border-transparent tracking-widest uppercase backdrop-blur-sm">
                <TypographyMuted className="text-accent-foreground text-[9px] font-bold sm:text-[10px]">
                  추천
                </TypographyMuted>
              </Badge>
            )}
          </div>
          {discountLabel && (
            <Badge className="bg-destructive border-transparent tracking-wide shadow-sm backdrop-blur-sm">
              <TypographyMuted className="text-destructive-foreground text-[9px] font-bold sm:text-[10px]">
                {discountLabel}
              </TypographyMuted>
            </Badge>
          )}
        </div>

        {/* Bottom info — always visible. 카드가 작아지는 브레이크포인트에 맞춰 텍스트/여백도 같이 줄어든다 */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] sm:p-4">
          <p className="mb-0.5 text-[8px] font-semibold tracking-[0.2em] text-white/50 uppercase sm:mb-1 sm:text-[9px] sm:tracking-[0.25em]">
            {subCategoryLabels[product.subCategory as SubCategory] ??
              product.subCategory}
          </p>
          <h3 className="line-clamp-2 text-xs leading-snug font-semibold text-white sm:text-sm">
            {product.title}
          </h3>
          <div className="mt-1 flex items-center justify-between sm:mt-2">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              {hasDiscount && (
                <span className="text-[10px] text-white/35 line-through sm:text-[11px]">
                  {product.price.toLocaleString()}원
                </span>
              )}
              <span className="text-sm font-bold text-white sm:text-base">
                {finalPrice === 0 ? "무료" : `${finalPrice.toLocaleString()}원`}
              </span>
            </div>
            <span className="text-[10px] text-white/40 sm:text-[11px]">
              좋아요 {product.likes?.length || 0}
            </span>
          </div>
        </div>
      </div>
      </article>
    </Link>
  );
}
