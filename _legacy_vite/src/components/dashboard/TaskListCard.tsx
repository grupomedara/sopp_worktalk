import { Task } from '@/types';
import { ContextBadge } from '@/components/ui/ContextBadge';
import { PriorityIndicator } from '@/components/ui/PriorityIndicator';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TaskListCardProps {
  title: string;
  tasks: Task[];
  emptyMessage?: string;
  onTaskToggle?: (taskId: string) => void;
  variant?: 'default' | 'compact';
}

export function TaskListCard({ 
  title, 
  tasks, 
  emptyMessage = 'Nenhuma tarefa',
  onTaskToggle,
  variant = 'default'
}: TaskListCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50',
                  task.status === 'CONCLUIDO' && 'opacity-60'
                )}
              >
                <Checkbox
                  checked={task.status === 'CONCLUIDO'}
                  onCheckedChange={() => onTaskToggle?.(task.id)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    task.status === 'CONCLUIDO' && 'line-through text-muted-foreground'
                  )}>
                    {task.titulo}
                  </p>
                  {variant === 'default' && task.projeto && (
                    <p className="text-xs text-muted-foreground truncate">
                      {task.projeto.nome}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityIndicator priority={task.prioridade} />
                  <ContextBadge context={task.contexto} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
