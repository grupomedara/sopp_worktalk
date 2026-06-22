import { useState } from 'react';
import { Plus, FolderKanban, Calendar, ChevronRight, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContextBadge } from '@/components/ui/ContextBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockProjects, mockObjectives, mockTasks } from '@/data/mockData';
import { Project, Context } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Context | 'ALL'>('ALL');

  const filteredProjects = filter === 'ALL' 
    ? mockProjects 
    : mockProjects.filter(p => p.contexto === filter);

  const activeProjects = filteredProjects.filter(p => p.status === 'EM_ANDAMENTO' || p.status === 'PENDENTE');
  const completedProjects = filteredProjects.filter(p => p.status === 'CONCLUIDO');

  const getObjective = (objectiveId?: string) => {
    if (!objectiveId) return null;
    return mockObjectives.find(o => o.id === objectiveId);
  };

  const getTaskCount = (projectId: string) => {
    return mockTasks.filter(t => t.projetoId === projectId).length;
  };

  const getCompletedTaskCount = (projectId: string) => {
    return mockTasks.filter(t => t.projetoId === projectId && t.status === 'CONCLUIDO').length;
  };

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Projetos"
        description="Organize e acompanhe seus projetos"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filter === 'ALL' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('ALL')}
          >
            Todos
          </Button>
          <Button 
            variant={filter === 'EMPRESA' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('EMPRESA')}
          >
            Empresa
          </Button>
          <Button 
            variant={filter === 'FAMILIA' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('FAMILIA')}
          >
            Família
          </Button>
          <Button 
            variant={filter === 'ESTUDO' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('ESTUDO')}
          >
            Estudo
          </Button>
          <Button 
            variant={filter === 'PESSOAL' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('PESSOAL')}
          >
            Pessoal
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Ativos ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídos ({completedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  objective={getObjective(project.objetivoId)}
                  taskCount={getTaskCount(project.id)}
                  completedTaskCount={getCompletedTaskCount(project.id)}
                />
              ))}
            </div>
            {activeProjects.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum projeto ativo</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  objective={getObjective(project.objetivoId)}
                  taskCount={getTaskCount(project.id)}
                  completedTaskCount={getCompletedTaskCount(project.id)}
                />
              ))}
            </div>
            {completedProjects.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Nenhum projeto concluído</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  objective?: { titulo: string } | null;
  taskCount: number;
  completedTaskCount: number;
}

function ProjectCard({ project, objective, taskCount, completedTaskCount }: ProjectCardProps) {
  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-sidebar-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <ContextBadge context={project.contexto} />
            <StatusBadge status={project.status} />
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-sidebar-primary transition-colors" />
        </div>

        <h3 className="font-semibold text-foreground group-hover:text-sidebar-primary transition-colors">
          {project.nome}
        </h3>

        {objective && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            <span className="truncate">{objective.titulo}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{completedTaskCount}</span>/{taskCount} tarefas
          </div>
          {project.prazo && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(project.prazo, "d MMM", { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
