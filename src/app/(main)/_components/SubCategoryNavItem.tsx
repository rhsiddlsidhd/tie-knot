import Link from "next/link";
import { TypographySmall } from "@/ui/components/atoms";
import { routes } from "@/core/domain/routes";
import { subCategoryLabels, type ProductCategory, type SubCategory } from "@/core/domain/product-category";

interface SubCategoryNavItemProps {
  category: ProductCategory;
  subCategory: SubCategory;
}

export function SubCategoryNavItem({
  category,
  subCategory,
}: SubCategoryNavItemProps) {
  return (
    <Link
      href={routes.products.byCategory(category, subCategory)}
      className="focus-visible:ring-ring flex min-h-11 min-w-11 shrink-0 items-center px-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <TypographySmall className="whitespace-nowrap">
        {subCategoryLabels[subCategory]}
      </TypographySmall>
    </Link>
  );
}
