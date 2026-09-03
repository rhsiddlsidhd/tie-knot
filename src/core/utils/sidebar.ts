import type { SubmenuParentTitle } from "@/core/domain/sidebar";
import { SUBMENU_PARENT_TITLES } from "@/core/domain/sidebar";

export const isSubmenuParentTitle = (
  title: string,
): title is SubmenuParentTitle =>
  SUBMENU_PARENT_TITLES.includes(title as SubmenuParentTitle);
