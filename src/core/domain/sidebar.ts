import type { LucideProps } from "lucide-react";
import {
  HelpCircle,
  LayoutDashboard,
  MessageSquareText,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";

import { ROUTES } from "./routes";

interface BaseNavigateItem {
  title: string;
}

interface NavigateLinkItem extends BaseNavigateItem {
  href: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  submenu?: never;
}

interface NavigateGroupItem extends BaseNavigateItem {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  submenu: Submenu[];
  href?: never;
}

type NavigateItem = NavigateLinkItem | NavigateGroupItem;

type Submenu = {
  title: string;
  href: string;
};

const adminNavigateItems: NavigateItem[] = [
  {
    title: "대시보드",
    href: ROUTES.admin.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: "상품 관리",
    icon: Package,
    submenu: [
      { title: "상품 목록", href: ROUTES.admin.products.root },
      { title: "상품 등록", href: ROUTES.admin.products.new },
    ],
  },
  {
    title: "프리미엄 기능 관리",
    icon: Star,
    submenu: [
      { title: "프리미엄 기능 목록", href: ROUTES.admin.premiumFeatures.root },
      { title: "프리미엄 기능 등록", href: ROUTES.admin.premiumFeatures.new },
    ],
  },
  {
    title: "주문 관리",
    href: ROUTES.admin.orders,
    icon: ShoppingCart,
  },
  {
    title: "리뷰 관리",
    href: ROUTES.admin.reviews,
    icon: MessageSquareText,
  },
  {
    title: "회원 관리",
    href: ROUTES.admin.users,
    icon: Users,
  },
  {
    title: "설정",
    href: ROUTES.admin.settings,
    icon: Settings,
  },
];

const authUserOrderNavigateItems: NavigateItem[] = [
  {
    title: "주문 정보",
    icon: ShoppingCart,
    submenu: [
      { title: "주문 목록", href: ROUTES.myOrders.root },
      { title: "취소/환불", href: ROUTES.myOrders.refund },
    ],
  },
  {
    title: "고객 센터",
    href: ROUTES.support,
    icon: HelpCircle,
  },
];

const authUserProfileNavigateItems: NavigateItem[] = [
  {
    title: "프로필",
    href: ROUTES.profile,
    icon: LayoutDashboard,
  },
];

const ALL_NAVIGATE_ITEMS = {
  ADMIN: adminNavigateItems,
  MY_ORDER: authUserOrderNavigateItems,
  MY_PROFILE: authUserProfileNavigateItems,
} as const;

const SUBMENU_PARENT_TITLES = [
  "프리미엄 기능 관리",
  "주문 정보",
  "상품 관리",
] as const;

type SubmenuParentTitle = (typeof SUBMENU_PARENT_TITLES)[number];

export {
  ALL_NAVIGATE_ITEMS,
  SUBMENU_PARENT_TITLES,
  type BaseNavigateItem,
  type NavigateLinkItem,
  type NavigateGroupItem,
  type NavigateItem,
  type Submenu,
  type SubmenuParentTitle,
};
