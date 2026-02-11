import { useCustomerStats, useRevenueStats } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

interface MetricRowProps {
  label: string;
  value: string | number;
  progress?: number;
  subtext?: string;
}

function MetricRow({ label, value, progress, subtext }: MetricRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      {progress !== undefined && <Progress value={progress} className="h-2" />}
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

export function CustomerMetricsPanel() {
  const { data: customerStats, isLoading: customersLoading } =
    useCustomerStats("month");
  const { data: revenueStats, isLoading: revenueLoading } =
    useRevenueStats("month");

  const isLoading = customersLoading || revenueLoading;

  if (isLoading) {
    return (
      <Card className="shadow-soft h-full">
        <CardHeader>
          <CardTitle className="text-lg font-heading">
            Customer Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!customerStats || !revenueStats) {
    return (
      <Card className="shadow-soft h-full">
        <CardHeader>
          <CardTitle className="text-lg font-heading">
            Customer Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No customer data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const clv =
    customerStats.totalCustomers > 0
      ? revenueStats.totalRevenue / customerStats.totalCustomers
      : 0;

  return (
    <Card className="shadow-soft h-full">
      <CardHeader>
        <CardTitle className="text-lg font-heading">Customer Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <MetricRow
          label="Repeat Purchase Rate"
          value={`${customerStats.repeatRate.toFixed(1)}%`}
          progress={customerStats.repeatRate}
        />

        <MetricRow
          label="Total Customers"
          value={customerStats.totalCustomers}
          subtext={`${customerStats.newCustomers} new this period`}
        />

        <MetricRow
          label="Repeat Customers"
          value={customerStats.repeatCustomers}
          subtext="Customers with 2+ orders"
        />

        <MetricRow
          label="Customer Lifetime Value"
          value={`$${clv.toFixed(2)}`}
          subtext="Average revenue per customer"
        />

        <MetricRow
          label="Avg Order Value"
          value={`$${revenueStats.avgOrderValue.toFixed(2)}`}
          subtext="Per transaction"
        />
      </CardContent>
    </Card>
  );
}
