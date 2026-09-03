import type { PagePath } from "@/core/domain/page";
import { PAGE_TITLE } from "@/core/domain/page";

export const isPageTitle = (value: string): value is PagePath => {
  return Object.keys(PAGE_TITLE).includes(value);
};
