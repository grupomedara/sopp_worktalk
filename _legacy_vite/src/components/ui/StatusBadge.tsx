import { Status } from '@/types';
import { cn } from '@/lib/utils';

const statusStyles: Record<Status, string> = {
  PENDENTE: 'bg-status-pending/10 text-status-pending',
  EM_ANDAMENTO: 'bg-status-active/10 text-status-active',
  CONCLUIDO: 'bg-status-done/10 text-status-done',
  CANCELADO: 'bg-status-cancelled/10 text-status-cancelled',
};

const statusLabels: Record<Status, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
