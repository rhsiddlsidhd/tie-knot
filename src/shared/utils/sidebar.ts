import type { SubmenuParentTitle } from "@/shared/constants";
import { SUBMENU_PARENT_TITLES } from "@/shared/constants";

export const isSubmenuParentTitle = (
  title: string,
): title is SubmenuParentTitle =>
  SUBMENU_PARENT_TITLES.includes(title as SubmenuParentTitle);
