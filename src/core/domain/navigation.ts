import { LayoutDashboard, User, ShoppingBag } from "lucide-react";

import { ROUTES } from "./routes";
import { MOBILE_INVITATION_CATEGORY } from "./product-category";

const MAIN_NAV_ITEMS = [
  {
    id: MOBILE_INVITATION_CATEGORY,
    label: "모바일 청첩장",
    href: ROUTES.products.byCategory(MOBILE_INVITATION_CATEGORY),
  },
] as const;

const USER_NAV_ITEMS = [
  {
    label: "관리자 페이지",
    href: ROUTES.admin.dashboard,
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    label: "마이 프로필",
    href: ROUTES.profile,
    icon: User,
    adminOnly: false,
  },
  {
    label: "마이 주문",
    href: ROUTES.myOrders.root,
    icon: ShoppingBag,
    adminOnly: false,
  },
] as const;

export { MAIN_NAV_ITEMS, USER_NAV_ITEMS };
