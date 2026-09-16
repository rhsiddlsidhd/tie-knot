import type { LucideProps } from "lucide-react";
import {
  HelpCircle,
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
} from "./product-category";

type NavIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

interface Submenu {
  id: string;
  label: string;
  href: string;
  icon?: NavIcon;
}

interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: NavIcon;
  submenu?: Submenu[];
}

const MAIN_NAV_ITEMS = [
  ...PRODUCT_CATEGORIES.map((category) => ({
    id: category,
    label: PRODUCT_CATEGORY_LABELS[category],
    href: ROUTES.products.byCategory(category),
  })),
  {
    id: "support",
    label: "고객 센터",
    href: ROUTES.support,
  },
] as const satisfies readonly NavItem[];

const adminNavigateItems: NavItem[] = [
  {
    id: "dashboard",
    label: "대시보드",
    href: ROUTES.admin.dashboard,
    icon: LayoutDashboard,
  },
  {
    id: "products",
    label: "상품 관리",
    icon: Package,
    submenu: [
      {
        id: "products-list",
        label: "상품 목록",
        href: ROUTES.admin.products.root,
      },
      {
        id: "products-new",
        label: "상품 등록",
        href: ROUTES.admin.products.new,
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
      },
      {
        id: "premium-features-new",
        label: "프리미엄 기능 등록",
        href: ROUTES.admin.premiumFeatures.new,
      },
    ],
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

const authUserOrderNavigateItems: NavItem[] = [
  {
    id: "orders",
    label: "주문 정보",
    href: ROUTES.myOrders.root,
    icon: ShoppingCart,
    submenu: [
      { id: "orders-list", label: "주문 목록", href: ROUTES.myOrders.root },
      {
        id: "orders-refund",
        label: "취소/환불",
        href: ROUTES.myOrders.refund,
      },
    ],
  },
  {
    id: "support",
    label: "고객 센터",
    href: ROUTES.support,
    icon: HelpCircle,
  },
];

const authUserProfileNavigateItems: NavItem[] = [
  {
    id: "profile",
    label: "프로필",
    href: ROUTES.profile,
    icon: User,
  },
];

const ALL_NAVIGATE_ITEMS = {
  ADMIN: adminNavigateItems,
  MY_ORDER: authUserOrderNavigateItems,
  MY_PROFILE: authUserProfileNavigateItems,
} as const;

// 각 섹션 데이터의 첫 항목이 그 섹션의 진입점이라는 전제 — 위 배열 순서 바뀌면 여기도 같이 확인한다.
const USER_NAV_ITEMS = [
  ALL_NAVIGATE_ITEMS.ADMIN[0],
  ALL_NAVIGATE_ITEMS.MY_PROFILE[0],
  ALL_NAVIGATE_ITEMS.MY_ORDER[0],
] satisfies readonly NavItem[];

export {
  MAIN_NAV_ITEMS,
  USER_NAV_ITEMS,
  ALL_NAVIGATE_ITEMS,
  type NavItem,
  type Submenu,
  type NavIcon,
};
