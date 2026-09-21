import Link from "next/link";
import { TypographySmall } from "@/ui/components/atoms/typography";
import { ROUTES } from "@/core/domain/routes";
import {
  SUB_CATEGORY_LABELS,
  type ProductCategory,
  type SubCategory,
} from "@/core/domain/product-category";

interface SubCategoryNavigationItemProps {
  category: ProductCategory;
  subCategory: SubCategory;
}

const SubCategoryNavigationItem = ({
  category,
  subCategory,
}: SubCategoryNavigationItemProps) => {
  return (
    <Link
      href={ROUTES.products.byCategory(category, subCategory)}
      className="focus-visible:ring-ring flex min-h-11 min-w-11 shrink-0 items-center px-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <TypographySmall className="whitespace-nowrap">
        {SUB_CATEGORY_LABELS[subCategory]}
      </TypographySmall>
    </Link>
  );
};

export { SubCategoryNavigationItem };
