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
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  SUB_CATEGORY_MAP,
} from "./product-category";

type NavigationIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

interface NavigationLinkItem {
  id: string;
  label: string;
  href: string;
  icon: NavigationIcon | null;
}

interface NavigationGroup {
  id: string;
  label: string;
  icon: NavigationIcon | null;
  submenu: NavigationLinkItem[];
}

interface NavigationSection {
  groups: NavigationGroup[];
  links: NavigationLinkItem[];
}

const CATEGORY_NAVIGATION_ITEMS: NavigationGroup[] = PRODUCT_CATEGORIES.map(
  (category): NavigationGroup => ({
    id: category,
    label: PRODUCT_CATEGORY_LABELS[category],
    icon: null,
    submenu: [
      {
        id: `${category}-all`,
        label: "전체보기",
        href: ROUTES.products.byCategory(category),
        icon: null,
      },
      ...SUB_CATEGORY_MAP[category].map(
        (subCategory): NavigationLinkItem => ({
          id: subCategory,
          label: SUB_CATEGORY_LABELS[subCategory],
          href: ROUTES.products.byCategory(category, subCategory),
          icon: null,
        }),
      ),
    ],
  }),
);

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
  },
  {
    id: "orders",
    label: "주문 관리",
    href: ROUTES.admin.orders,
    icon: ShoppingCart,
  },
  {
    id: "reviews",
    label: "리뷰 관리",
    href: ROUTES.admin.reviews,
    icon: MessageSquareText,
  },
  {
    id: "users",
    label: "회원 관리",
    href: ROUTES.admin.users,
    icon: Users,
  },
  {
    id: "settings",
    label: "설정",
    href: ROUTES.admin.settings,
    icon: Settings,
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
