import { useState } from 'react';
import { Plus, Filter, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ContextBadge } from '@/components/ui/ContextBadge';
import { PriorityIndicator } from '@/components/ui/PriorityIndicator';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockTasks, mockProjects } from '@/data/mockData';
import { Task, Context } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<Context | 'ALL'>('ALL');

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === 'CONCLUIDO' ? 'PENDENTE' : 'CONCLUIDO' }
          : task
      )
    );
  };

  const filteredTasks = filter === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.contexto === filter);

  const pendingTasks = filteredTasks.filter(t => t.status !== 'CONCLUIDO' && t.status !== 'CANCELADO');
  const completedTasks = filteredTasks.filter(t => t.status === 'CONCLUIDO');

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return mockProjects.find(p => p.id === projectId)?.nome;
  };

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Tarefas"
        description="Gerencie suas tarefas e prioridades"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
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
            Todas
          </Button>
          <Button 
            variant={filter === 'EMPRESA' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('EMPRESA')}
            className={filter === 'EMPRESA' ? '' : 'hover:bg-context-work-bg hover:text-context-work-foreground'}
          >
            Empresa
          </Button>
          <Button 
            variant={filter === 'FAMILIA' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('FAMILIA')}
            className={filter === 'FAMILIA' ? '' : 'hover:bg-context-family-bg hover:text-context-family-foreground'}
          >
            Família
          </Button>
          <Button 
            variant={filter === 'ESTUDO' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('ESTUDO')}
            className={filter === 'ESTUDO' ? '' : 'hover:bg-context-study-bg hover:text-context-study-foreground'}
          >
            Estudo
          </Button>
          <Button 
            variant={filter === 'PESSOAL' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('PESSOAL')}
            className={filter === 'PESSOAL' ? '' : 'hover:bg-context-personal-bg hover:text-context-personal-foreground'}
          >
            Pessoal
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {pendingTasks.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Nenhuma tarefa pendente</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingTasks.map((task) => (
                      <TaskRow 
                        key={task.id} 
                        task={task} 
                        projectName={getProjectName(task.projetoId)}
                        onToggle={() => toggleTask(task.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {completedTasks.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Nenhuma tarefa concluída</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {completedTasks.map((task) => (
                      <TaskRow 
                        key={task.id} 
                        task={task} 
                        projectName={getProjectName(task.projetoId)}
                        onToggle={() => toggleTask(task.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  projectName?: string | null;
  onToggle: () => void;
}

function TaskRow({ task, projectName, onToggle }: TaskRowProps) {
  const isCompleted = task.status === 'CONCLUIDO';
  
  return (
    <div 
      className={cn(
        'flex items-center gap-4 p-4 transition-colors hover:bg-muted/30',
        isCompleted && 'opacity-60'
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        className="shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium',
          isCompleted && 'line-through text-muted-foreground'
        )}>
          {task.titulo}
        </p>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          {projectName && (
            <span className="truncate">{projectName}</span>
          )}
          {task.data && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(task.data, "d MMM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <PriorityIndicator priority={task.prioridade} showLabel />
        <ContextBadge context={task.contexto} />
      </div>
    </div>
  );
}
