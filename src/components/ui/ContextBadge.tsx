import { Context } from '@prisma/client';
import { cn } from '@/lib/utils';

const contextStyles: Record<Context, string> = {
  SAUDE: 'context-badge-saude',
  INTELECTUAL: 'context-badge-intelectual',
  EMOCIONAL: 'context-badge-emocional',
  REALIZACAO: 'context-badge-realizacao',
  FINANCEIRO: 'context-badge-financeiro',
  SOCIAL: 'context-badge-social',
  FAMILIA: 'context-badge-familia',
  RELACIONAMENTO: 'context-badge-relacionamento',
  VIDA_SOCIAL: 'context-badge-vida-social',
  LAZER: 'context-badge-lazer',
  FELICIDADE: 'context-badge-felicidade',
  ESPIRITUAL: 'context-badge-espiritual',
  // Keep old ones for temporary compatibility during migration
  EMPRESA: 'context-badge-realizacao',
  ESTUDO: 'context-badge-intelectual',
  PESSOAL: 'context-badge-saude',
};

const contextLabels: Record<Context, string> = {
  SAUDE: 'Saúde e Disposição',
  INTELECTUAL: 'Desenv. Intelectual',
  EMOCIONAL: 'Equilíbrio Emocional',
  REALIZACAO: 'Realização e Propósito',
  FINANCEIRO: 'Recurso Financeiro',
  SOCIAL: 'Contribuição Social',
  FAMILIA: 'Família',
  RELACIONAMENTO: 'Relacionamento Amoroso',
  VIDA_SOCIAL: 'Vida Social',
  LAZER: 'Hobby e Lazer',
  FELICIDADE: 'Felicidade e Plenitude',
  ESPIRITUAL: 'Espiritualidade',
  // Legacy mappings for display
  EMPRESA: 'Realização (Legacy)',
  ESTUDO: 'Intelectual (Legacy)',
  PESSOAL: 'Saúde (Legacy)',
};

interface ContextBadgeProps {
  context: Context | null | undefined;
  className?: string;
}

export function ContextBadge({ context, className }: ContextBadgeProps) {
  if (!context) return null;
  return (
    <span className={cn('context-badge', contextStyles[context], className)}>
      {contextLabels[context]}
    </span>
  );
}
