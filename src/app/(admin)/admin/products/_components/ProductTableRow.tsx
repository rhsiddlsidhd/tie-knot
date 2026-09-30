import { AppImage } from "@/ui/components/atoms/app-image";
import { Badge } from "@/ui/components/ui/badge";
import { TableRow, TableCell } from "@/ui/components/ui/table";
import {
  TypographyMuted,
  TypographySmall,
} from "@/ui/components/atoms/typography";
import type { Product } from "@/core/domain/product";
import { PRODUCT_STATUS_LABELS } from "@/core/domain/product";
import { formatKstDate } from "@/core/utils/date";
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
  softDeleted: boolean;
  onRefreshed: () => void;
}

const ProductTableRow = ({
  product,
  softDeleted,
  onRefreshed,
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
        {softDeleted ? (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              {PRODUCT_STATUS_LABELS.deleted}
            </Badge>
            {product.deletedAt && (
              <TypographyMuted>
                {new Date(product.deletedAt).toLocaleDateString("ko-KR")}
              </TypographyMuted>
            )}
          </div>
        ) : (
          <ProductTableRowSelect product={product} onRefreshed={onRefreshed} />
        )}
      </TableCell>
      <TableCell>{product.views}</TableCell>
      <TableCell>{product.likes.length}</TableCell>
      <TableCell>{product.salesCount}</TableCell>
      <TableCell>
        <span className="font-mono text-sm">{product.priority}</span>
      </TableCell>
      <TableCell>{formatKstDate(product.createdAt)}</TableCell>
      <TableCell>
        <ProductTableRowAction
          product={product}
          softDeleted={softDeleted}
          onRefreshed={onRefreshed}
        />
      </TableCell>
    </TableRow>
  );
};

export { ProductTableRow, type ProductTableRowProps };
