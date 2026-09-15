import { Eye, Heart, ShoppingCart } from "lucide-react";
import { AppImage } from "@/ui/components/atoms/app-image";
import { Badge } from "@/ui/components/atoms/badge";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import {
  TypographyMuted,
  TypographySmall,
} from "@/ui/components/atoms/typography";
import type { Product } from "@/core/domain/product";
import { ProductTableRowAction } from "../_containers/ProductTableRowAction";
import { ProductTableRowSelect } from "../_containers/ProductTableRowSelect";
import type {
  ProductCategory,
  SubCategory,
} from "@/core/domain/product-category";
import {
  PRODUCT_CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
} from "@/core/domain/product-category";

interface ProductTableRowProps {
  product: Product;
  view?: "active" | "trash";
}

const ProductTableRow = ({
  product,
  view = "active",
}: ProductTableRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <div className="relative h-16 w-16 overflow-hidden rounded">
          <AppImage
            src={product.thumbnail}
            sizes="128px"
            alt={`${product.title} 이미지`}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          <TypographySmall className="truncate font-medium">
            {product.title}
          </TypographySmall>
          <TypographyMuted className="truncate">
            {product.description}
          </TypographyMuted>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="w-fit">
            {PRODUCT_CATEGORY_LABELS[product.category as ProductCategory] ||
              product.category}
          </Badge>
          <TypographyMuted className="px-1">
            {SUB_CATEGORY_LABELS[product.subCategory as SubCategory] ||
              product.subCategory}
          </TypographyMuted>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-semibold">
          {product.price.toLocaleString()}원
        </span>
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm">{product.priority}</span>
      </TableCell>
      <TableCell>
        <ProductTableRowAction product={product} view={view} />
      </TableCell>
    </TableRow>
  );
};

export { ProductTableRow, type ProductTableRowProps };
