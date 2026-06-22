import { useState } from 'react';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContextBadge } from '@/components/ui/ContextBadge';
import { mockAgenda } from '@/data/mockData';
import { AgendaEvent } from '@/types';
import { cn } from '@/lib/utils';

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState<AgendaEvent[]>(mockAgenda);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => {
    return events
      .filter(event => isSameDay(event.dataInicio, day))
      .sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime());
  };

  const isToday = (day: Date) => isSameDay(day, new Date());

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Agenda"
        description="Visualize e gerencie seus compromissos"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        }
      />
      
      <div className="p-6 flex-1 flex flex-col">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold">
              {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4 flex-1">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);

            return (
              <div key={day.toISOString()} className="flex flex-col">
                <div 
                  className={cn(
                    'text-center pb-3 mb-3 border-b',
                    today && 'text-sidebar-primary'
                  )}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {format(day, 'EEE', { locale: ptBR })}
                  </p>
                  <p 
                    className={cn(
                      'text-2xl font-bold mt-1',
                      today && 'bg-sidebar-primary text-sidebar-primary-foreground rounded-full w-10 h-10 mx-auto flex items-center justify-center'
                    )}
                  >
                    {format(day, 'd')}
                  </p>
                </div>

                <div className="flex-1 space-y-2">
                  {dayEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Sem eventos</p>
                    </div>
                  ) : (
                    dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} compact />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface EventCardProps {
  event: AgendaEvent;
  compact?: boolean;
}

function EventCard({ event, compact }: EventCardProps) {
  return (
    <Card className="cursor-pointer transition-all hover:shadow-md group">
      <CardContent className={cn('p-3', compact && 'p-2')}>
        <ContextBadge context={event.tipo} className="mb-2" />
        <p className={cn(
          'font-medium text-foreground group-hover:text-sidebar-primary transition-colors',
          compact ? 'text-xs line-clamp-2' : 'text-sm'
        )}>
          {event.titulo}
        </p>
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {format(event.dataInicio, 'HH:mm', { locale: ptBR })}
            {event.dataFim && ` - ${format(event.dataFim, 'HH:mm', { locale: ptBR })}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
