import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendaEvent } from '@/types';
import { ContextBadge } from '@/components/ui/ContextBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface AgendaCardProps {
  events: AgendaEvent[];
}

export function AgendaCard({ events }: AgendaCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Agenda de Hoje</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum compromisso para hoje
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{event.titulo}</p>
                    <ContextBadge context={event.tipo} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(event.dataInicio, "HH:mm", { locale: ptBR })}
                    {event.dataFim && ` - ${format(event.dataFim, "HH:mm", { locale: ptBR })}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
