import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  variant: 'olive' | 'terracotta' | 'berry' | 'mustard';
  subtitle?: string;
}

const variantStyles = {
  olive: 'from-brand-olive to-brand-olive-dark',
  terracotta: 'from-brand-terracotta to-brand-terracotta-dark',
  berry: 'from-brand-berry to-brand-berry-dark',
  mustard: 'from-brand-mustard to-brand-mustard-light',
};

export function KPICard({ title, value, change, icon: Icon, variant, subtitle }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="relative bg-card rounded-xl p-6 shadow-soft overflow-hidden group hover:shadow-medium transition-shadow">
      {/* Gradient top border */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
        variantStyles[variant]
      )} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-heading font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-sm font-medium',
                isPositive ? 'text-brand-olive' : 'text-destructive'
              )}>
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-lg bg-gradient-to-br text-white',
          variantStyles[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
