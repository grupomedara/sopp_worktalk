import { useState } from 'react';
import { Plus, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockStudies } from '@/data/mockData';
import { Study } from '@/types';

export default function StudiesPage() {
  const [studies] = useState<Study[]>(mockStudies);

  const inProgressStudies = studies.filter(s => s.status === 'EM_ANDAMENTO' || s.status === 'PENDENTE');
  const completedStudies = studies.filter(s => s.status === 'CONCLUIDO');

  const totalHours = studies.reduce((acc, s) => acc + (s.tempoDedicado || 0), 0) / 60;

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Estudos"
        description="Registre e acompanhe seu aprendizado"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Estudo
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-context-study-bg p-2.5">
                  <BookOpen className="h-5 w-5 text-context-study" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Estudos</p>
                  <p className="text-2xl font-bold">{studies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-status-active/10 p-2.5">
                  <Clock className="h-5 w-5 text-status-active" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Dedicadas</p>
                  <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-status-done/10 p-2.5">
                  <BookOpen className="h-5 w-5 text-status-done" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold">{completedStudies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* In Progress */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Em Andamento ({inProgressStudies.length})</h2>
          <div className="space-y-3">
            {inProgressStudies.map((study) => (
              <StudyCard key={study.id} study={study} />
            ))}
            {inProgressStudies.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum estudo em andamento</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Completed */}
        {completedStudies.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Concluídos ({completedStudies.length})</h2>
            <div className="space-y-3">
              {completedStudies.map((study) => (
                <StudyCard key={study.id} study={study} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

interface StudyCardProps {
  study: Study;
}

function StudyCard({ study }: StudyCardProps) {
  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-context-study/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-context-study">{study.curso}</span>
              {study.disciplina && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{study.disciplina}</span>
                </>
              )}
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-context-study transition-colors">
              {study.tema}
            </h3>
            {study.conteudo && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {study.conteudo}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={study.status} />
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-context-study transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
          {study.tempoDedicado && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{Math.floor(study.tempoDedicado / 60)}h {study.tempoDedicado % 60}min</span>
            </div>
          )}
          <span>{format(study.createdAt, "d 'de' MMMM", { locale: ptBR })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
