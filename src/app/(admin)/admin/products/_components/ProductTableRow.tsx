import { Eye, Heart, ShoppingCart } from "lucide-react";
import { AppImage } from "@/ui/components/atoms/app-image";
import { Badge } from "@/ui/components/atoms/badge";
import { TypographyMuted, TypographySmall } from "@/ui/components/atoms/typography";
import type { Product } from "@/core/domain/product";
import { ProductTableRowAction } from "../_containers/ProductTableRowAction";
import { ProductTableRowSelect } from "../_containers/ProductTableRowSelect";
import type { ProductCategory, SubCategory } from "@/core/domain/product-category";
import { productCategoryLabels, subCategoryLabels } from "@/core/domain/product-category";

export interface ProductTableRowProps {
  product: Product;
  view?: "active" | "trash";
}

export function ProductTableRow({ product, view = "active" }: ProductTableRowProps) {
  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <div className="relative h-16 w-16 overflow-hidden rounded">
          <AppImage
            src={product.thumbnail}
            sizes="128px"
            alt={`${product.title} 이미지`}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <TypographySmall className="truncate font-medium">{product.title}</TypographySmall>
          <TypographyMuted className="truncate">
            {product.description}
          </TypographyMuted>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="w-fit">
            {productCategoryLabels[product.category as ProductCategory] || product.category}
          </Badge>
          <TypographyMuted className="px-1">
            {subCategoryLabels[product.subCategory as SubCategory] || product.subCategory}
          </TypographyMuted>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-semibold">
          {product.price.toLocaleString()}원
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {product.isPremium && (
            <Badge className="bg-accent text-accent-foreground w-fit">
              프리미엄
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="w-fit">
              추천
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {view === "trash" ? (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              삭제됨
            </Badge>
            {product.deletedAt && (
              <TypographyMuted>
                {new Date(product.deletedAt).toLocaleDateString("ko-KR")}
              </TypographyMuted>
            )}
          </div>
        ) : (
          <ProductTableRowSelect product={product} />
        )}
      </td>
      <td className="px-4 py-3">
        <div className="text-muted-foreground flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{product.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{product.likes.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            <span>{product.salesCount}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-sm">{product.priority}</span>
      </td>
      <td className="px-4 py-3">
        <ProductTableRowAction product={product} view={view} />
      </td>
    </tr>
  );
}
