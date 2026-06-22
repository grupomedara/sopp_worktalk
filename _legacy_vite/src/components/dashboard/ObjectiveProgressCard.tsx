import { Objective } from '@/types';
import { ContextBadge } from '@/components/ui/ContextBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';

interface ObjectiveProgressCardProps {
  objectives: Objective[];
}

// Simulated progress calculation - in real app, this would come from tasks/projects
function calculateProgress(objective: Objective): number {
  const statusProgress: Record<string, number> = {
    'PENDENTE': 0,
    'EM_ANDAMENTO': 50,
    'CONCLUIDO': 100,
    'CANCELADO': 0,
  };
  return statusProgress[objective.status] || 0;
}

export function ObjectiveProgressCard({ objectives }: ObjectiveProgressCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Progresso dos Objetivos</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {objectives.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum objetivo definido
          </p>
        ) : (
          <div className="space-y-4">
            {objectives.slice(0, 4).map((objective) => {
              const progress = calculateProgress(objective);
              return (
                <div key={objective.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {objective.titulo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ContextBadge context={objective.areaDaVida} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
