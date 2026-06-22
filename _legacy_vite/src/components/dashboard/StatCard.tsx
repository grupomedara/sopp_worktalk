import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'highlight' | 'warning';
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: StatCardProps) {
  return (
    <div 
      className={cn(
        'stat-card',
        variant === 'highlight' && 'border-sidebar-primary/20 bg-sidebar-primary/5',
        variant === 'warning' && 'border-priority-high/20 bg-priority-high/5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div 
          className={cn(
            'rounded-lg p-2.5',
            variant === 'default' && 'bg-muted',
            variant === 'highlight' && 'bg-sidebar-primary/10',
            variant === 'warning' && 'bg-priority-high/10'
          )}
        >
          <Icon 
            className={cn(
              'h-5 w-5',
              variant === 'default' && 'text-muted-foreground',
              variant === 'highlight' && 'text-sidebar-primary',
              variant === 'warning' && 'text-priority-high'
            )} 
          />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span 
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-status-done' : 'text-priority-high'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">vs. semana anterior</span>
        </div>
      )}
    </div>
  );
}
