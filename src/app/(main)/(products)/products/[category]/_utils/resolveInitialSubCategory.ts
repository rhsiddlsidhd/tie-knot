import type { SubCategory } from "@/core/domain";

export function resolveInitialSubCategory(
  querySubCategory: string | string[] | undefined,
  availableSubCategories: readonly SubCategory[],
): SubCategory | "all" {
  if (typeof querySubCategory !== "string") return "all";

  const matchingSubCategory = availableSubCategories.find(
    (subCategory) => subCategory === querySubCategory,
  );

  return matchingSubCategory ?? "all";
}
