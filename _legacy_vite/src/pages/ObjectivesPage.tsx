import { useState } from 'react';
import { Plus, Target, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextBadge } from '@/components/ui/ContextBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { mockObjectives } from '@/data/mockData';
import { Objective } from '@/types';

export default function ObjectivesPage() {
  const [objectives] = useState<Objective[]>(mockObjectives);

  const activeObjectives = objectives.filter(o => o.status === 'EM_ANDAMENTO' || o.status === 'PENDENTE');
  const completedObjectives = objectives.filter(o => o.status === 'CONCLUIDO');

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Objetivos"
        description="Defina e acompanhe seus objetivos de vida"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Objetivo
          </Button>
        }
      />
      
      <div className="p-6 space-y-8">
        {/* Active Objectives */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Objetivos Ativos ({activeObjectives.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeObjectives.map((objective) => (
              <ObjectiveCard key={objective.id} objective={objective} />
            ))}
          </div>
          {activeObjectives.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum objetivo ativo</p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro objetivo
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Completed Objectives */}
        {completedObjectives.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Objetivos Concluídos ({completedObjectives.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedObjectives.map((objective) => (
                <ObjectiveCard key={objective.id} objective={objective} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

interface ObjectiveCardProps {
  objective: Objective;
}

function ObjectiveCard({ objective }: ObjectiveCardProps) {
  // Mock progress - in real app, calculate from tasks/projects
  const progress = objective.status === 'CONCLUIDO' ? 100 : 
                   objective.status === 'EM_ANDAMENTO' ? 45 : 0;

  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-sidebar-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <ContextBadge context={objective.areaDaVida} />
              <StatusBadge status={objective.status} />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-sidebar-primary transition-colors">
              {objective.titulo}
            </h3>
            {objective.metrica && (
              <p className="text-sm text-muted-foreground mt-1">
                Meta: {objective.metrica}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-sidebar-primary transition-colors" />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {objective.prazo && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Prazo: {format(objective.prazo, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        )}

        {objective.motivacao && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2 italic">
            "{objective.motivacao}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}
