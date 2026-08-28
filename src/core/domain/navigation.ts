import { LayoutDashboard, User, ShoppingBag } from "lucide-react";

import { routes } from "./routes";
import { MOBILE_INVITATION_CATEGORY } from "./product-category";

export const MAIN_NAV_ITEMS = [
  {
    id: MOBILE_INVITATION_CATEGORY,
    label: "모바일 청첩장",
    href: routes.products.byCategory(MOBILE_INVITATION_CATEGORY),
  },
] as const;

export const userNavItems = [
  {
    label: "관리자 페이지",
    href: routes.admin.dashboard,
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    label: "마이 프로필",
    href: routes.profile,
    icon: User,
    adminOnly: false,
  },
  {
    label: "마이 주문",
    href: routes.myOrders.root,
    icon: ShoppingBag,
    adminOnly: false,
  },
] as const;
