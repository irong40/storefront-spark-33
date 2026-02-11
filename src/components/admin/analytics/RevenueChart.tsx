import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSalesTimeSeries, TimePeriod } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function RevenueChart() {
  const [period, setPeriod] = useState<TimePeriod>("month");
  const { data, isLoading } = useSalesTimeSeries(period);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-heading">Revenue & Orders</CardTitle>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <TabsList className="h-8">
            <TabsTrigger value="week" className="text-xs px-3">
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-3">
              Month
            </TabsTrigger>
            <TabsTrigger value="year" className="text-xs px-3">
              Year
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !data || data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No sales data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  name === "revenue" ? `$${value.toFixed(2)}` : value,
                  name === "revenue" ? "Revenue" : "Orders",
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--brand-olive))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--brand-olive))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--brand-olive))" }}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--brand-terracotta))"
                strokeWidth={2}
                dot={{
                  fill: "hsl(var(--brand-terracotta))",
                  strokeWidth: 0,
                  r: 4,
                }}
                activeDot={{ r: 6, fill: "hsl(var(--brand-terracotta))" }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
