import { Priority } from '@/types';
import { cn } from '@/lib/utils';

const priorityStyles: Record<Priority, string> = {
  ALTA: 'priority-high',
  MEDIA: 'priority-medium',
  BAIXA: 'priority-low',
};

const priorityLabels: Record<Priority, string> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
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
