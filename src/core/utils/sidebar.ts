import type { SubmenuParentTitle } from "@/core/domain";
import { SUBMENU_PARENT_TITLES } from "@/core/domain";

export const isSubmenuParentTitle = (
  title: string,
): title is SubmenuParentTitle =>
  SUBMENU_PARENT_TITLES.includes(title as SubmenuParentTitle);
