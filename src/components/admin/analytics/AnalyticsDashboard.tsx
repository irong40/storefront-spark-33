import {
  useRevenueStats,
  useCustomerStats,
  TimePeriod,
} from "@/hooks/use-analytics";
import { KPICard } from "./KPICard";
import { RevenueChart } from "./RevenueChart";
import { CategoryChart } from "./CategoryChart";
import { TopProductsPanel } from "./TopProductsPanel";
import { CustomerMetricsPanel } from "./CustomerMetricsPanel";
import { PeakHoursPanel } from "./PeakHoursPanel";
import { ActivityFeed } from "./ActivityFeed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";
import { useState } from "react";

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<TimePeriod>("month");
  const { data: revenueStats, isLoading: revenueLoading } =
    useRevenueStats(period);
  const { data: customerStats, isLoading: customerLoading } =
    useCustomerStats(period);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <TabsList>
            <TabsTrigger value="week">Last 7 Days</TabsTrigger>
            <TabsTrigger value="month">Last 30 Days</TabsTrigger>
            <TabsTrigger value="year">Last Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={
            revenueLoading
              ? "..."
              : formatCurrency(revenueStats?.totalRevenue || 0)
          }
          change={revenueStats?.revenueChange}
          icon={DollarSign}
          variant="olive"
        />
        <KPICard
          title="Total Orders"
          value={revenueLoading ? "..." : String(revenueStats?.orderCount || 0)}
          change={revenueStats?.orderChange}
          icon={ShoppingBag}
          variant="terracotta"
        />
        <KPICard
          title="New Customers"
          value={
            customerLoading ? "..." : String(customerStats?.newCustomers || 0)
          }
          change={customerStats?.customerChange}
          icon={Users}
          variant="berry"
        />
        <KPICard
          title="Avg Order Value"
          value={
            revenueLoading
              ? "..."
              : formatCurrency(revenueStats?.avgOrderValue || 0)
          }
          icon={TrendingUp}
          variant="mustard"
          subtitle="Per transaction"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <CategoryChart />
        </div>
      </div>

      {/* Secondary Panels */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TopProductsPanel />
        <CustomerMetricsPanel />
        <PeakHoursPanel />
      </div>

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  );
}
