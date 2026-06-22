import { Status } from '@prisma/client';
import { cn } from '@/lib/utils';

const statusStyles: Record<Status, string> = {
  PENDING: 'bg-muted/10 text-muted-foreground border-muted-foreground/20',
  IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
  COMPLETED: 'bg-green-500/10 text-green-500 border-green-500/20',
  ARCHIVED: 'bg-muted/10 text-muted-foreground border-muted-foreground/20',
  CANCELED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<Status, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  ARCHIVED: 'Arquivado',
  CANCELED: 'Cancelado',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-none px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
