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

type NavIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  icon: NavIcon | null;
}

interface NavGroupItem {
  id: string;
  label: string;
  icon: NavIcon | null;
  submenu: NavLinkItem[];
}

interface NavSection {
  groups: NavGroupItem[];
  links: NavLinkItem[];
}

const CATEGORY_NAV_ITEMS: NavGroupItem[] = PRODUCT_CATEGORIES.map(
  (category): NavGroupItem => ({
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
        (subCategory): NavLinkItem => ({
          id: subCategory,
          label: SUB_CATEGORY_LABELS[subCategory],
          href: ROUTES.products.byCategory(category, subCategory),
          icon: null,
        }),
      ),
    ],
  }),
);

const GENERAL_NAV_ITEMS: NavLinkItem[] = [
  {
    id: "support",
    label: "고객 센터",
    href: ROUTES.support,
    icon: null,
  },
];

const adminGroupItems: NavGroupItem[] = [
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

const adminLinkItems: NavLinkItem[] = [
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

const authUserOrderGroupItems: NavGroupItem[] = [
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
      {
        id: "orders-refund",
        label: "취소/환불",
        href: ROUTES.myOrders.refund,
        icon: null,
      },
    ],
  },
];

const authUserProfileLinkItems: NavLinkItem[] = [
  {
    id: "profile",
    label: "프로필",
    href: ROUTES.profile,
    icon: User,
  },
];

const ALL_NAVIGATE_ITEMS: Readonly<
  Record<"MAIN" | "ADMIN" | "MY_ORDER" | "MY_PROFILE", NavSection>
> = {
  MAIN: { groups: CATEGORY_NAV_ITEMS, links: GENERAL_NAV_ITEMS },
  ADMIN: { groups: adminGroupItems, links: adminLinkItems },
  MY_ORDER: { groups: authUserOrderGroupItems, links: [] },
  MY_PROFILE: { groups: [], links: authUserProfileLinkItems },
};

const ADMIN_NAV_ITEMS: NavLinkItem[] = [
  {
    id: "dashboard",
    label: "대시보드",
    href: ROUTES.admin.dashboard,
    icon: LayoutDashboard,
  },
];

const USER_NAV_ITEMS: NavLinkItem[] = [
  { id: "profile", label: "프로필", href: ROUTES.profile, icon: User },
  {
    id: "orders",
    label: "주문 정보",
    href: ROUTES.myOrders.root,
    icon: ShoppingCart,
  },
];

export {
  CATEGORY_NAV_ITEMS,
  GENERAL_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  USER_NAV_ITEMS,
  ALL_NAVIGATE_ITEMS,
  type NavSection,
  type NavLinkItem,
  type NavGroupItem,
  type NavIcon,
};
