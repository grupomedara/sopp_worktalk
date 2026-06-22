import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckSquare, AlertTriangle, Target, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { TaskListCard } from '@/components/dashboard/TaskListCard';
import { AgendaCard } from '@/components/dashboard/AgendaCard';
import { ObjectiveProgressCard } from '@/components/dashboard/ObjectiveProgressCard';
import { mockTasks, mockAgenda, mockObjectives, mockProjects } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const today = new Date();
  
  // Filter tasks for today
  const todayTasks = mockTasks.filter(task => {
    if (!task.data) return false;
    return format(task.data, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  // Sort by priority and status
  const priorityOrder = { 'ALTA': 0, 'MEDIA': 1, 'BAIXA': 2 };
  const sortedTodayTasks = [...todayTasks]
    .filter(t => t.status !== 'CONCLUIDO')
    .sort((a, b) => priorityOrder[a.prioridade] - priorityOrder[b.prioridade])
    .slice(0, 3);

  // Overdue tasks
  const overdueTasks = mockTasks.filter(task => {
    if (!task.data) return false;
    return task.data < today && task.status !== 'CONCLUIDO' && task.status !== 'CANCELADO';
  });

  // Active objectives
  const activeObjectives = mockObjectives.filter(o => o.status === 'EM_ANDAMENTO');

  // Today's events - filter and sort by time
  const todayEvents = mockAgenda
    .filter(event => format(event.dataInicio, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime());

  // Calculate study hours (mock)
  const studyHoursWeek = 8.5;

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Dashboard"
        description={format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tarefas Hoje"
            value={todayTasks.length}
            description={`${sortedTodayTasks.length} pendentes`}
            icon={CheckSquare}
            variant="highlight"
          />
          <StatCard
            title="Atrasadas"
            value={overdueTasks.length}
            description="Requerem atenção"
            icon={AlertTriangle}
            variant={overdueTasks.length > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Objetivos Ativos"
            value={activeObjectives.length}
            description="Em andamento"
            icon={Target}
          />
          <StatCard
            title="Horas de Estudo"
            value={`${studyHoursWeek}h`}
            description="Esta semana"
            icon={BookOpen}
            trend={{ value: 12, isPositive: true }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <TaskListCard
              title="Top 3 Prioridades do Dia"
              tasks={sortedTodayTasks}
              emptyMessage="Nenhuma tarefa prioritária para hoje"
            />
            
            {overdueTasks.length > 0 && (
              <TaskListCard
                title="Tarefas Atrasadas"
                tasks={overdueTasks}
                variant="compact"
              />
            )}
          </div>

          {/* Right Column - Agenda & Objectives */}
          <div className="space-y-6">
            <AgendaCard events={todayEvents} />
            <ObjectiveProgressCard objectives={activeObjectives} />
          </div>
        </div>
      </div>
    </div>
  );
}
