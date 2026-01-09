import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useCategoryDistribution } from '@/hooks/use-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = [
  'hsl(var(--brand-olive))',
  'hsl(var(--brand-berry))',
  'hsl(var(--brand-terracotta))',
  'hsl(var(--brand-mustard))',
  'hsl(var(--brand-olive-light))',
  'hsl(var(--brand-berry-light))',
];

export function CategoryChart() {
  const { data, isLoading } = useCategoryDistribution();

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-heading">Sales by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : !data || data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No category data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
