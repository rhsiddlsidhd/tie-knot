import type { LucideProps } from "lucide-react";
import {
  LayoutDashboard,
  MessageSquareText,
  Package,
  Settings,
  ShoppingCart,
  Star,
  User,
  Users,
} from "lucide-react";

import { ROUTES } from "./routes";
import {
  buildAllSubCategoryPairs,
  buildCategoryNavigationItems,
} from "@/core/utils/navigation";

type NavigationIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

interface NavigationLinkItem {
  id: string;
  label: string;
  href: string;
  icon: NavigationIcon | null;
  order?: number;
}

interface NavigationGroup {
  id: string;
  label: string;
  icon: NavigationIcon | null;
  submenu: NavigationLinkItem[];
  order?: number;
}

interface NavigationSection {
  groups: NavigationGroup[];
  links: NavigationLinkItem[];
}

const CATEGORY_NAVIGATION_ITEMS: NavigationGroup[] =
  buildCategoryNavigationItems(buildAllSubCategoryPairs());

const GENERAL_NAVIGATION_ITEMS: NavigationLinkItem[] = [
  {
    id: "support",
    label: "고객 센터",
    href: ROUTES.support,
    icon: null,
  },
];

const adminNavigationGroups: NavigationGroup[] = [
  {
    id: "products",
    label: "상품 관리",
    icon: Package,
    order: 1,
    submenu: [
      {
        id: "products-list",
        label: "상품 목록",
        href: ROUTES.admin.products.root,
        icon: null,
      },
      {
        id: "products-new",
        label: "상품 등록",
        href: ROUTES.admin.products.new,
        icon: null,
      },
    ],
  },
  {
    id: "premium-features",
    label: "프리미엄 기능 관리",
    icon: Star,
    order: 2,
    submenu: [
      {
        id: "premium-features-list",
        label: "프리미엄 기능 목록",
        href: ROUTES.admin.premiumFeatures.root,
        icon: null,
      },
      {
        id: "premium-features-new",
        label: "프리미엄 기능 등록",
        href: ROUTES.admin.premiumFeatures.new,
        icon: null,
      },
    ],
  },
];

const adminNavigationLinks: NavigationLinkItem[] = [
  {
    id: "dashboard",
    label: "대시보드",
    href: ROUTES.admin.dashboard,
    icon: LayoutDashboard,
    order: 0,
  },
  {
    id: "orders",
    label: "주문 관리",
    href: ROUTES.admin.orders,
    icon: ShoppingCart,
    order: 3,
  },
  {
    id: "reviews",
    label: "리뷰 관리",
    href: ROUTES.admin.reviews,
    icon: MessageSquareText,
    order: 4,
  },
  {
    id: "users",
    label: "회원 관리",
    href: ROUTES.admin.users,
    icon: Users,
    order: 5,
  },
  {
    id: "settings",
    label: "설정",
    href: ROUTES.admin.settings,
    icon: Settings,
    order: 6,
  },
];

const authUserOrderNavigationGroups: NavigationGroup[] = [
  {
    id: "orders",
    label: "주문 정보",
    icon: ShoppingCart,
    submenu: [
      {
        id: "orders-list",
        label: "주문 목록",
        href: ROUTES.myOrders.root,
        icon: null,
      },
    ],
  },
];

const authUserProfileNavigationLinks: NavigationLinkItem[] = [
  {
    id: "profile",
    label: "프로필",
    href: ROUTES.profile,
    icon: User,
  },
];

const NAVIGATION_BY_TYPE: Readonly<
  Record<"MAIN" | "ADMIN" | "MY_ORDER" | "MY_PROFILE", NavigationSection>
> = {
  MAIN: { groups: CATEGORY_NAVIGATION_ITEMS, links: GENERAL_NAVIGATION_ITEMS },
  ADMIN: { groups: adminNavigationGroups, links: adminNavigationLinks },
  MY_ORDER: { groups: authUserOrderNavigationGroups, links: [] },
  MY_PROFILE: { groups: [], links: authUserProfileNavigationLinks },
};

const ADMIN_NAVIGATION_ITEMS: NavigationLinkItem[] = [
  {
    id: "dashboard",
    label: "대시보드",
    href: ROUTES.admin.dashboard,
    icon: LayoutDashboard,
  },
];

const USER_NAVIGATION_ITEMS: NavigationLinkItem[] = [
  { id: "profile", label: "프로필", href: ROUTES.profile, icon: User },
  {
    id: "orders",
    label: "주문 정보",
    href: ROUTES.myOrders.root,
    icon: ShoppingCart,
  },
];

export {
  CATEGORY_NAVIGATION_ITEMS,
  GENERAL_NAVIGATION_ITEMS,
  ADMIN_NAVIGATION_ITEMS,
  USER_NAVIGATION_ITEMS,
  NAVIGATION_BY_TYPE,
  type NavigationSection,
  type NavigationLinkItem,
  type NavigationGroup,
  type NavigationIcon,
};
