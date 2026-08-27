import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import type { ComponentType } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TypographyMuted,
  TypographySmall,
} from "@/ui/components/atoms";
import type { DashboardStats } from "@/core/domain";
import { cn, formatPriceWithComma, formatSignedPercent } from "@/core/utils";
import { RecentOrdersCard } from "./RecentOrdersCard";

type TrendDirection = "up" | "down" | "flat";

type StatTrend = {
  label: string;
  direction: TrendDirection;
};

type StatCard = {
  title: string;
  icon: ComponentType<{ className?: string }>;
  value: string;
  description: string;
  trend: StatTrend | null;
};

const TREND_DIRECTION_CLASS: Record<TrendDirection, string> = {
  up: "text-primary",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

interface AdminDashboardTemplateProps {
  stats: DashboardStats;
}

const AdminDashboardTemplate = ({ stats }: AdminDashboardTemplateProps) => {
  const revenueTrend = formatSignedPercent(
    stats.revenueThisMonth,
    stats.revenuePreviousMonth,
  );
  const paidOrderTrend = formatSignedPercent(
    stats.paidOrderCountThisMonth,
    stats.paidOrderCountPreviousMonth,
  );

  const statCards: StatCard[] = [
    {
      title: "등록 상품",
      icon: Package,
      value: stats.totalProducts.toLocaleString(),
      description: "삭제 제외 전체 상품",
      trend:
        stats.productsCreatedThisMonth > 0
          ? { label: `+${stats.productsCreatedThisMonth}개 이번 달`, direction: "up" }
          : null,
    },
    {
      title: "총 매출",
      icon: DollarSign,
      value: `₩${formatPriceWithComma(stats.revenueThisMonth)}`,
      description: "이번 달 결제 완료 기준",
      trend: revenueTrend
        ? { label: `${revenueTrend.label} 지난 달 대비`, direction: revenueTrend.direction }
        : null,
    },
    {
      title: "결제 주문",
      icon: ShoppingCart,
      value: stats.paidOrderCountThisMonth.toLocaleString(),
      description: "이번 달 결제 완료 주문",
      trend: paidOrderTrend
        ? { label: `${paidOrderTrend.label} 지난 달 대비`, direction: paidOrderTrend.direction }
        : null,
    },
    {
      title: "활동 회원",
      icon: Users,
      value: stats.totalUsers.toLocaleString(),
      description: "탈퇴 제외 가입 회원",
      trend:
        stats.usersCreatedThisMonth > 0
          ? { label: `+${stats.usersCreatedThisMonth}명 이번 달`, direction: "up" }
          : null,
    },
  ];

  return (
    <div className="space-y-8">
      <TypographyMuted>
        모바일 청첩장 관리자 대시보드에 오신 것을 환영합니다.
      </TypographyMuted>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground mb-1 text-2xl font-bold">
                {stat.value}
              </div>
              <TypographyMuted className="mb-1">
                {stat.description}
              </TypographyMuted>
              {stat.trend && (
                <TypographySmall
                  className={cn(TREND_DIRECTION_CLASS[stat.trend.direction], "font-medium")}
                >
                  {stat.trend.label}
                </TypographySmall>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <RecentOrdersCard orders={stats.recentOrders} />
    </div>
  );
};

export { AdminDashboardTemplate };
