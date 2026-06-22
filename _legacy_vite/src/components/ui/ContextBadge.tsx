import { Context, AgendaType } from '@/types';
import { cn } from '@/lib/utils';

const contextStyles: Record<Context | AgendaType, string> = {
  FAMILIA: 'context-badge-family',
  EMPRESA: 'context-badge-work',
  ESTUDO: 'context-badge-study',
  PESSOAL: 'context-badge-personal',
  TRABALHO: 'context-badge-work',
  ESPIRITUAL: 'context-badge-spiritual',
};

const contextLabels: Record<Context | AgendaType, string> = {
  FAMILIA: 'Família',
  EMPRESA: 'Empresa',
  ESTUDO: 'Estudo',
  PESSOAL: 'Pessoal',
  TRABALHO: 'Trabalho',
  ESPIRITUAL: 'Espiritual',
};

interface ContextBadgeProps {
  context: Context | AgendaType;
  className?: string;
}

export function ContextBadge({ context, className }: ContextBadgeProps) {
  return (
    <span className={cn('context-badge', contextStyles[context], className)}>
      {contextLabels[context]}
    </span>
  );
}
