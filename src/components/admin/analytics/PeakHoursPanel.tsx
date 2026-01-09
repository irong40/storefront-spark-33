import { useOrderHourlyDistribution } from '@/hooks/use-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function formatHour(hour: number): string {
  if (hour === 12) return '12p';
  if (hour > 12) return `${hour - 12}p`;
  return `${hour}a`;
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return 'bg-muted/30';
  const intensity = count / max;
  if (intensity > 0.75) return 'bg-brand-berry';
  if (intensity > 0.5) return 'bg-brand-terracotta';
  if (intensity > 0.25) return 'bg-brand-mustard';
  return 'bg-brand-olive/50';
}

export function PeakHoursPanel() {
  const { data, isLoading } = useOrderHourlyDistribution();

  if (isLoading) {
    return (
      <Card className="shadow-soft h-full">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Peak Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-soft h-full">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Peak Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <p>No order time data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  // Create a lookup map for quick access
  const dataMap = new Map(data.map(d => [`${d.day}-${d.hour}`, d.count]));

  return (
    <Card className="shadow-soft h-full">
      <CardHeader>
        <CardTitle className="text-lg font-heading">Peak Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-10" /> {/* Spacer for day labels */}
              {HOURS.filter((_, i) => i % 2 === 0).map(hour => (
                <div key={hour} className="flex-1 text-center">
                  <span className="text-[10px] text-muted-foreground">{formatHour(hour)}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-0.5 mb-0.5">
                <div className="w-10 text-xs text-muted-foreground pr-2 text-right">
                  {day}
                </div>
                {HOURS.map(hour => {
                  const count = dataMap.get(`${dayIndex}-${hour}`) || 0;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        'flex-1 aspect-square rounded-sm transition-colors',
                        getHeatColor(count, maxCount)
                      )}
                      title={`${day} ${formatHour(hour)}: ${count} orders`}
                    />
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-muted/30" />
                <div className="w-3 h-3 rounded-sm bg-brand-olive/50" />
                <div className="w-3 h-3 rounded-sm bg-brand-mustard" />
                <div className="w-3 h-3 rounded-sm bg-brand-terracotta" />
                <div className="w-3 h-3 rounded-sm bg-brand-berry" />
              </div>
              <span>High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
