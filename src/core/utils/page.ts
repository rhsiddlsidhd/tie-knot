import type { PagePath} from "@/core/domain";
import { PAGE_TITLE } from "@/core/domain";

export const isPageTitle = (value: string): value is PagePath => {
  return Object.keys(PAGE_TITLE).includes(value);
};
