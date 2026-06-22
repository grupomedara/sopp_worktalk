import { cn } from '@/lib/utils';

export type Priority = 'High' | 'Medium' | 'Low';

const priorityStyles: Record<Priority, string> = {
  High: 'priority-high',
  Medium: 'priority-medium',
  Low: 'priority-low',
};

const priorityLabels: Record<Priority, string> = {
  High: 'Alta',
  Medium: 'Média',
  Low: 'Baixa',
};

interface PriorityIndicatorProps {
  priority: Priority;
  showLabel?: boolean;
  className?: string;
}

export function PriorityIndicator({ priority, showLabel = false, className }: PriorityIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('priority-indicator', priorityStyles[priority])} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{priorityLabels[priority]}</span>
      )}
    </div>
  );
}
